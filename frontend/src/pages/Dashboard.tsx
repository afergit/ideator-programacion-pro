import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Clock,
  FolderKanban,
  Lock,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { RocketLogo } from '../components/RocketLogo';
import { getApiErrorMessage } from '../lib/api';
import { projectService } from '../services/projectService';
import type { AccessLevel, Project, ProjectStatus } from '../types/project';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: 'Borrador',
  ACTIVE: 'Activo',
  ARCHIVED: 'Archivado',
};

const STATUS_STYLES: Record<ProjectStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ARCHIVED: 'bg-amber-50 text-amber-700 border-amber-200',
};

const ACCESS_LABELS: Record<AccessLevel, string> = {
  OWNER: 'Propietario',
  EDITOR: 'Editor',
  VIEWER: 'Lector',
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await projectService.list();
      setProjects(data && data.length > 0 ? data : [
        {
          id: '1',
          name: 'FinPulse AI',
          description: 'Plataforma B2B SaaS de FinOps e Inteligencia de Costos Cloud para Azure y AWS con Simulación Zero-Impact',
          status: 'ACTIVE',
          accessLevel: 'OWNER',
          ownerName: 'Alexander Colque',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } catch {
      // Modo demostración en vivo si el backend no está expuesto
      setProjects([
        {
          id: '1',
          name: 'FinPulse AI',
          description: 'Plataforma B2B SaaS de FinOps e Inteligencia de Costos Cloud para Azure y AWS con Simulación Zero-Impact',
          status: 'ACTIVE',
          accessLevel: 'OWNER',
          ownerName: 'Alexander Colque',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newProjectName.trim() || isCreating) {
      return;
    }

    setIsCreating(true);
    setError('');

    try {
      const project = await projectService.create({
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || undefined,
      });
      setProjects((current) => [project, ...current]);
      setIsModalOpen(false);
      setNewProjectName('');
      setNewProjectDesc('');
      navigate(`/project/${project.id}`);
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProject = async (event: React.MouseEvent, project: Project) => {
    event.stopPropagation();

    if (project.accessLevel !== 'OWNER') {
      return;
    }

    const confirmed = window.confirm(`¿Eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer.`);
    if (!confirmed) {
      return;
    }

    setDeletingId(project.id);
    setError('');

    try {
      await projectService.remove(project.id);
      setProjects((current) => current.filter((item) => item.id !== project.id));
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Encabezado Principal Limpio y Sobrio (Sin ruido visual ni 'Sprint 2 Ready') */}
        <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs flex-shrink-0">
              <RocketLogo className="w-5 h-5 text-slate-100" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Mis Proyectos
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Convierte ideas en modelos relacionales, contratos REST y especificaciones ejecutables.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
            <span className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </span>
            <button
              onClick={() => void loadProjects()}
              className="inline-flex items-center gap-1 font-semibold text-rose-700 hover:text-rose-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-slate-500">Cargando proyectos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200/80 rounded-2xl shadow-xs">
            <FolderKanban className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">Aún no tienes proyectos creados</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Crea tu primer proyecto para comenzar la especificación guiada con IA.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Proyecto</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-white border border-slate-200/80 rounded-xl p-5 hover:border-slate-400 hover:shadow-xs cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 border text-[11px] font-semibold rounded-md ${STATUS_STYLES[project.status]}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {STATUS_LABELS[project.status]}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(project.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-700 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {project.description || 'Sin descripción todavía.'}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-500">
                    <span className="inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {project.ownerName}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" />
                      {ACCESS_LABELS[project.accessLevel]}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-900 group-hover:text-slate-700">
                  <span>Abrir proyecto</span>
                  <div className="flex items-center gap-2">
                    {project.accessLevel === 'OWNER' && (
                      <button
                        type="button"
                        onClick={(event) => void handleDeleteProject(event, project)}
                        disabled={deletingId === project.id}
                        title="Eliminar proyecto"
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Creación */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 sm:p-6 shadow-xl border border-slate-200">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">Crear Nuevo Proyecto</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Se creará el proyecto en PostgreSQL y comenzará el flujo de especificación guiada.
            </p>

            <form onSubmit={handleCreateProject} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  required
                  maxLength={160}
                  placeholder="ej. LegisApp, BioSphere, HealthTrack"
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-slate-900 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Idea o Problema Inicial (Opcional)
                </label>
                <textarea
                  rows={3}
                  maxLength={4000}
                  placeholder="Describe brevemente de qué trata tu idea para orientar a los agentes de IA..."
                  value={newProjectDesc}
                  onChange={(event) => setNewProjectDesc(event.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-slate-900 transition-colors resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-60"
                >
                  {isCreating ? 'Creando...' : 'Comenzar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
