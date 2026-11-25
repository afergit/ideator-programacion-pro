// SCRUM-72: Frontend component to visualise architecture with Archify dynamic interactive topology and Mermaid diagrams.
import React, { useEffect, useState } from "react";
import { phaseService } from "../services/phaseService";
import { getApiErrorMessage } from "../lib/api";
import type { ArchitectureSpec } from "../types/phase";
import { MermaidDiagramViewer } from "./MermaidDiagramViewer";
import { ArchifyExplainerViewer } from "./ArchifyExplainerViewer";
import { Server, Loader2, Sparkles, Box, CheckCircle, Download, Layers } from "lucide-react";

const DEFAULT_FALLBACK_DIAGRAM = `flowchart TD
    subgraph Client["Capa de Presentación (Client-Side)"]
        UI["Frontend SPA<br/>React 18 + TypeScript + Vite :3000"]
    end

    subgraph Host["Host Local / Docker Compose"]
        subgraph AppNet["Red Aislada (Bridge Network)"]
            API["Backend REST API<br/>Spring Boot 3.4.5 + Security :8080"]
            DB[("Base de Datos Relacional<br/>PostgreSQL 15 :5434:5432")]
        end
    end

    subgraph Cloud["Infraestructura Cloud (Microsoft Azure)"]
        Foundry["Azure AI Foundry<br/>Agents Multi-Phase Pipeline"]
        OpenAI["Azure OpenAI Service<br/>Deployment (gpt-5-mini / gpt-4o)"]
        Vault["Azure Key Vault<br/>Gestión Centralizada de Secretos"]
    end

    UI -->|HTTPS REST Bearer JWT| API
    API -->|JDBC HikariCP Pool| DB
    API -->|Foundry Agent Protocol| Foundry
    API -->|Azure OpenAI SDK| OpenAI
    API -->|KeyVault SecretClient| Vault`;

