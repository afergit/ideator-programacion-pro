// SCRUM-70: Frontend component to visualise and edit API specifications.
import React, { useEffect, useState } from "react";
import { phaseService } from "../services/phaseService";
import { getApiErrorMessage } from "../lib/api";
import type { EndpointSpec } from "../types/phase";
import { Globe, Loader2, Sparkles, Plus, Save, Trash2 } from "lucide-react";

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 border-emerald-300",
  POST: "bg-indigo-100 text-indigo-800 border-indigo-300",
  PUT: "bg-amber-100 text-amber-800 border-amber-300",
  DELETE: "bg-rose-100 text-rose-800 border-rose-300",
  PATCH: "bg-purple-100 text-purple-800 border-purple-300",
};

export const ApiSpecViewer: React.FC<{ projectId: string; onCompleted?: () => void }> = ({
  projectId,
  onCompleted,
}) => {
  const [specs, setSpecs] = useState<EndpointSpec[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const fetchSpecs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await phaseService.getApiSpec(projectId);
      setSpecs(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSpecs();
  }, [projectId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const data = await phaseService.generateApiSpec(projectId, prompt.trim() || undefined);
      setSpecs(Array.isArray(data) ? data : []);
      setSuccessMessage("¡Especificación de Endpoints REST generada con éxito!");
      if (onCompleted) onCompleted();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const addEndpoint = () => {
    const newEndpoint: EndpointSpec = {
      httpMethod: "GET",
      path: "/api/v1/ejemplo",
      requestBody: null,
      responseBody: "EjemploResponse",
      statusCodes: "[200,401,500]",
    };
    setSpecs((prev) => [...prev, newEndpoint]);
  };

  const removeEndpoint = (idx: number) => {
    setSpecs((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage("");
    try {
      await phaseService.saveApiSpec(projectId, specs);
      setSuccessMessage("Endpoints guardados correctamente.");
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-bold text-slate-900">Fase C: Especificación de API REST</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Diseña los endpoints REST, códigos de estado HTTP y contratos de entrada/salida consumiendo ideator-api-agent.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={addEndpoint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Añadir Endpoint
            </button>
            <button
              onClick={handleSave}
              disabled={saving || specs.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loading ? "Generando API..." : "Disparar Agente API"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Instrucciones para el agente de API REST
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="ej. Asegúrate de incluir paginación en GET y validación de permisos por rol"
            className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
            {successMessage}
          </div>
        )}
      </div>

      {loading && specs.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          <p className="text-xs font-medium">El agente está generando los contratos de la API REST...</p>
        </div>
      ) : specs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200">
          <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-600">Aún no hay endpoints generados.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Haz clic en &apos;Disparar Agente API&apos; para generar los endpoints CRUD basados en el modelo de datos.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-xs">
              <thead className="bg-slate-50 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3 text-left">Método</th>
                  <th className="px-4 py-3 text-left">Ruta del Endpoint</th>
                  <th className="px-4 py-3 text-left">Request Body</th>
                  <th className="px-4 py-3 text-left">Response Body</th>
                  <th className="px-4 py-3 text-left">Códigos HTTP</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {specs.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <select
                        value={s.httpMethod}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSpecs((prev) => {
                            const copy = [...prev];
                            copy[idx].httpMethod = v;
                            return copy;
                          });
                        }}
                        className={`text-[11px] font-bold px-2 py-1 rounded-md border ${
                          METHOD_COLORS[s.httpMethod] || "bg-slate-100 text-slate-700 border-slate-300"
                        } focus:outline-none`}
                      >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="PATCH">PATCH</option>
                        <option value="DELETE">DELETE</option>
                      </select>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-800">
                      <input
                        value={s.path}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSpecs((prev) => {
                            const copy = [...prev];
                            copy[idx].path = v;
                            return copy;
                          });
                        }}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">
                      <input
                        value={s.requestBody || ""}
                        placeholder="-"
                        onChange={(e) => {
                          const v = e.target.value;
                          setSpecs((prev) => {
                            const copy = [...prev];
                            copy[idx].requestBody = v || null;
                            return copy;
                          });
                        }}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-slate-600">
                      <input
                        value={s.responseBody || ""}
                        placeholder="-"
                        onChange={(e) => {
                          const v = e.target.value;
                          setSpecs((prev) => {
                            const copy = [...prev];
                            copy[idx].responseBody = v || null;
                            return copy;
                          });
                        }}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1"
                      />
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-slate-500">
                      <input
                        value={s.statusCodes}
                        onChange={(e) => {
                          const v = e.target.value;
                          setSpecs((prev) => {
                            const copy = [...prev];
                            copy[idx].statusCodes = v;
                            return copy;
                          });
                        }}
                        className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:outline-none px-1"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => removeEndpoint(idx)}
                        className="p-1 text-slate-300 hover:text-red-500 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
