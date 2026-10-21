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
      setProjects(await projectService.list());
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mis Proyectos de Software</h1>
            <p className="text-sm text-slate-500 mt-1">
              Proyectos almacenados en PostgreSQL y protegidos con JWT.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-100 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Proyecto</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
            <span className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </span>
            <button
              onClick={() => void loadProjects()}
              className="inline-flex items-center gap-1 font-semibold text-red-700 hover:text-red-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-500">Cargando proyectos...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Aún no tienes proyectos creados</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Crea tu primer proyecto para comenzar la especificación con Ideator.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Proyecto</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}`)}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 border text-xs font-semibold rounded-md ${STATUS_STYLES[project.status]}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {STATUS_LABELS[project.status]}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(project.createdAt)}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {project.description || 'Sin descripción todavía.'}
                  </p>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-4 text-[11px] text-slate-500">
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

                <div className="mt-6 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                  <span>Abrir proyecto</span>
                  <div className="flex items-center gap-2">
                    {project.accessLevel === 'OWNER' && (
                      <button
                        type="button"
                        onClick={(event) => void handleDeleteProject(event, project)}
                        disabled={deletingId === project.id}
                        title="Eliminar proyecto"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-slate-900">Crear Nuevo Proyecto</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              El proyecto se guardará en PostgreSQL y quedará asociado a tu usuario.
            </p>

            <form onSubmit={handleCreateProject} className="mt-5 space-y-4">
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
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Idea o Problema Inicial (Opcional)
                </label>
                <textarea
                  rows={3}
                  maxLength={4000}
                  placeholder="Describe brevemente de qué trata tu idea para que la IA tenga un punto de partida..."
                  value={newProjectDesc}
                  onChange={(event) => setNewProjectDesc(event.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all disabled:opacity-60"
                >
                  {isCreating ? 'Creando...' : 'Comenzar Ideación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