const DEFAULT_FALLBACK_ARCH_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 520" width="100%" height="100%" style="background-color: #04060d; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <linearGradient id="clientGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0284c7"/>
      <stop offset="100%" stop-color="#0369a1"/>
    </linearGradient>
    <linearGradient id="hostGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4f46e5"/>
      <stop offset="100%" stop-color="#3730a3"/>
    </linearGradient>
    <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#059669"/>
      <stop offset="100%" stop-color="#047857"/>
    </linearGradient>
    <filter id="cardShadow" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.5"/>
    </filter>
    <marker id="connArrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8"/>
    </marker>
  </defs>

  <g filter="url(#cardShadow)">
    <rect x="40" y="50" width="240" height="420" rx="12" fill="#0b1329" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="40" y="50" width="240" height="42" rx="12" fill="url(#clientGrad)"/>
    <text x="56" y="77" fill="#ffffff" font-size="13" font-weight="bold">💻 Capa Cliente (SPA)</text>

    <rect x="55" y="110" width="210" height="150" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1"/>
    <text x="68" y="135" fill="#38bdf8" font-size="11" font-weight="bold">React 18 + TypeScript + Vite</text>
    <text x="68" y="158" fill="#94a3b8" font-size="10">• Puerto Host: <tspan fill="#f8fafc">3000 / 80</tspan></text>
    <text x="68" y="178" fill="#94a3b8" font-size="10">• Tailwind CSS + Lucide Icons</text>
    <text x="68" y="198" fill="#94a3b8" font-size="10">• Axios Client (Timeout: 90s)</text>
    <text x="68" y="218" fill="#94a3b8" font-size="10">• Stepper 8 Fases Reactivo</text>
    <text x="68" y="238" fill="#94a3b8" font-size="10">• Sandbox Wireframe Embebido</text>

    <rect x="55" y="280" width="210" height="160" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1"/>
    <text x="68" y="305" fill="#38bdf8" font-size="11" font-weight="bold">Gestión de Estado</text>
    <text x="68" y="328" fill="#94a3b8" font-size="10">• Estado Progresivo de Fases</text>
    <text x="68" y="348" fill="#94a3b8" font-size="10">• Cache reactivo de specs</text>
    <text x="68" y="368" fill="#94a3b8" font-size="10">• Descarga directa Blob (.md, .svg)</text>
    <text x="68" y="388" fill="#94a3b8" font-size="10">• Feedback animado gpt-5-mini</text>
  </g>

  <g filter="url(#cardShadow)">
    <rect x="340" y="50" width="270" height="420" rx="12" fill="#0c122c" stroke="#4f46e5" stroke-width="2"/>
    <rect x="340" y="50" width="270" height="42" rx="12" fill="url(#hostGrad)"/>
    <text x="356" y="77" fill="#ffffff" font-size="13" font-weight="bold">🐳 Host / Docker Bridge Network</text>

    <rect x="355" y="110" width="240" height="170" rx="8" fill="#0f172a" stroke="#4338ca" stroke-width="1.5"/>
    <text x="368" y="135" fill="#818cf8" font-size="11" font-weight="bold">Backend REST API</text>
    <text x="368" y="155" fill="#94a3b8" font-size="10">• Spring Boot 3.4.5 + Java 21</text>
    <text x="368" y="175" fill="#94a3b8" font-size="10">• Puerto: <tspan fill="#f8fafc">8080:8080</tspan></text>
    <text x="368" y="195" fill="#94a3b8" font-size="10">• Spring Security JWT Stateless</text>
    <text x="368" y="215" fill="#94a3b8" font-size="10">• Orquestador 8 Agentes Foundry</text>
    <text x="368" y="235" fill="#94a3b8" font-size="10">• HikariCP Connection Pool (10)</text>
    <text x="368" y="255" fill="#94a3b8" font-size="10">• Fallback Resiliente Offline</text>

    <rect x="355" y="300" width="240" height="140" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1"/>
    <text x="368" y="325" fill="#818cf8" font-size="11" font-weight="bold">Base de Datos PostgreSQL 15</text>
    <text x="368" y="348" fill="#94a3b8" font-size="10">• Mapeo: <tspan fill="#f8fafc">5434:5432</tspan> (Evita colisiones)</text>
    <text x="368" y="368" fill="#94a3b8" font-size="10">• Volumen: <tspan fill="#f8fafc">ideator_pgdata</tspan></text>
    <text x="368" y="388" fill="#94a3b8" font-size="10">• Hibernate Dialect PostgreSQL</text>
    <text x="368" y="408" fill="#94a3b8" font-size="10">• Persistencia PhaseSpecification</text>
  </g>

  <g filter="url(#cardShadow)">
    <rect x="670" y="50" width="250" height="420" rx="12" fill="#091b1d" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="670" y="50" width="250" height="42" rx="12" fill="url(#cloudGrad)"/>
    <text x="686" y="77" fill="#ffffff" font-size="13" font-weight="bold">☁️ Microsoft Azure Cloud</text>

    <rect x="685" y="110" width="220" height="110" rx="8" fill="#0f172a" stroke="#059669" stroke-width="1"/>
    <text x="698" y="135" fill="#34d399" font-size="11" font-weight="bold">Azure AI Foundry</text>
    <text x="698" y="155" fill="#94a3b8" font-size="10">• 8 Agentes Especializados</text>
    <text x="698" y="175" fill="#94a3b8" font-size="10">• OpenAI Responses Protocol</text>
    <text x="698" y="195" fill="#94a3b8" font-size="10">• Versión API: 2025-05-15-prev</text>

    <rect x="685" y="235" width="220" height="105" rx="8" fill="#0f172a" stroke="#059669" stroke-width="1"/>
    <text x="698" y="260" fill="#34d399" font-size="11" font-weight="bold">Azure OpenAI Service</text>
    <text x="698" y="280" fill="#94a3b8" font-size="10">• Modelo: <tspan fill="#f8fafc">gpt-5-mini / gpt-4o</tspan></text>
    <text x="698" y="300" fill="#94a3b8" font-size="10">• Tokens de Razonamiento</text>
    <text x="698" y="320" fill="#94a3b8" font-size="10">• Inferencia Estructurada JSON</text>

    <rect x="685" y="355" width="220" height="85" rx="8" fill="#0f172a" stroke="#059669" stroke-width="1"/>
    <text x="698" y="380" fill="#34d399" font-size="11" font-weight="bold">Azure Key Vault</text>
    <text x="698" y="400" fill="#94a3b8" font-size="10">• Secreto: AzureOpenAiKey</text>
    <text x="698" y="420" fill="#94a3b8" font-size="10">• DefaultAzureCredential</text>
  </g>

  <path d="M 280 180 L 340 180" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#connArrow)"/>
  <text x="286" y="172" fill="#7dd3fc" font-size="9" font-weight="bold">HTTPS/JWT</text>
  <path d="M 475 280 L 475 300" fill="none" stroke="#818cf8" stroke-width="2" marker-end="url(#connArrow)"/>
  <text x="482" y="293" fill="#a5b4fc" font-size="9" font-weight="bold">JDBC:5434</text>
  <path d="M 595 165 L 685 165" fill="none" stroke="#34d399" stroke-width="2" marker-end="url(#connArrow)"/>
  <text x="612" y="157" fill="#6ee7b7" font-size="9" font-weight="bold">Agents API</text>
  <path d="M 595 395 L 685 395" fill="none" stroke="#34d399" stroke-width="2" marker-end="url(#connArrow)"/>
  <text x="615" y="387" fill="#6ee7b7" font-size="9" font-weight="bold">SDK Secret</text>
