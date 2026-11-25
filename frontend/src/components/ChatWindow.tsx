// SCRUM-28: Componente de interfaz de usuario para el dialogo iterativo entre el usuario y la IA con persistencia integral.
import React, { useState, useEffect, FormEvent } from "react";
import { getApiErrorMessage } from "../lib/api";
import { phaseService } from "../services/phaseService";
import type { AiAnalysisResponse, ChatMessageItem } from "../types/phase";
import { AlertTriangle, CheckCircle2, HelpCircle, Loader2, Send } from "lucide-react";

export const ChatWindow: React.FC<{ projectId: string; onReadyForPhaseB?: () => void }> = ({
  projectId,
  onReadyForPhaseB,
}) => {
  const [messages, setMessages] = useState<ChatMessageItem[]>(() => {
    try {
      const saved = localStorage.getItem(`ideator_chat_${projectId}`);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [readyForPhaseB, setReadyForPhaseB] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`ideator_chat_${projectId}`);
      if (saved) {
        const parsed: ChatMessageItem[] = JSON.parse(saved);
        return parsed.some((m) => m.status === "LISTO_FASE_B");
      }
    } catch {}
    return false;
  });
  const [errorMessage, setErrorMessage] = useState("");

  // Carga e hidratación del historial desde PostgreSQL y sincronización con localStorage
  useEffect(() => {
    let isMounted = true;
    const loadChatHistory = async () => {
      try {
        const history = await phaseService.getChatMessages(projectId);
        if (isMounted && history && history.length > 0) {
          setMessages(history);
          try {
            localStorage.setItem(`ideator_chat_${projectId}`, JSON.stringify(history));
          } catch {}
          if (history.some((m) => m.status === "LISTO_FASE_B")) {
            setReadyForPhaseB(true);
          }
        }
      } catch (e) {
        console.warn("No se pudo sincronizar el historial de chat desde PostgreSQL:", e);
      }
    };
    void loadChatHistory();
    return () => {
      isMounted = false;
    };
  }, [projectId]);

  const fetchChat = async (userMessage: string) => {
    setLoading(true);
    setErrorMessage("");
    try {
      const data: AiAnalysisResponse = await phaseService.sendChatMessage(projectId, userMessage);
      const newMessage: ChatMessageItem = {
        id: Date.now().toString(),
        sender: "AI",
        content: data.respuestaAlUsuario,
        status: data.estado,
        timestamp: new Date().toLocaleTimeString(),
        analysis: data.analisisInterno,
        blockingQuestions: data.preguntasBloqueantes,
      };
      setMessages((prev) => {
        const next = [...prev, newMessage];
        try {
          localStorage.setItem(`ideator_chat_${projectId}`, JSON.stringify(next));
        } catch {}
        return next;
      });
      setBlocked(data.estado === "BLOQUEO");
      if (data.estado === "LISTO_FASE_B") {
        setReadyForPhaseB(true);
        if (onReadyForPhaseB) onReadyForPhaseB();
      }
    } catch (e) {
      setErrorMessage(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    const userMsg: ChatMessageItem = {
      id: Date.now().toString(),
      sender: "USER",
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setMessages((prev) => {
      const next = [...prev, userMsg];
      try {
        localStorage.setItem(`ideator_chat_${projectId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
    const messageToSend = input.trim();
    setInput("");
    fetchChat(messageToSend);
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Fase A: Contexto del Negocio y MVP</h3>
          <p className="text-xs text-slate-500">Agente: ideator-context-agent (Azure AI Foundry)</p>
        </div>
        {readyForPhaseB ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Listo para Fase B
          </span>
        ) : blocked ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Bloqueo por información
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <HelpCircle className="w-3.5 h-3.5" />
            En conversación
          </span>
        )}
      </div>

      <div className="p-6 space-y-4 max-h-[460px] overflow-y-auto">
        {messages.length === 0 ? (
          <div className="text-center py-10 text-slate-400">
            <p className="text-sm font-medium">Describe el problema de negocio, público objetivo y alcance de tu MVP.</p>
            <p className="text-xs mt-1">El agente analizará tu idea y te guiará hasta completar la Fase A.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "USER" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-sm ${
                  msg.sender === "USER"
                    ? "bg-indigo-600 text-white rounded-br-none"
                    : "bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none"
                }`}
              >
                <div className="font-semibold text-[10px] opacity-75 mb-1">
                  {msg.sender === "USER" ? "Tú" : "Ideator AI"} • {msg.timestamp}
                </div>
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {msg.analysis && (
                  <details className="mt-2.5 pt-2 border-t border-slate-200/60 text-[11px] text-slate-600">
                    <summary className="cursor-pointer font-semibold hover:text-indigo-600">
                      Ver razonamiento interno del agente
                    </summary>
                    <p className="mt-1 p-2 bg-white/70 rounded border border-slate-200/50 font-mono text-[10px]">
                      {msg.analysis}
                    </p>
                  </details>
                )}

                {msg.blockingQuestions && msg.blockingQuestions.length > 0 && (
                  <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px]">
                    <span className="font-bold flex items-center gap-1 mb-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      Preguntas requeridas para desbloquear:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {msg.blockingQuestions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 p-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Ideator Context Agent está pensando...
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {errorMessage}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border border-slate-300 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          placeholder="Escribe tu mensaje, requerimientos o respuesta a las preguntas..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Enviar
        </button>
      </form>
    </div>
  );
};
