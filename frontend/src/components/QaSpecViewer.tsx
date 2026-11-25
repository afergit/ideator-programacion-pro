import React, { useEffect, useState } from 'react';
import { phaseService } from '../services/phaseService';
import { getApiErrorMessage } from '../lib/api';
import type { QaSpec } from '../types/phase';
import { CheckCircle2, Loader2, Sparkles, Layers, AlertCircle } from 'lucide-react';

export const QaSpecViewer: React.FC<{ projectId: string; onCompleted?: () => void }> = ({
  projectId,
  onCompleted,
}) => {
  const [qaSpec, setQaSpec] = useState<QaSpec | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const loadQaSpec = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await phaseService.getQaSpec(projectId);
      setQaSpec(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQaSpec();
  }, [projectId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      const data = await phaseService.generateQaSpec(projectId, prompt.trim() || undefined);
      setQaSpec(data);
      setSuccessMessage('¡Plan de pruebas y aseguramiento de calidad generado por ideator-qa-agent!');
      if (onCompleted) onCompleted();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'UNIT':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'INTEGRATION':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'E2E':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
              <h2 className="text-base font-bold text-slate-900">Fase F: QA & Testing</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Estrategia de pruebas automatizadas, pirámide de testing y cobertura de código por ideator-qa-agent.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Diseñando Pruebas...' : 'Disparar Agente QA'}
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Instrucciones para escenarios de prueba o herramientas (JUnit, Mockito, Playwright)
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="ej. Enfatizar pruebas de integración para endpoints de proyectos y roles"
            className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50"
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
            {successMessage}
          </div>
        )}
      </div>

      {qaSpec && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Pirámide de Pruebas
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {qaSpec.testingPyramid}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Meta de Cobertura
                </h3>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-600">{qaSpec.coverageTarget}</span>
                <span className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-100 rounded-lg">
                  Objetivo QA
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Casos de Prueba Planificados
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {qaSpec.testCases?.length || 0} Casos Estructurados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 rounded-l-lg">ID</th>
                    <th className="py-2.5 px-3">Escenario de Prueba</th>
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Resultado Esperado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {qaSpec.testCases?.map((tc) => (
                    <tr key={tc.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">{tc.id}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{tc.name}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${getTypeBadge(
                            tc.type
                          )}`}
                        >
                          {tc.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 leading-normal">{tc.expectedResult}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