</svg>`;

export const ArchitectureSpecViewer: React.FC<{ projectId: string; onCompleted?: () => void }> = ({
  projectId,
  onCompleted,
}) => {
  const [arch, setArch] = useState<ArchitectureSpec | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  const loadArchitecture = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await phaseService.getArchitectureSpec(projectId);
      setArch(data);
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadArchitecture();
  }, [projectId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const data = await phaseService.generateArchitectureSpec(projectId, prompt.trim() || undefined);
      setArch(data);
      setSuccessMessage("¡Especificación de arquitectura, diagrama Mermaid y topología SVG generados por ideator-arch-agent!");
      if (onCompleted) onCompleted();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const currentMermaidChart = arch?.mermaidDiagram && arch.mermaidDiagram.trim().length > 0
    ? arch.mermaidDiagram
    : DEFAULT_FALLBACK_DIAGRAM;

  return (
    <div className="space-y-4">
      {/* Cabecera de la Fase de Arquitectura */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-slate-800" />
              <h2 className="text-base font-bold text-slate-900">Fase G: Arquitectura Definitiva & DevOps</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Justificación de stack, topología de contenedores Docker, diagrama Mermaid interactivo y topología SVG.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-50 self-start sm:self-auto"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-cyan-400" />}
            {loading ? "Generando Arquitectura..." : "Disparar Agente Arquitectura"}
          </button>
        </div>

        <div className="mt-3.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Instrucciones para el agente (opcional)
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="ej. Especifica entornos de staging/prod y orquestación con Azure Container Apps"
            className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-slate-900 bg-slate-50"
          />
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
            {successMessage}
          </div>
        )}
      </div>

      {loading && !arch ? (
        <div className="flex flex-col items-center justify-center gap-2 py-12 text-slate-400 bg-white rounded-xl border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
          <p className="text-xs font-medium">El agente está consolidando la arquitectura y trazando el diagrama Mermaid...</p>
        </div>
      ) : !arch ? (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-200">
          <Server className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No hay especificación de arquitectura aún.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Haz clic en &apos;Disparar Agente Arquitectura&apos; para generar el stack técnico y el diagrama interactivo.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* LIENZO DINÁMICO MERMAID INTERACTIVO */}
          <MermaidDiagramViewer
            chart={currentMermaidChart}
            title="Diagrama de Arquitectura de Sistemas & Topología de Red (Mermaid)"
          />

          {/* Justificación Técnica del Stack */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              Justificación Técnica del Stack
            </h3>
            <p className="text-xs leading-relaxed text-slate-700 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/60 whitespace-pre-wrap">
              {arch.justification}
            </p>
          </div>

          {/* TOPOLOGÍA DINÁMICA INTERACTIVA ARCHIFY */}
          <ArchifyExplainerViewer
            projectId={projectId}
            projectName="FinPulse AI"
          />

          {/* Plan de Despliegue con Docker y Orquestación */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Box className="w-4 h-4 text-slate-800" />
              Plan de Despliegue con Docker y Orquestación Cloud
            </h3>
            <p className="text-xs leading-relaxed text-slate-700 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/60 whitespace-pre-wrap mb-3.5">
              {arch.deploymentPlan}
            </p>

            <div className="bg-slate-900 text-slate-100 rounded-xl p-4 font-mono text-[11px] overflow-x-auto">
              <div className="text-slate-400 mb-1"># docker-compose.yml de referencia</div>
              <pre>
{`version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - POSTGRES_PORT=5434
      - AZURE_OPENAI_ENDPOINT=\${AZURE_OPENAI_ENDPOINT}
      - AZURE_FOUNDRY_PROJECT_ENDPOINT=\${AZURE_FOUNDRY_PROJECT_ENDPOINT}
  frontend:
    build: ./frontend
    ports:
      - "3000:80"
  postgres:
    image: postgres:15-alpine
    ports:
      - "5434:5432"
    environment:
      - POSTGRES_DB=ideator_db
      - POSTGRES_USER=ideator_user
      - POSTGRES_PASSWORD=ideator_pass
    volumes:
      - ideator_pgdata:/var/lib/postgresql/data
volumes:
  ideator_pgdata:`}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
