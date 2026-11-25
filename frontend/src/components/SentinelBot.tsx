import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ShieldAlert,
  Zap,
} from 'lucide-react';

export type BotMood = 'idle' | 'warning' | 'thinking' | 'celebrating' | 'adversarial';

interface SentinelBotProps {
  currentPhaseLetter: string;
  phaseName: string;
  isPhaseReady?: boolean;
  hasErrors?: boolean;
  isLoading?: boolean;
  onActionClick?: (actionId: string) => void;
}

interface PhaseAdvice {
  mission: string;
  warning: string;
  approvalChecklist: string[];
  actionLabel?: string;
  actionId?: string;
}

const PHASE_KNOWLEDGE: Record<string, PhaseAdvice> = {
  A: {
    mission: 'Validar dolor de mercado real y blindar el foso antes de diseñar código.',
    warning: 'Atención: valida qué quejas existen en foros y qué hace a tu solución no-obvia frente a clones.',
    approvalChecklist: [
      'Dolor de mercado concreto identificado',
      'Persona y frustración con alternativas actuales definida',
      'Foso defensivo (Novelty Gap) especificado',
      'PRD generado y revisado',
    ],
    actionLabel: 'Ver Especificación PRD',
    actionId: 'open-prd',
  },
  B: {
    mission: 'Diseñar el modelo relacional físico en 3NF con integridad referencial.',
    warning: 'Asegúrate de incluir claves foráneas explícitas y campos de auditoría (created_at).',
    approvalChecklist: [
      'Claves primarias y foráneas explícitas',
      'Campos sensibles protegidos (hashes)',
      'Índices previstos en columnas de búsqueda',
    ],
    actionLabel: 'Validar Integridad Relacional',
    actionId: 'check-db',
  },
  C: {
    mission: 'Establecer contratos RESTful, verbos HTTP y códigos de estado estándar.',
    warning: 'Evita verbos en las rutas. Todo endpoint de mutación debe especificar su DTO de entrada.',
    approvalChecklist: [
      'Endpoints versionados (/api/v1/...)',
      'Mapeo exhaustivo de errores 4xx/5xx',
      'Respuestas JSON normalizadas',
    ],
    actionLabel: 'Verificar Contratos REST',
    actionId: 'check-api',
  },
  D: {
    mission: 'Mapear la jerarquía de navegación y componentes de interfaz.',
    warning: 'Diseña con propósito anti-slop: prioriza la densidad justa antes que tarjetas vacías.',
    approvalChecklist: [
      'Rutas públicas vs privadas aisladas',
      'Componentes atómicos reutilizables',
      'Flujos críticos de usuario cubiertos',
    ],
    actionLabel: 'Explorar Mapa UI',
    actionId: 'check-ui',
  },
  E: {
    mission: 'Blindaje de ciberseguridad AppSec basado en OWASP Top 10 y Azure Key Vault.',
    warning: 'Alerta: ningún secreto o API Key en el código. Exige JWT expirations y sanitización.',
    approvalChecklist: [
      'Mitigación contra SQLi y XSS',
      'Secretos delegados a Azure Key Vault',
      'Mecanismos de Rate Limiting y CORS',
    ],
    actionLabel: 'Auditar Ciberseguridad',
    actionId: 'check-sec',
  },
  F: {
    mission: 'Estructurar la pirámide de aseguramiento de calidad (Unit, Integration, E2E).',
    warning: 'Asegura una base sólida de pruebas unitarias sobre reglas de negocio.',
    approvalChecklist: [
      'Meta de cobertura definida (ej. 80%+)',
      'Casos de borde documentados',
      'Pruebas de integración con DB real',
    ],
    actionLabel: 'Revisar Matriz QA',
    actionId: 'check-qa',
  },
  G: {
    mission: 'Definir arquitectura de contenedores Docker, despliegue y plan de rollback.',
    warning: 'Garantiza servicios stateless y migraciones de base de datos controladas.',
    approvalChecklist: [
      'Imágenes multicapa optimizadas y sin root',
      'Healthchecks activos',
      'Estrategia de rollback automático',
    ],
    actionLabel: 'Inspeccionar Arquitectura',
    actionId: 'check-arch',
  },
  H: {
    mission: 'Control de FinOps y presupuesto mensual de servicios cloud en Azure.',
    warning: 'Los tiers elásticos pueden disparar costos. Define límites presupuestarios y alertas.',
    approvalChecklist: [
      'Tiers mensuales desglosados en USD',
      'Políticas de auto-pause para staging',
      'Alertas de facturación al 80% y 100%',
    ],
    actionLabel: 'Analizar Presupuesto FinOps',
    actionId: 'check-finops',
  },
};

