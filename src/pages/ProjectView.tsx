import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ProjectPhase } from '../types/project';
import {
  ArrowLeft,
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Layers,
  Database,
  Globe,
  Layout,
  Server,
  User as UserIcon,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'AI' | 'USER';
  text: string;
  timestamp: string;
  isBlocking?: boolean;
}

const PHASES: { id: ProjectPhase; name: string; icon: React.ElementType }[] = [
  { id: 'PHASE_A_PROBLEM', name: 'A. Definición & MVP', icon: Layers },
  { id: 'PHASE_B_DATABASE', name: 'B. Base de Datos', icon: Database },
  { id: 'PHASE_C_API', name: 'C. Backend & API', icon: Globe },
  { id: 'PHASE_D_FRONTEND', name: 'D. Frontend UI', icon: Layout },
  { id: 'PHASE_E_ARCHITECTURE', name: 'E. Arquitectura', icon: Server },
];

export const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activePhase, setActivePhase] = useState<ProjectPhase>('PHASE_A_PROBLEM');
  const [inputMessage, setInputMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [hasBlockingQuestion, setHasBlockingQuestion] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'AI',
      text: '¡Hola! Soy Ideator, tu arquitecto de software asistido por IA. Comencemos con la Fase A: Definición del Producto y Alcance del MVP.\n\nHe leído tu idea inicial sobre LegisApp (Observatorio Legislativo). Para acotar el MVP sin alucinar requerimientos, necesito aclarar este punto clave:',
      timestamp: '22:00',
    },
    {
      id: 'm2',
      sender: 'AI',
      text: '⚠️ PREGUNTA BLOQUEANTE: ¿El sistema en su primera versión permitirá a los parlamentarios realizar firmas electrónicas y sustituciones oficiales de votos, o únicamente será un observatorio de consulta pública de boletines y plazos del Senado?',
      timestamp: '22:01',
      isBlocking: true,
    },
  ]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAiTyping) return;

    const userMsg: ChatMessage = {
      id: 'msg_' + Date.now(),
      sender: 'USER',
      text: inputMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsAiTyping(true);

    // Simulación de respuesta de Gemini API (backend en Sprint 2)
    setTimeout(() => {
      setIsAiTyping(false);
      setHasBlockingQuestion(false);

      const aiReply: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        sender: 'AI',
        text: 'Excelente decisión de diseño. Al dejar las firmas electrónicas para una fase posterior, delimitamos el MVP a un Observatorio de Alta Disponibilidad con scraping programado.\n\n¿Quiénes serán los usuarios autenticados que podrán crear alertas personalizadas sobre los boletines legislativos?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiReply]);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Header del Proyecto y Selector de Fases */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900">Proyecto: LegisApp</h1>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100 uppercase tracking-wider">
                  ID: {id || 'demo'}
                </span>
              </div>
              <p className="text-xs text-slate-500">2 Colaboradores activos</p>
            </div>
          </div>

          {/* Stepper de Fases A-E */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
            {PHASES.map((phase) => {
              const Icon = phase.icon;
              const isActive = activePhase === phase.id;
              return (
                <button
                  key={phase.id}
                  onClick={() => setActivePhase(phase.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{phase.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido Central: Chat de Ideación */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col">
        {/* Banner de Pregunta Bloqueante si existe */}
        {hasBlockingQuestion && (
          <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800">
              <span className="font-bold block text-amber-900 mb-0.5">Pregunta Bloqueante en curso (Regla de Oro)</span>
              Ideator ha detectado que falta una decisión crítica sobre el alcance del MVP. Por favor responde a la pregunta de la IA para desbloquear la definición de la Base de Datos.
            </div>
          </div>
        )}

        {/* Ventana de Mensajes */}
        <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm overflow-y-auto space-y-4 mb-4 min-h-[400px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-2xl ${msg.sender === 'USER' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.sender === 'AI'
                    ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-50'
                    : 'bg-slate-800 text-white'
                }`}
              >
                {msg.sender === 'AI' ? <Sparkles className="w-4 h-4" /> : <UserIcon className="w-4 h-4" />}
              </div>

              <div
                className={`rounded-2xl p-4 text-xs leading-relaxed ${
                  msg.sender === 'USER'
                    ? 'bg-indigo-600 text-white rounded-tr-none'
                    : msg.isBlocking
                    ? 'bg-amber-50 border border-amber-200 text-amber-900 rounded-tl-none font-medium'
                    : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
                <span
                  className={`block text-[10px] mt-2 font-mono ${
                    msg.sender === 'USER' ? 'text-indigo-200' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isAiTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-400 italic">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-indigo-500" />
              <span>Gemini está razonando sobre la consistencia del software...</span>
            </div>
          )}
        </div>

        {/* Barra de Entrada de Mensajes */}
        <form onSubmit={handleSendMessage} className="relative flex items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Responde a Ideator con decisiones de negocio o requerimientos..."
            className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isAiTyping}
            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all disabled:opacity-40 disabled:hover:bg-indigo-600"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </main>
    </div>
  );
};
