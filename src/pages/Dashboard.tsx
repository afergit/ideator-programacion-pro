import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Project, ProjectPhase } from '../types/project';
import { Plus, Lock, ArrowRight, FolderKanban, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-legisapp-01',
    name: 'LegisApp - Observatorio Legislativo',
    description: 'Plataforma para seguimiento de proyectos de ley, boletines, comisiones y scraping oficial del Senado.',
    currentPhase: 'PHASE_A_PROBLEM',
    createdAt: '2026-09-20',
    updatedAt: '2026-09-20',
    isPrivate: true,
    ownerId: 'usr_google_101',
    collaborators: ['usr_google_101', 'usr_partner_102'],
    phaseProgress: {
      PHASE_A_PROBLEM: 'IN_PROGRESS',
      PHASE_B_DATABASE: 'NOT_STARTED',
      PHASE_C_API: 'NOT_STARTED',
      PHASE_D_FRONTEND: 'NOT_STARTED',
      PHASE_E_ARCHITECTURE: 'NOT_STARTED',
    },
  },
  {
    id: 'proj-ecommerce-02',
    name: 'QuickMarket MVP',
    description: 'Aplicación de entregas de última milla con trazabilidad de pedidos y fotos de reemplazo.',
    currentPhase: 'PHASE_C_API',
    createdAt: '2026-09-18',
    updatedAt: '2026-09-19',
    isPrivate: true,
    ownerId: 'usr_google_101',
    collaborators: ['usr_google_101'],
    phaseProgress: {
      PHASE_A_PROBLEM: 'COMPLETED',
      PHASE_B_DATABASE: 'COMPLETED',
      PHASE_C_API: 'IN_PROGRESS',
      PHASE_D_FRONTEND: 'NOT_STARTED',
      PHASE_E_ARCHITECTURE: 'NOT_STARTED',
    },
  },
];

const PHASE_NAMES: Record<ProjectPhase, string> = {
  PHASE_A_PROBLEM: 'A. Definición & MVP',
  PHASE_B_DATABASE: 'B. Base de Datos',
  PHASE_C_API: 'C. Backend & API',
  PHASE_D_FRONTEND: 'D. Frontend UI',
  PHASE_E_ARCHITECTURE: 'E. Arquitectura',
};

export const Dashboard: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const navigate = useNavigate();

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: 'proj-' + Date.now(),
      name: newProjectName.trim(),
      description: newProjectDesc.trim() || 'Proyecto nuevo en Ideator',
      currentPhase: 'PHASE_A_PROBLEM',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      isPrivate: true,
      ownerId: 'usr_google_101',
      collaborators: ['usr_google_101'],
      phaseProgress: {
        PHASE_A_PROBLEM: 'IN_PROGRESS',
        PHASE_B_DATABASE: 'NOT_STARTED',
        PHASE_C_API: 'NOT_STARTED',
        PHASE_D_FRONTEND: 'NOT_STARTED',
        PHASE_E_ARCHITECTURE: 'NOT_STARTED',
      },
    };

    setProjects([newProject, ...projects]);
    setIsModalOpen(false);
    setNewProjectName('');
    setNewProjectDesc('');
    navigate(`/project/${newProject.id}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Mis Proyectos de Software</h1>
            <p className="text-sm text-slate-500 mt-1">
              Especificaciones estructuradas generadas mediante entrevistas con IA
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

        {/* Lista de Proyectos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <div
              key={proj.id}
              onClick={() => navigate(`/project/${proj.id}`)}
              className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-md">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>Privado</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Actualizado: {proj.updatedAt}</span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {proj.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {proj.description}
                </p>

                {/* Resumen de Fases */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-2.5">
                    Fase Activa: <span className="text-indigo-600">{PHASE_NAMES[proj.currentPhase]}</span>
                  </span>

                  <div className="grid grid-cols-5 gap-1.5">
                    {(Object.keys(proj.phaseProgress) as ProjectPhase[]).map((pKey, idx) => {
                      const st = proj.phaseProgress[pKey];
                      return (
                        <div
                          key={pKey}
                          title={`${idx + 1}. ${PHASE_NAMES[pKey]} (${st})`}
                          className={`h-2 rounded-full ${
                            st === 'COMPLETED'
                              ? 'bg-emerald-500'
                              : st === 'IN_PROGRESS'
                              ? 'bg-indigo-600 animate-pulse'
                              : st === 'BLOCKED'
                              ? 'bg-amber-500'
                              : 'bg-slate-200'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-50 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                <span>Continuar especificación</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>

        {projects.length === 0 && (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl">
            <FolderKanban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-800">Aún no tienes proyectos creados</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Crea tu primer proyecto para empezar a idear con Gemini
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Proyecto</span>
            </button>
          </div>
        )}
      </main>

      {/* Modal Nuevo Proyecto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <h2 className="text-lg font-bold text-slate-900">Crear Nuevo Proyecto</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configura el nombre y la idea preliminar para que Ideator comience a entrevistarte.
            </p>

            <form onSubmit={handleCreateProject} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. LegisApp, BioSphere, HealthTrack"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Idea o Problema Inicial (Opcional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe brevemente de qué trata tu idea para que la IA tenga un punto de partida..."
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all"
                >
                  Comenzar Ideación
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
