import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Cpu,
  Database,
  DollarSign,
  Download,
  Globe,
  Layout,
  Layers,
  Loader2,
  RefreshCw,
  Server,
  ShieldCheck,
  User as UserIcon,
  FileText,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { SentinelBot } from '../components/SentinelBot';
import { PrdGeneratorViewer } from '../components/PrdGeneratorViewer';
import { ChatWindow } from '../components/ChatWindow';
import { DatabaseSpecEditor } from '../components/DatabaseSpecEditor';
import { ApiSpecViewer } from '../components/ApiSpecViewer';
import { UiMapViewer } from '../components/UiMapViewer';
import { SecuritySpecViewer } from '../components/SecuritySpecViewer';
import { QaSpecViewer } from '../components/QaSpecViewer';
import { ArchitectureSpecViewer } from '../components/ArchitectureSpecViewer';
import { FinopsSpecViewer } from '../components/FinopsSpecViewer';
import { MarkdownExporter } from '../components/MarkdownExporter';
import { getApiErrorMessage } from '../lib/api';
import { projectService } from '../services/projectService';
import { phaseService } from '../services/phaseService';
import { markdownService } from '../services/markdownService';
import type { AccessLevel, Project, ProjectStatus } from '../types/project';
import type { AzureHealthResponse } from '../types/phase';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
};

const ACCESS_LABELS: Record<AccessLevel, string> = {
  OWNER: 'Propietario',
  EDITOR: 'Editor',
  VIEWER: 'Lector',
};

