import React, { useEffect, useState } from 'react';
import { phaseService } from '../services/phaseService';
import { getApiErrorMessage } from '../lib/api';
import type { SecuritySpec } from '../types/phase';
import { ShieldCheck, Loader2, Sparkles, Key, AlertCircle } from 'lucide-react';

export const SecuritySpecViewer: React.FC<{ projectId: string; onCompleted?: () => void }> = ({
  projectId,
  onCompleted,
}) => {
  const [securitySpec, setSecuritySpec] = useState<SecuritySpec | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const loadSecuritySpec = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await phaseService.getSecuritySpec(projectId);
      setSecuritySpec(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSecuritySpec();
  }, [projectId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      const data = await phaseService.generateSecuritySpec(projectId, prompt.trim() || undefined);
      setSecuritySpec(data);
      setSuccessMessage('¡Especificación de Ciberseguridad generada por ideator-sec-agent!');
      if (onCompleted) onCompleted();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900">Fase E: Ciberseguridad & AppSec</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Mitigación de OWASP Top 10, gestión de secretos en Azure Key Vault y Zero Trust por ideator-sec-agent.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Analizando Seguridad...' : 'Disparar Agente Seguridad'}
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Instrucciones para mitigaciones y políticas de seguridad
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="ej. Enfatizar cifrado en tránsito TLS 1.3 y segregación de roles RBAC"
            className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
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

      {securitySpec && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Estrategia Azure Key Vault
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {securitySpec.keyVaultStrategy}
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Protección de Datos & Cifrado
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {securitySpec.dataProtection}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Matriz de Mitigación OWASP Top 10
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {securitySpec.owaspTop10?.length || 0} Controles Evaluados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 rounded-l-lg">ID</th>
                    <th className="py-2.5 px-3">Vulnerabilidad</th>
                    <th className="py-2.5 px-3">Nivel de Riesgo</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Estrategia de Mitigación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {securitySpec.owaspTop10?.map((control) => (
                    <tr key={control.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-mono font-semibold text-slate-800">{control.id}</td>
                      <td className="py-3 px-3 font-medium text-slate-900">{control.title}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-md border ${getRiskBadge(
                            control.riskLevel
                          )}`}
                        >
                          {control.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 leading-normal">{control.mitigation}</td>
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
