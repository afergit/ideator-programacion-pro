import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Cpu,
  Database,
  Globe,
  Layout,
  Layers,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { getApiErrorMessage } from '../lib/api';
import { projectService } from '../services/projectService';
import type { AccessLevel, Project, ProjectStatus } from '../types/project';

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

const PHASES = [
  { name: 'A. Definición & MVP', icon: Layers },
  { name: 'B. Base de Datos', icon: Database },
  { name: 'C. Backend & API', icon: Globe },
  { name: 'D. Frontend UI', icon: Layout },
  { name: 'E. Arquitectura', icon: Server },
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

  const loadProject = useCallback(async () => {
    if (!id) {
      setError('El identificador del proyecto no es válido.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      setProject(await projectService.getById(id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
      setProject(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a mis proyectos
        </Link>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">Cargando proyecto...</p>
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <p className="text-sm font-semibold">No se pudo cargar el proyecto</p>
                <p className="mt-1 text-xs">{error}</p>
              </div>
            </div>
            <button
              onClick={() => void loadProject()}
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-white border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        ) : project ? (
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                    <Sparkles className="w-3.5 h-3.5" />
                    {STATUS_LABELS[project.status]}
                  </span>
                  <h1 className="mt-3 text-2xl font-bold text-slate-900 tracking-tight">{project.name}</h1>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                    {project.description || 'Este proyecto todavía no tiene descripción.'}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs">
                  <span className="block font-semibold uppercase tracking-wider text-slate-400">Tu acceso</span>
                  <span className="mt-1 flex items-center gap-1.5 font-bold text-slate-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    {ACCESS_LABELS[project.accessLevel]}
                  </span>
                </div>
              </div>

              <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-6 text-xs">
                <div>
                  <dt className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-400">
                    <UserIcon className="w-3.5 h-3.5" />
                    Propietario
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-800">{project.ownerName}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Creado
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-800">{formatDate(project.createdAt)}</dd>
                </div>
                <div>
                  <dt className="flex items-center gap-1.5 font-semibold uppercase tracking-wider text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                    Actualizado
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-800">{formatDate(project.updatedAt)}</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Fases de especificación</h2>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                El flujo conversacional con Azure OpenAI se habilitará en el Sprint 2. Estas son las fases planificadas.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {PHASES.map((phase, index) => {
                  const Icon = phase.icon;
                  return (
                    <div
                      key={phase.name}
                      className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-center"
                    >
                      <Icon className="mx-auto w-5 h-5 text-slate-400" />
                      <span className="mt-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Fase {String.fromCharCode(65 + index)}
                      </span>
                      <span className="mt-1 block text-[11px] font-semibold text-slate-600">{phase.name}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6">
              <div className="flex items-start gap-3">
                <Cpu className="w-5 h-5 shrink-0 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-indigo-900">Integración Azure OpenAI</h3>
                  <p className="mt-1 text-xs leading-relaxed text-indigo-800">
                    El backend ya expone la configuración de Azure OpenAI y el endpoint de diagnóstico
                    <code className="mx-1 rounded bg-white px-1.5 py-0.5 font-mono text-[11px]">GET /api/health/azure</code>.
                    La conversación de ideación se conectará en el siguiente sprint.
                  </p>
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </main>
    </div>
  );
};