export const SentinelBot: React.FC<SentinelBotProps> = ({
  currentPhaseLetter,
  phaseName: _phaseName,
  isPhaseReady = false,
  hasErrors = false,
  isLoading = false,
  onActionClick,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [manualMood, setManualMood] = useState<BotMood | null>(null);

  // Determinar estado de ánimo reactivo
  let activeMood: BotMood = 'idle';
  if (manualMood) {
    activeMood = manualMood;
  } else if (isLoading) {
    activeMood = 'thinking';
  } else if (hasErrors) {
    activeMood = 'adversarial';
  } else if (isPhaseReady) {
    activeMood = 'celebrating';
  } else {
    activeMood = 'warning';
  }

  const phaseData = PHASE_KNOWLEDGE[currentPhaseLetter.toUpperCase()] || PHASE_KNOWLEDGE.A;

  const handleBotClick = () => {
    const moods: BotMood[] = ['idle', 'warning', 'adversarial', 'thinking', 'celebrating'];
    const next = moods[(moods.indexOf(activeMood) + 1) % moods.length];
    setManualMood(next);
  };

  return (
    <div className="relative my-3 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200">
      {/* Barra de acento sutil */}
      <div className="h-0.5 w-full bg-slate-900" />

      <div className="p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Lado izquierdo: Bot Espacial HUD + Visor Expresivo */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={handleBotClick}
            title="Centinela Espacial • Clic para cambiar expresión"
            className="group relative flex-shrink-0 cursor-pointer focus:outline-none"
          >
            {/* Chasis compacto del Bot Espacial */}
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-950 p-1 shadow-sm flex items-center justify-center border border-slate-800 animate-bot-float">
              {/* Diodo de estado superior */}
              <div
                className={`absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full transition-colors duration-200 ${
                  activeMood === 'celebrating'
                    ? 'bg-emerald-400'
                    : activeMood === 'warning'
                    ? 'bg-amber-400'
                    : activeMood === 'adversarial'
                    ? 'bg-rose-400'
                    : activeMood === 'thinking'
                    ? 'bg-indigo-400 animate-pulse'
                    : 'bg-cyan-400'
                }`}
              />

              {/* Visor OLED */}
              <div className="relative w-full h-full rounded-lg bg-black border border-cyan-500/20 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Expresiones del Visor */}
                {activeMood === 'idle' && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_6px_#22d3ee]" />
                    <div className="w-1.5 h-2.5 bg-cyan-400 rounded-full shadow-[0_0_6px_#22d3ee]" />
                  </div>
                )}

                {activeMood === 'warning' && (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                )}

                {activeMood === 'thinking' && (
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce shadow-[0_0_4px_#22d3ee]" />
                    <div className="w-1 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:150ms]" />
                    <div className="w-1 h-3 bg-cyan-400 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                )}

                {activeMood === 'celebrating' && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-1.5 border-t-2 border-emerald-400 rounded-t-full" />
                    <div className="w-2 h-1.5 border-t-2 border-emerald-400 rounded-t-full" />
                  </div>
                )}

                {activeMood === 'adversarial' && (
                  <div className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full border border-rose-400 bg-rose-500/20" />
                    <div className="w-1.5 h-0.5 bg-rose-400" />
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/10 to-transparent animate-visor-scan pointer-events-none" />
              </div>
            </div>
          </button>

          {/* Mensaje conciso del HUD */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Centinela • Fase {currentPhaseLetter}
              </span>
              {isPhaseReady && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Aprobada
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 font-medium truncate sm:whitespace-normal">
              {phaseData.warning}
            </p>
          </div>
        </div>

        {/* Lado derecho: Acciones contextuales & toggle de checklist */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-shrink-0">
          {phaseData.actionLabel && onActionClick && (
            <button
              type="button"
              onClick={() => onActionClick(phaseData.actionId || 'default')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs"
            >
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{phaseData.actionLabel}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Ocultar checklist' : 'Ver checklist de fase'}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Checklist expandible sutil */}
      {isExpanded && (
        <div className="px-4 pb-3.5 pt-2 border-t border-slate-100 bg-slate-50/70 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider text-slate-500">
                <Lightbulb className="w-3 h-3 text-amber-500" />
                Misión
              </span>
              <p className="text-slate-600 leading-relaxed text-xs">{phaseData.mission}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1 text-[11px] uppercase tracking-wider text-slate-500">
                <ShieldAlert className="w-3 h-3 text-slate-600" />
                Criterios de Aprobación
              </span>
              <ul className="space-y-1">
                {phaseData.approvalChecklist.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-1.5 text-slate-600 text-xs">
                    <CheckCircle2 className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
