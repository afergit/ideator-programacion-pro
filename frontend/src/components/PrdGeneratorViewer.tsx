import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Layers,
  Target,
  Users,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  RefreshCw,
} from 'lucide-react';

export interface PrdData {
  projectName: string;
  oneLiner: string;
  problemStatement: {
    corePain: string;
    verifiedComplaints: string[];
    currentWorkaround: string;
  };
  targetPersona: {
    title: string;
    description: string;
    primaryGoals: string[];
    biggestFrustrations: string[];
  };
  noveltyMoat: {
    uniqueDelta: string;
    competitorComparison: string;
    defensibilityScore: number;
  };
  moscowScope: {
    mustHave: string[];
    shouldHave: string[];
    couldHave: string[];
    outOfScope: string[];
  };
  nonFunctionalReqs: {
    securityBaseline: string;
    performanceTarget: string;
    availability: string;
  };
  successMetrics: string[];
}

interface PrdGeneratorViewerProps {
  projectId: string;
  projectName?: string;
  onApprovePrd?: () => void;
}

export const PrdGeneratorViewer: React.FC<PrdGeneratorViewerProps> = ({
  projectId: _projectId,
  projectName = 'Proyecto Innovador',
  onApprovePrd,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
  const [copied, setCopied] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  const [prd] = useState<PrdData>({
    projectName: projectName,
    oneLiner:
      'Plataforma asistida por IA para convertir ideas de software en especificaciones técnicas rigurosas y ejecutables.',
    problemStatement: {
      corePain:
        'Los fundadores y equipos de desarrollo pierden semanas redactando requerimientos ambiguos o creando software genérico fácil de clonar sin validación real ni defensibilidad técnica.',
      verifiedComplaints: [
        'Los PRDs tradicionales en Notion/Word carecen de esquemas técnicos exactos y son ignorados.',
        'La mayoría de herramientas de IA generan "wrappers" superficiales sin barreras de entrada ni análisis de competencia.',
        'Falta de sincronización entre la visión del negocio y las decisiones de base de datos y seguridad.',
      ],
      currentWorkaround:
        'Hojas de cálculo desactualizadas, reuniones repetitivas de refinamiento y reescritura de código en producción.',
    },
    targetPersona: {
      title: 'Tech Founder & Lead Architect',
      description:
        'Responsable de validar rápidamente la viabilidad técnica y comercial de nuevos productos sin acumular deuda técnica prematura.',
      primaryGoals: [
        'Acelerar el ciclo de idea a especificación ejecutable en menos de 48 horas.',
        'Blindar la arquitectura con estándares OWASP y modelos relacionales 3NF desde el día cero.',
        'Generar especificaciones claras listas para alimentar agentes de código (Cursor, Windsurf, Claude Code).',
      ],
      biggestFrustrations: [
        'Falta de claridad en las especificaciones funcionales.',
        'Costos de nube descontrolados por falta de proyección FinOps inicial.',
        'Vulnerabilidades de seguridad descubiertas en auditorías tardías.',
      ],
    },
    noveltyMoat: {
      uniqueDelta:
        'Pipeline socrático en 8 fases continuas (A-H) con agentes especializados en Azure Foundry que ejecutan examen adversarial (abogado del diablo) y generan especificaciones físicas verificables.',
      competitorComparison:
        'A diferencia de generadores de texto planos, Ideator vincula la ideación con contratos OpenAPI reales, esquemas DDL SQL, matriz OWASP y presupuesto FinOps proyectado.',
      defensibilityScore: 92,
    },
    moscowScope: {
      mustHave: [
        'Autenticación JWT stateless con RBAC (Owner, Editor, Viewer)',
        'Asistente socrático por fases con validación de bloqueos de información',
        'Generador y visor de PRD estructurado con exportación Markdown',
        'Modelado relacional DDL de base de datos y visor visual de esquemas',
      ],
      shouldHave: [
        'Simulador adversarial para detectar vulnerabilidades en la propuesta de valor',
        'Mascota espacial guía con micro-interacciones de advertencia por fase',
        'Exportación unificada en Markdown de producto y arquitectura',
      ],
      couldHave: [
        'Scraper de Reddit para minería de quejas en vivo',
        'Exportación directa de tickets para Jira y GitHub Issues',
      ],
      outOfScope: [
        'Generación de código ejecutable completo en esta fase (se prioriza especificación rigurosa)',
        'Pasarela de pagos en producción (previsto para fase posterior)',
      ],
    },
    nonFunctionalReqs: {
      securityBaseline:
        'Cifrado TLS 1.3 en tránsito, contraseñas con BCrypt (salt cost 12), secretos en Azure Key Vault.',
      performanceTarget:
        'Tiempo de respuesta del backend < 200ms para endpoints CRUD; streaming SSE para respuestas de IA.',
      availability:
        'Disponibilidad del 99.9% soportada por contenedores Docker y PostgreSQL con volumen persistente.',
    },
    successMetrics: [
      'Reducción del 75% en el tiempo de definición de especificaciones funcionales y técnicas.',
      '100% de proyectos con DDL SQL y contratos REST conformes antes de codificar.',
      'Cero secretos o credenciales expuestas en repositorios.',
    ],
  });

  const generateMarkdownPrd = (): string => {
    return `# PRD: ${prd.projectName}
**One-Liner:** ${prd.oneLiner}

---

## 1. Declaración del Problema & Validación de Demanda
**Dolor Nuclear:** ${prd.problemStatement.corePain}

### Frustraciones Verificadas en Comunidades:
${prd.problemStatement.verifiedComplaints.map((c) => `- ${c}`).join('\n')}

**Workaround Actual:** ${prd.problemStatement.currentWorkaround}

---

## 2. Perfil de Usuario Objetivo (Persona)
**Rol:** ${prd.targetPersona.title}
*${prd.targetPersona.description}*

### Objetivos Primarios:
${prd.targetPersona.primaryGoals.map((g) => `- ${g}`).join('\n')}

### Frustraciones Críticas:
${prd.targetPersona.biggestFrustrations.map((f) => `- ${f}`).join('\n')}

---

## 3. Foso Defensivo & Factor de Novedad (Novelty Moat)
- **Delta Técnico Único:** ${prd.noveltyMoat.uniqueDelta}
- **Ventaja Competitiva:** ${prd.noveltyMoat.competitorComparison}
- **Puntuación de Defensibilidad:** ${prd.noveltyMoat.defensibilityScore} / 100

---

## 4. Alcance Funcional (Metodología MoSCoW)

### Must Have (P0 - Indispensable):
${prd.moscowScope.mustHave.map((item) => `- [x] ${item}`).join('\n')}

### Should Have (P1 - Alto Valor):
${prd.moscowScope.shouldHave.map((item) => `- [ ] ${item}`).join('\n')}

### Could Have (P2 - Deseable):
${prd.moscowScope.couldHave.map((item) => `- [ ] ${item}`).join('\n')}

### Out of Scope (Fuera del Alcance):
${prd.moscowScope.outOfScope.map((item) => `- [ ] ${item}`).join('\n')}

---

## 5. Requerimientos No Funcionales
- **Seguridad:** ${prd.nonFunctionalReqs.securityBaseline}
- **Rendimiento:** ${prd.nonFunctionalReqs.performanceTarget}
- **Disponibilidad:** ${prd.nonFunctionalReqs.availability}

---

## 6. Métricas de Éxito (KPIs)
${prd.successMetrics.map((m) => `- ${m}`).join('\n')}
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdownPrd());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const md = generateMarkdownPrd();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PRD_${prd.projectName.replace(/\s+/g, '_')}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 1000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden mt-4">
      {/* Cabecera del PRD sobria y limpia */}
      <div className="px-5 py-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Ideator Architecture
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-xs font-semibold text-slate-700">Product Requirements Document</span>
          </div>
          <h3 className="text-base font-bold text-slate-900 mt-0.5">{prd.projectName}</h3>
          <p className="text-xs text-slate-500 max-w-2xl mt-0.5 leading-relaxed">{prd.oneLiner}</p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={handleRegenerate}
            disabled={isGenerating}
            title="Sincronizar con la conversación"
            className="p-1.5 px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Sincronizar</span>
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="p-1.5 px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Descargar .md</span>
          </button>

          {onApprovePrd && (
            <button
              type="button"
              onClick={onApprovePrd}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Aprobar PRD
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4 text-xs">
        <button
          type="button"
          onClick={() => setActiveTab('preview')}
          className={`py-2.5 font-semibold border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Vista Estructurada
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('raw')}
          className={`py-2.5 font-semibold border-b-2 transition-colors ${
            activeTab === 'raw'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Markdown Raw
        </button>
      </div>

      {/* Contenido Editorial Limpio */}
      <div className="p-5">
        {activeTab === 'preview' ? (
          <div className="space-y-5">
            {/* 1. Declaración del Problema & Validación de Demanda */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                <Target className="w-3.5 h-3.5 text-slate-600" />
                1. Validación del Dolor de Mercado
              </div>
              <p className="text-xs font-semibold text-slate-800 mb-2">{prd.problemStatement.corePain}</p>

              <div className="space-y-1 mb-2.5">
                <span className="text-[11px] font-semibold text-slate-500">Frustraciones detectadas:</span>
                {prd.problemStatement.verifiedComplaints.map((c, i) => (
                  <div key={i} className="text-xs text-slate-700 flex items-start gap-2 bg-white p-2 rounded-lg border border-slate-200/50">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>

              <div className="text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200/50">
                <span className="font-semibold text-slate-800">Solución improvisada actual (Workaround):</span>{' '}
                {prd.problemStatement.currentWorkaround}
              </div>
            </div>

            {/* 2. Persona & Foso Defensivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  2. Perfil de Usuario Diana (Persona)
                </div>
                <h4 className="text-xs font-bold text-slate-800">{prd.targetPersona.title}</h4>
                <p className="text-xs text-slate-600 mb-2">{prd.targetPersona.description}</p>

                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Objetivos:</span>
                  {prd.targetPersona.primaryGoals.map((g, i) => (
                    <div key={i} className="text-xs text-slate-700 flex items-center gap-2">
                      <Check className="w-3 h-3 text-slate-500" />
                      <span>{g}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                    3. Foso Defensivo & Factor de Novedad
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
                    Score: {prd.noveltyMoat.defensibilityScore}%
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="font-semibold text-slate-800">Delta No-Obvio:</span>
                    <p className="text-slate-600 mt-0.5">{prd.noveltyMoat.uniqueDelta}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Frente a Competidores:</span>
                    <p className="text-slate-600 mt-0.5">{prd.noveltyMoat.competitorComparison}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Alcance Funcional MoSCoW */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                4. Alcance Funcional Priorizado (MoSCoW)
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-900 block mb-1.5">
                    Must Have (P0)
                  </span>
                  <ul className="space-y-1">
                    {prd.moscowScope.mustHave.map((m, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-slate-900 mt-0.5 flex-shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block mb-1.5">
                    Should Have (P1)
                  </span>
                  <ul className="space-y-1">
                    {prd.moscowScope.shouldHave.map((s, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 flex-shrink-0" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                    Could Have (P2)
                  </span>
                  <ul className="space-y-1">
                    {prd.moscowScope.couldHave.map((c, i) => (
                      <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200/70 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Out of Scope
                  </span>
                  <ul className="space-y-1">
                    {prd.moscowScope.outOfScope.map((o, i) => (
                      <li key={i} className="text-xs text-slate-400 flex items-start gap-1.5 line-through">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                        <span>{o}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Métricas & KPIs */}
            <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/60">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                5. Métricas de Éxito & Criterios de Aceptación
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {prd.successMetrics.map((kpi, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-lg border border-slate-200/70 text-xs text-slate-700">
                    <span className="font-semibold text-slate-900 block mb-0.5">KPI #{idx + 1}</span>
                    {kpi}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-xs overflow-x-auto font-mono leading-relaxed max-h-[460px]">
            {generateMarkdownPrd()}
          </pre>
        )}
      </div>
    </div>
  );
};
