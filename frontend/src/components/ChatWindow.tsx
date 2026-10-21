// SCRUM-28: Componente de interfaz de usuario para el dialogo iterativo entre el usuario y la IA.
import React, { useState, useEffect, FormEvent } from "react";
import axios from "axios";

interface Message {
  id: string;
  sender: "USER" | "AI";
  content: string;
  status?: "LISTO_FASE_B" | "BLOQUEO" | "PREGUNTANDO";
}

export const ChatWindow: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [readyForPhaseB, setReadyForPhaseB] = useState(false);

  const fetchChat = async (userMessage: string) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `/api/v1/projects/${projectId}/chat`,
        { content: userMessage }
      );
      const data = response.data as {
        analisisInterno: string;
        estado: string;
        respuestaAlUsuario: string;
        preguntasBloqueantes: string[];
      };
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: "AI",
        content: data.respuestaAlUsuario,
        status: data.estado as any,
      };
      setMessages((prev) => [...prev, newMessage]);
      setBlocked(data.estado === "BLOQUEO");
      setReadyForPhaseB(data.estado === "LISTO_FASE_B");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "USER",
      content: input.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    fetchChat(userMsg.content);
  };

  return (
    <div className="chat-window border rounded p-4 w-full max-w-2xl mx-auto">
      <div className="messages space-y-4 mb-4 max-h-80 overflow-y-auto">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "USER" ? "justify-end" : "justify-start"}`}>
            <div
              className={`p-2 rounded ${{
                USER: "bg-blue-200 text-black",
                AI: "bg-gray-200 text-black",
              }[msg.sender]}`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-gray-500 italic">Ideator está pensando...</div>
        )}
        {blocked && (
          <div className="text-red-600 font-bold">Estado: BLOQUEO – Se requieren datos adicionales.</div>
        )}
        {readyForPhaseB && (
          <div className="text-yellow-600 font-bold">Estado: LISTO_FASE_B – Puede avanzar.</div>
        )}
      </div>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 border rounded p-2"
          placeholder="Escribe tu mensaje..."
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || (!readyForPhaseB && blocked)}
          className="bg-green-500 text-white rounded px-4 py-2 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
};