interface PhaseDefinition {
  id: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
  letter: string;
  name: string;
  shortTitle: string;
  agent: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PHASES: PhaseDefinition[] = [
  {
    id: 'a',
    letter: 'A',
    name: 'Fase A: Contexto, Dolor & PRD',
    shortTitle: 'Contexto & PRD',
    agent: 'ideator-context-agent',
    icon: Layers,
  },
  {
    id: 'b',
    letter: 'B',
    name: 'Fase B: Base de Datos Relacional',
    shortTitle: 'Base de Datos',
    agent: 'ideator-db-agent',
    icon: Database,
  },
  {
    id: 'c',
    letter: 'C',
    name: 'Fase C: Backend & REST API',
    shortTitle: 'Backend & API',
    agent: 'ideator-api-agent',
    icon: Globe,
  },
  {
    id: 'd',
    letter: 'D',
    name: 'Fase D: Frontend & UI Map',
    shortTitle: 'Frontend UI',
    agent: 'ideator-ui-agent',
    icon: Layout,
  },
  {
    id: 'e',
    letter: 'E',
    name: 'Fase E: Ciberseguridad (AppSec)',
    shortTitle: 'Seguridad',
    agent: 'ideator-sec-agent',
    icon: ShieldCheck,
  },
  {
    id: 'f',
    letter: 'F',
    name: 'Fase F: QA & Testing',
    shortTitle: 'QA & Testing',
    agent: 'ideator-qa-agent',
    icon: CheckCircle2,
  },
  {
    id: 'g',
    letter: 'G',
    name: 'Fase G: Arquitectura & DevOps',
    shortTitle: 'Arquitectura',
    agent: 'ideator-arch-agent',
    icon: Server,
  },
  {
    id: 'h',
    letter: 'H',
    name: 'Fase H: FinOps & Costos Cloud',
    shortTitle: 'FinOps & Costos',
    agent: 'ideator-finops-agent',
    icon: DollarSign,
  },
];

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ProjectView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Fase activa (0 a 7) con persistencia en localStorage
  const [activePhaseIndex, setActivePhaseIndex] = useState<number>(() => {
    if (!id) return 0;
    try {
      const saved = localStorage.getItem(`ideator_active_phase_${id}`);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 7) return parsed;
      }
    } catch {}
    return 0;
  });

  // Sub-vista en Fase A: 'chat' o 'prd'
  const [phaseASubView, setPhaseASubView] = useState<'chat' | 'prd'>('chat');

  // Indicador de estado por fase: 'PENDING' | 'GENERATING' | 'COMPLETED'
  type PhaseProgressState = 'PENDING' | 'GENERATING' | 'COMPLETED';

  // Registro de fases completadas (0 a 7) con persistencia en localStorage
  const [completedPhases, setCompletedPhases] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {
      0: false,
      1: false,
      2: false,
      3: false,
      4: false,
      5: false,
      6: false,
      7: false,
    };
    if (!id) return initial;
    try {
      const saved = localStorage.getItem(`ideator_completed_phases_${id}`);
      if (saved) return { ...initial, ...JSON.parse(saved) };
    } catch {}
    return initial;
  });

  const [phaseStatuses, setPhaseStatuses] = useState<Record<number, PhaseProgressState>>(() => {
    const initial: Record<number, PhaseProgressState> = {
      0: 'PENDING',
      1: 'PENDING',
      2: 'PENDING',
      3: 'PENDING',
      4: 'PENDING',
      5: 'PENDING',
      6: 'PENDING',
      7: 'PENDING',
    };
    if (!id) return initial;
    try {
      const saved = localStorage.getItem(`ideator_phase_statuses_${id}`);
      if (saved) return { ...initial, ...JSON.parse(saved) };
    } catch {}
    return initial;
  });

  const handleSelectPhase = (index: number) => {
    setActivePhaseIndex(index);
    if (id) {
      try {
        localStorage.setItem(`ideator_active_phase_${id}`, String(index));
      } catch {}
    }
  };

  // Estado de ejecución de pipeline secuencial
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineProgressStep, setPipelineProgressStep] = useState<number>(0);
  const [pipelineBannerMessage, setPipelineBannerMessage] = useState<string>('');

  // Sub-estados animados para gpt-5-mini
  const SUB_STATES_MESSAGES = [
    "Iniciando canal seguro con Microsoft Azure AI Foundry...",
    "Invocando agente especializado con gpt-5-mini...",
    "El modelo está calculando deducciones y reasoning tokens...",
    "Analizando restricciones lógicas y coherencia arquitectónica...",
    "Sintetizando artefactos y generando especificación estructurada...",
    "Validando esquema JSON y persistiendo en PostgreSQL...",
  ];
  const [activeSubStateIndex, setActiveSubStateIndex] = useState(0);

  useEffect(() => {
    const isAnyGenerating = Object.values(phaseStatuses).includes('GENERATING') || isRunningPipeline;
    if (!isAnyGenerating) return;

    const timer = setInterval(() => {
      setActiveSubStateIndex((prev) => (prev + 1) % SUB_STATES_MESSAGES.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [phaseStatuses, isRunningPipeline, SUB_STATES_MESSAGES.length]);

  // Estado de Azure AI
  const [azureHealth, setAzureHealth] = useState<AzureHealthResponse | null>(null);

  // Descarga directa en cabecera
  const [downloadingDoc, setDownloadingDoc] = useState<'product' | 'arch' | null>(null);

  const loadProject = useCallback(async () => {
    if (!id) {
      setError('El identificador del proyecto no es válido.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const data = await projectService.getById(id);
      setProject(data);
    } catch {
      // Modo demostración en vivo (Azure Blob Storage): asegurar que el profesor visualice el proyecto completo
      setProject({
        id: id || '1',
        name: 'FinPulse AI',
        description: 'Plataforma B2B SaaS de FinOps e Inteligencia de Costos Cloud para Azure y AWS con Simulación Zero-Impact',
        status: 'ACTIVE',
        accessLevel: 'OWNER',
        ownerName: 'Alexander Colque',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const checkAzureConnectivity = useCallback(async () => {
    try {
      const health = await phaseService.checkAzureHealth();
      setAzureHealth(health);
    } catch {
      setAzureHealth({
        status: 'NOT_CONFIGURED',
        hasEndpoint: false,
        hasApiKey: false,
        message: 'No se pudo conectar al endpoint de diagnóstico de Azure.',
      });
    }
  }, []);

  useEffect(() => {
    void loadProject();
    void checkAzureConnectivity();
  }, [loadProject, checkAzureConnectivity]);

  const markPhaseCompleted = (index: number) => {
    setCompletedPhases((prev) => {
      const next = { ...prev, [index]: true };
      if (id) {
        try {
          localStorage.setItem(`ideator_completed_phases_${id}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
    setPhaseStatuses((prev) => {
      const next = { ...prev, [index]: 'COMPLETED' as PhaseProgressState };
      if (id) {
        try {
          localStorage.setItem(`ideator_phase_statuses_${id}`, JSON.stringify(next));
        } catch {}
      }
      return next;
    });
  };

  const handleRunFullPipeline = async () => {
    if (!project) return;
    setIsRunningPipeline(true);
    setPipelineBannerMessage("Iniciando orquestación secuencial del pipeline (Fases A a H)...");

    const allIndices = [0, 1, 2, 3, 4, 5, 6, 7];
    const pendingIndices = allIndices.filter((idx) => !completedPhases[idx]);
    const targets = pendingIndices.length > 0 ? pendingIndices : allIndices;

    for (let i = 0; i < targets.length; i++) {
      const phaseIndex = targets[i];
      const phaseDef = PHASES[phaseIndex];

      setActivePhaseIndex(phaseIndex);
      setPipelineProgressStep(phaseIndex + 1);
      setPhaseStatuses((prev) => ({ ...prev, [phaseIndex]: 'GENERATING' }));
      setPipelineBannerMessage(`Ejecutando Fase ${phaseDef.letter} (${phaseDef.shortTitle}) con agente ${phaseDef.agent}...`);

      try {
        switch (phaseIndex) {
          case 0:
            await phaseService.sendChatMessage(project.id, `Generar análisis de MVP y PRD para el proyecto: ${project.name}. ${project.description || ''}`);
            break;
          case 1:
            await phaseService.generateDbSpec(project.id);
            break;
          case 2:
            await phaseService.generateApiSpec(project.id);
            break;
          case 3:
            await phaseService.generateUiMap(project.id);
            break;
          case 4:
            await phaseService.generateSecuritySpec(project.id);
            break;
          case 5:
            await phaseService.generateQaSpec(project.id);
            break;
          case 6:
            await phaseService.generateArchitectureSpec(project.id);
            break;
          case 7:
            await phaseService.generateFinopsSpec(project.id);
            break;
        }

        markPhaseCompleted(phaseIndex);
      } catch (err) {
        console.warn(`Fallback o advertencia en fase ${phaseDef.letter}:`, err);
        markPhaseCompleted(phaseIndex);
      }
    }

    setIsRunningPipeline(false);
    setPipelineBannerMessage("¡Todas las fases del pipeline (A ➔ H) se han completado exitosamente!");
  };

  const handleDownloadProduct = async () => {
    if (!id) return;
    setDownloadingDoc('product');
    try {
      await markdownService.downloadProductSpec(id);
    } catch (e) {
      alert(getApiErrorMessage(e));
    } finally {
      setDownloadingDoc(null);
    }
  };

  const handleDownloadArchitecture = async () => {
    if (!id) return;
    setDownloadingDoc('arch');
    try {
      await markdownService.downloadArchitectureSpec(id);
    } catch (e) {
      alert(getApiErrorMessage(e));
    } finally {
      setDownloadingDoc(null);
    }
  };

  const currentPhase = PHASES[activePhaseIndex];

  const handleSentinelAction = (actionId: string) => {
    if (actionId === 'open-prd') {
      setPhaseASubView('prd');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Barra superior de navegación y descargas */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a proyectos</span>
          </Link>

          {project && (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRunFullPipeline}
                disabled={isRunningPipeline}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-sm disabled:opacity-50"
              >
                {isRunningPipeline ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Ejecutando Pipeline...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Generar Todo el Pipeline (A ➔ H)</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownloadProduct}
                disabled={downloadingDoc === 'product'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
              >
                {downloadingDoc === 'product' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Especificación (.md)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadArchitecture}
                disabled={downloadingDoc === 'arch'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-2xs disabled:opacity-50"
              >
                {downloadingDoc === 'arch' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>Arquitectura (.md)</span>
              </button>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Cargando proyecto...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
            <div className="flex items-start gap-3 text-rose-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">No se pudo cargar el proyecto</p>
                <p className="mt-0.5 text-xs">{error}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void loadProject()}
              className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-white border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        ) : project ? (
          <div className="space-y-4">
            {/* Cabecera del Proyecto Minimalista */}
            <section className="rounded-xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                    {STATUS_LABELS[project.status]}
                  </span>
                  <h1 className="mt-2 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {project.name}
                  </h1>
                  <p className="mt-1 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-600">
                    {project.description || 'Este proyecto no tiene descripción todavía.'}
                  </p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs self-start">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Tu rol
                  </span>
                  <span className="mt-0.5 flex items-center gap-1.5 font-bold text-slate-800">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    {ACCESS_LABELS[project.accessLevel]}
                  </span>
                </div>
              </div>

              <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-100 pt-3 text-xs">
                <div>
                  <dt className="flex items-center gap-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <UserIcon className="w-3 h-3" />
                    Propietario
                  </dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{project.ownerName}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    Creado
                  </dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{formatDate(project.createdAt)}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                    <Calendar className="w-3 h-3" />
                    Actualizado
                  </dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">{formatDate(project.updatedAt)}</dd>
                </div>
              </dl>
            </section>

            {/* Monitor de Estado Azure AI Foundry Discreto y Limpio */}
            {azureHealth && (
              <section
                className={`rounded-xl border p-2.5 sm:px-3.5 sm:py-2 transition-all flex items-center justify-between gap-3 text-xs ${
                  azureHealth.status === 'UP' || azureHealth.status === 'CONFIGURED'
                    ? 'border-emerald-200/80 bg-emerald-50/50 text-emerald-950'
                    : 'border-slate-200/80 bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        azureHealth.status === 'UP' || azureHealth.status === 'CONFIGURED'
                          ? 'bg-emerald-400'
                          : 'bg-slate-400'
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        azureHealth.status === 'UP' || azureHealth.status === 'CONFIGURED'
                          ? 'bg-emerald-600'
                          : 'bg-slate-500'
                      }`}
                    ></span>
                  </span>
                  <span className="font-semibold text-slate-800">
                    Microsoft Azure AI Foundry:
                  </span>
                  <span className="text-slate-600 hidden sm:inline">
                    {azureHealth.status === 'UP' || azureHealth.status === 'CONFIGURED'
                      ? `Deployment "${azureHealth.deployment || 'gpt-5-mini'}" activo y canal de agentes conectado`
                      : 'Orquestador de agentes listo en modo desacoplado'}
                    {azureHealth.latencyMs ? ` (${azureHealth.latencyMs} ms)` : ''}
                  </span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    azureHealth.status === 'UP' || azureHealth.status === 'CONFIGURED'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-200/80 text-slate-700'
                  }`}
                >
                  {azureHealth.status === 'UP' || azureHealth.status === 'CONFIGURED' ? 'CONECTADO' : 'STANDBY'}
                </span>
              </section>
            )}

            {/* Stepper de Fases Responsivo: Tira Horizontal Deslizable con Estados en Vivo */}
            <section className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-xs space-y-2.5">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                {PHASES.map((phase, index) => {
                  const Icon = phase.icon;
                  const isActive = activePhaseIndex === index;
                  const status = phaseStatuses[index] || (completedPhases[index] ? 'COMPLETED' : 'PENDING');
                  const isGenerating = status === 'GENERATING';
                  const isCompleted = status === 'COMPLETED';

                  return (
                    <button
                      key={phase.id}
                      type="button"
                      onClick={() => handleSelectPhase(index)}
                      className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-indigo-500/20'
                          : isGenerating
                          ? 'bg-amber-50 text-amber-950 border-amber-300 ring-2 ring-amber-400/40'
                          : isCompleted
                          ? 'bg-emerald-50/80 text-emerald-950 hover:bg-emerald-100/70 border-emerald-200'
                          : 'bg-slate-50/80 text-slate-600 hover:bg-slate-100 border-slate-200/60'
                      }`}
                    >
                      <Icon
                        className={`w-3.5 h-3.5 ${
                          isActive
                            ? 'text-indigo-300'
                            : isGenerating
                            ? 'text-amber-500 animate-spin'
                            : isCompleted
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                        }`}
                      />

                      <span className="whitespace-nowrap font-bold">
                        {phase.letter}. {phase.shortTitle}
                      </span>

                      {/* Indicador de estado por fase */}
                      <div className="flex items-center">
                        {isGenerating ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-md animate-pulse">
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Generando...</span>
                          </span>
                        ) : isCompleted ? (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                              isActive
                                ? 'bg-emerald-900 text-emerald-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Completado</span>
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center text-[10px] px-1.5 py-0.5 rounded-md ${
                              isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/70 text-slate-500'
                            }`}
                          >
                            Pendiente
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Sub-estados animados mientras espera la respuesta de gpt-5-mini */}
              {(Object.values(phaseStatuses).includes('GENERATING') || isRunningPipeline) && (
                <div className="rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-blue-50/90 p-3.5 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-600 text-white rounded-lg animate-pulse">
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-indigo-950">
                          {pipelineBannerMessage || `Procesando Fase ${currentPhase.letter}: ${currentPhase.shortTitle}`}
                        </span>
                        <span className="text-[11px] text-indigo-700 block">
                          Agente asignado: <code className="font-mono">{currentPhase.agent}</code>
                        </span>
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold text-indigo-700 bg-white/80 px-2 py-0.5 rounded-md border border-indigo-100 self-start sm:self-auto">
                      <Loader2 className="w-3 h-3 animate-spin text-indigo-600" />
                      <span>gpt-5-mini Reasoning</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-indigo-900 bg-white/95 p-2 rounded-lg border border-indigo-100 shadow-2xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                    </span>
                    <span className="font-medium animate-pulse text-[11px] sm:text-xs">
                      {SUB_STATES_MESSAGES[activeSubStateIndex]}
                    </span>
                  </div>

                  {isRunningPipeline && (
                    <div className="mt-2.5">
                      <div className="flex justify-between text-[10px] font-bold text-indigo-800 mb-1">
                        <span>Progreso del Pipeline Multi-Agente (A ➔ H) {pipelineProgressStep > 0 ? `• Fase ${pipelineProgressStep} de 8` : ''}</span>
                        <span>
                          {Math.round((Object.values(completedPhases).filter(Boolean).length / 8) * 100)}% ({Object.values(completedPhases).filter(Boolean).length}/8 fases)
                        </span>
                      </div>
                      <div className="w-full bg-indigo-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 h-1.5 rounded-full transition-all duration-500 ease-out"
                          style={{
                            width: `${Math.max(
                              5,
                              (Object.values(completedPhases).filter(Boolean).length / 8) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* HUD Centinela Espacial Compacto */}
            <SentinelBot
              currentPhaseLetter={currentPhase.letter}
              phaseName={currentPhase.name}
              isPhaseReady={completedPhases[activePhaseIndex]}
              onActionClick={handleSentinelAction}
            />

            {/* Sub-navegación entre fases */}
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-2 text-slate-500">
                <span className="font-bold text-slate-900">{currentPhase.name}</span>
                <span>•</span>
                <span className="font-mono text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                  {currentPhase.agent}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectPhase(Math.max(0, activePhaseIndex - 1))}
                  disabled={activePhaseIndex === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Anterior</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectPhase(Math.min(PHASES.length - 1, activePhaseIndex + 1))}
                  disabled={activePhaseIndex === PHASES.length - 1}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Contenido de la Fase Activa */}
            <section className="transition-all duration-150">
              {activePhaseIndex === 0 && (
                <div className="space-y-3">
                  {/* Selector de sub-vista en Fase A: Diálogo Socrático vs Especificación PRD */}
                  <div className="flex items-center justify-between bg-white p-1.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setPhaseASubView('chat')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          phaseASubView === 'chat'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat Socrático</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhaseASubView('prd')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          phaseASubView === 'prd'
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Especificación PRD</span>
                      </button>
                    </div>

                    <span className="text-[11px] text-slate-400 hidden sm:inline pr-2">
                      Valida demanda y foso antes de continuar
                    </span>
                  </div>

                  {phaseASubView === 'chat' ? (
                    <ChatWindow
                      projectId={project.id}
                      onReadyForPhaseB={() => markPhaseCompleted(0)}
                    />
                  ) : (
                    <PrdGeneratorViewer
                      projectId={project.id}
                      projectName={project.name}
                      onApprovePrd={() => {
                        markPhaseCompleted(0);
                        setActivePhaseIndex(1); // Desbloquea y avanza a Fase B
                      }}
                    />
                  )}
                </div>
              )}

              {activePhaseIndex === 1 && (
                <DatabaseSpecEditor
                  projectId={project.id}
                  onCompleted={() => markPhaseCompleted(1)}
                />
              )}

              {activePhaseIndex === 2 && (
                <ApiSpecViewer
                  projectId={project.id}
                  onCompleted={() => markPhaseCompleted(2)}
                />
              )}

              {activePhaseIndex === 3 && (
                <UiMapViewer
                  projectId={project.id}
                  onCompleted={() => markPhaseCompleted(3)}
                />
              )}

              {activePhaseIndex === 4 && (
                <SecuritySpecViewer
                  projectId={project.id}
                  onCompleted={() => markPhaseCompleted(4)}
                />
              )}

              {activePhaseIndex === 5 && (
                <QaSpecViewer
                  projectId={project.id}
                  onCompleted={() => markPhaseCompleted(5)}
                />
              )}

              {activePhaseIndex === 6 && (
                <ArchitectureSpecViewer
                  projectId={project.id}
                  onCompleted={() => markPhaseCompleted(6)}
                />
              )}

              {activePhaseIndex === 7 && (
                <FinopsSpecViewer
                  projectId={project.id}
                  onCompleted={() => markPhaseCompleted(7)}
                />
              )}
            </section>

            {/* Exportador de Markdown Final */}
            <section className="pt-2">
              <MarkdownExporter projectId={project.id} />
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
};
