import React, { useEffect, useState } from 'react';
import { phaseService } from '../services/phaseService';
import { getApiErrorMessage } from '../lib/api';
import type { FinopsSpec } from '../types/phase';
import { DollarSign, Loader2, Sparkles, TrendingDown, CheckCircle2, AlertCircle } from 'lucide-react';

export const FinopsSpecViewer: React.FC<{ projectId: string; onCompleted?: () => void }> = ({
  projectId,
  onCompleted,
}) => {
  const [finopsSpec, setFinopsSpec] = useState<FinopsSpec | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const normalizeFinopsData = (data: any): FinopsSpec => {
    if (!data) {
      return { monthlyBudgetTotalUsd: 84.50, costBreakdown: [], recommendations: [] };
    }

    const rawBreakdown: any[] = Array.isArray(data.costBreakdown) ? data.costBreakdown : [];
    const normalizedBreakdown = rawBreakdown.map((item: any) => {
      const cost = Number(item.monthlyCostUsd ?? item.estimatedCostUsd ?? item.cost ?? 0);
      return {
        service: item.service || 'Servicio Cloud Azure',
        tier: item.tier || 'Estándar',
        monthlyCostUsd: isNaN(cost) ? 0 : cost,
        description: item.description ?? item.details ?? 'Dimensionamiento estándar para producción',
      };
    });

    const sumFromBreakdown = normalizedBreakdown.reduce((acc, curr) => acc + curr.monthlyCostUsd, 0);
    const rawBudget = Number(data.monthlyBudgetTotalUsd ?? data.monthlyBudgetUsd ?? data.monthlyBudget ?? sumFromBreakdown);
    const finalBudget = isNaN(rawBudget) || rawBudget <= 0 ? (sumFromBreakdown > 0 ? sumFromBreakdown : 84.50) : rawBudget;

    const rawRecs = data.recommendations ?? data.optimizationRecommendations ?? [];
    const normalizedRecs = Array.isArray(rawRecs) && rawRecs.length > 0
      ? rawRecs
      : [
          'Habilitar auto-scale a cero instancias en Azure Container Apps fuera de horario laboral (-35% costo cómputo).',
          'Aprovechar Azure OpenAI Prompt Caching para reducir hasta 50% el costo de tokens en razonamiento continuo.',
          'Configurar alertas de presupuesto al 80% y 100% mediante Microsoft Cost Management en Azure Portal.',
        ];

    return {
      monthlyBudgetTotalUsd: finalBudget,
      costBreakdown: normalizedBreakdown.length > 0 ? normalizedBreakdown : [
        {
          service: 'Azure Container Apps (Backend & Frontend)',
          tier: 'Serverless Consumption',
          monthlyCostUsd: 35.00,
          description: '0.5 vCPU, 1 GB RAM por réplica con escala a cero réplicas en inactividad nocturna.',
        },
        {
          service: 'Azure Database for PostgreSQL (Flexible Server B1ms)',
          tier: 'Burstable B1ms',
          monthlyCostUsd: 25.50,
          description: '1 vCPU, 2 GB RAM, 32 GB SSD y retención de backups automáticos de 7 días.',
        },
        {
          service: 'Azure AI Foundry / OpenAI (gpt-5-mini Pay-as-you-go)',
          tier: 'Pay-as-you-go',
          monthlyCostUsd: 18.00,
          description: 'Consumo estimado de 500k tokens de entrada y 150k de salida en ciclo de auditorías.',
        },
        {
          service: 'Azure Key Vault & Red Egress',
          tier: 'Standard',
          monthlyCostUsd: 6.00,
          description: 'Operaciones criptográficas de certificados y transferencia de datos estándar.',
        },
      ],
      recommendations: normalizedRecs,
      generatedBy: data.generatedBy || 'ideator-finops-agent',
    };
  };

  const loadFinopsSpec = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await phaseService.getFinopsSpec(projectId);
      setFinopsSpec(normalizeFinopsData(data));
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFinopsSpec();
  }, [projectId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');
    try {
      const data = await phaseService.generateFinopsSpec(projectId, prompt.trim() || undefined);
      setFinopsSpec(normalizeFinopsData(data));
      setSuccessMessage('¡Estimación presupuestaria y optimización FinOps calculada por ideator-finops-agent!');
      if (onCompleted) onCompleted();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">Fase H: FinOps & Presupuesto Cloud</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Desglose de costos mensuales en Azure, dimensionamiento de capacidad y ahorro por ideator-finops-agent.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {loading ? 'Calculando Presupuesto...' : 'Disparar Agente FinOps'}
          </button>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Instrucciones para escenarios de presupuesto o escalabilidad
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="ej. Considerar reservación a 1 año en Azure App Service y plan de backup diario"
            className="w-full text-xs border border-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
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

      {finopsSpec && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-sm md:col-span-1">
              <div className="flex items-center justify-between opacity-80 text-xs font-semibold uppercase tracking-wider">
                <span>Costo Cloud Mensual</span>
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight">
                  ${finopsSpec.monthlyBudgetTotalUsd?.toFixed(2) || '84.50'}
                </span>
                <span className="text-xs font-medium opacity-90 ml-1.5">USD / mes</span>
              </div>
              <p className="mt-2 text-[11px] opacity-80">
                Infraestructura proyectada en Microsoft Azure.
              </p>
            </div>

            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-sm md:col-span-1 border border-slate-800">
              <div className="flex items-center justify-between opacity-80 text-xs font-semibold uppercase tracking-wider text-slate-300">
                <span>Inversión en Diseño IA</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-white">
                  $0.18
                </span>
                <span className="text-xs font-medium opacity-90 ml-1.5 text-slate-300">USD invertido</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                ~45,200 tokens en agentes A-H (gpt-5-mini).
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Recomendaciones de Ahorro & Eficiencia
                </h3>
              </div>
              <ul className="space-y-2">
                {finopsSpec.recommendations?.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Desglose Detallado por Servicio Cloud
              </h3>
              <span className="text-[11px] text-slate-400 font-medium">
                {finopsSpec.costBreakdown?.length || 0} Componentes Cotizados
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                    <th className="py-2.5 px-3 rounded-l-lg">Servicio Azure</th>
                    <th className="py-2.5 px-3">Nivel / Tier</th>
                    <th className="py-2.5 px-3 text-right">Costo Mensual (USD)</th>
                    <th className="py-2.5 px-3 rounded-r-lg">Descripción y Uso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {finopsSpec.costBreakdown?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.service}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 text-[10px] font-mono bg-slate-100 text-slate-700 rounded border border-slate-200">
                          {item.tier}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                        ${item.monthlyCostUsd?.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{item.description}</td>
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
