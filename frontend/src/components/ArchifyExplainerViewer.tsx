import React, { useState, useMemo } from 'react';
import {
  Monitor,
  Server,
  Database,
  Cpu,
  Lock,
  Cloud,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Download,
  Search,
  CheckCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Shield,
  ArrowRight,
  Info,
  X,
} from 'lucide-react';

export interface ArchComponent {
  id: string;
  name: string;
  category: 'client' | 'app' | 'cloud';
  tierLabel: string;
  iconType: 'monitor' | 'server' | 'database' | 'cpu' | 'lock' | 'cloud';
  tech: string;
  port?: string;
  protocol: string;
  role: string;
  security: string;
  inbound: string[];
  outbound: string[];
}

export interface ArchConnection {
  id: string;
  from: string;
  to: string;
  label: string;
  protocol: string;
}

const DEFAULT_ARCH_COMPONENTS: ArchComponent[] = [
  {
    id: 'spa',
    name: 'Frontend SPA (FinPulse UI)',
    category: 'client',
    tierLabel: 'Capa Cliente (SPA)',
    iconType: 'monitor',
    tech: 'React 18 + TypeScript + Vite + Tailwind',
    port: 'Port 3000 / 80',
    protocol: 'HTTPS / TLS 1.3',
    role: 'Dashboard interactivo de telemetría de costos, visualizador de anomalías y disparador de remediación de 1 clic.',
    security: 'Tokens JWT stateless en localStorage, cabecera Authorization Bearer.',
    inbound: [],
    outbound: ['api'],
  },
  {
    id: 'api',
    name: 'Backend API Gateway & Core',
    category: 'app',
    tierLabel: 'Capa Aplicación (Docker / Container Apps)',
    iconType: 'server',
    tech: 'Spring Boot 3.4.5 + Java 21 + Spring Security',
    port: 'Port 8080:8080',
    protocol: 'REST JSON / HTTP/2',
    role: 'Orquestación de agentes, validación de reglas de negocio, motor de "Impacto Cero" y control de acceso RBAC.',
    security: 'Spring Security Filter Chain, BCrypt hashing, sesión STATELESS.',
    inbound: ['spa'],
    outbound: ['db', 'foundry', 'keyvault', 'cloud_apis'],
  },
  {
    id: 'db',
    name: 'PostgreSQL Relacional & Métricas',
    category: 'app',
    tierLabel: 'Capa Aplicación (Docker / Container Apps)',
    iconType: 'database',
    tech: 'PostgreSQL 16 Flexible Server',
    port: 'Port 5434:5432 (Isolated)',
    protocol: 'JDBC / HikariCP Pool (10)',
    role: 'Persistencia ACID de tenants, cuentas cloud vinculadas, instantáneas horarias de costo y logs de auditoría.',
    security: 'Conexión local aislada en red Docker / SSL enforce en Azure Postgres.',
    inbound: ['api'],
    outbound: [],
  },
  {
    id: 'foundry',
    name: 'Azure AI Foundry Agents',
    category: 'cloud',
    tierLabel: 'Infraestructura Cloud (Azure & AWS)',
    iconType: 'cpu',
    tech: 'Microsoft Foundry + gpt-5-mini',
    port: 'Endpoint HTTPS 443',
    protocol: 'OpenAI Agent Responses Protocol',
    role: 'Inferencia predictiva y análisis prescriptivo para detección de anomalías y sugerencias de remediación.',
    security: 'Autenticación mediante api-key y token Bearer desde Azure Key Vault.',
    inbound: ['api'],
    outbound: [],
  },
  {
    id: 'keyvault',
    name: 'Azure Key Vault (Secretos)',
    category: 'cloud',
    tierLabel: 'Infraestructura Cloud (Azure & AWS)',
    iconType: 'lock',
    tech: 'Azure Key Vault Secrets SDK 4.8.5',
    port: 'HTTPS 443 Vault URI',
    protocol: 'DefaultAzureCredential / REST',
    role: 'Almacenamiento seguro desacoplado de credenciales IAM de Azure y AWS, claves API y secretos JWT.',
    security: 'Cifrado en reposo con HSM FIPS 140-2 Level 2 y auditoría de accesos.',
    inbound: ['api'],
    outbound: [],
  },
  {
    id: 'cloud_apis',
    name: 'Azure & AWS Billing Connectors',
    category: 'cloud',
    tierLabel: 'Infraestructura Cloud (Azure & AWS)',
    iconType: 'cloud',
    tech: 'Azure Cost Management API & AWS Cost Explorer',
    port: 'HTTPS 443 REST Endpoints',
    protocol: 'IAM AssumeRole / Service Principal',
    role: 'Ingesta horaria de telemetría de facturación y logs de tráfico de red para el motor de Impacto Cero.',
    security: 'Roles IAM de solo lectura estrictos sin permisos de modificación directa.',
    inbound: ['api'],
    outbound: [],
  },
];

const DEFAULT_CONNECTIONS: ArchConnection[] = [
  { id: 'c1', from: 'spa', to: 'api', label: 'HTTPS / REST (Bearer JWT)', protocol: 'REST' },
  { id: 'c2', from: 'api', to: 'db', label: 'JDBC / HikariCP Pool (10)', protocol: 'JDBC' },
  { id: 'c3', from: 'api', to: 'foundry', label: 'Agent Protocol (gpt-5-mini)', protocol: 'HTTPS' },
  { id: 'c4', from: 'api', to: 'keyvault', label: 'SecretClient (AzureOpenAiKey)', protocol: 'SDK' },
  { id: 'c5', from: 'api', to: 'cloud_apis', label: 'IAM Read-Only Ingesta (Azure/AWS)', protocol: 'REST' },
];

interface ArchifyExplainerViewerProps {
  projectId?: string;
  projectName?: string;
  onSelectComponent?: (comp: ArchComponent) => void;
}

export const ArchifyExplainerViewer: React.FC<ArchifyExplainerViewerProps> = ({
  projectId = 'default',
  projectName = 'FinPulse AI',
}) => {
  const [selectedCompId, setSelectedCompId] = useState<string>('api');
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const selectedComponent = useMemo(() => {
    return DEFAULT_ARCH_COMPONENTS.find((c) => c.id === selectedCompId) || DEFAULT_ARCH_COMPONENTS[1];
  }, [selectedCompId]);

  // Cálculo de nodos conectados para Relationship / Path Tracing
  const activeRelationCompIds = useMemo(() => {
    const targetId = hoveredCompId || selectedCompId;
    if (!targetId) return new Set<string>();

    const connected = new Set<string>([targetId]);
    DEFAULT_CONNECTIONS.forEach((conn) => {
      if (conn.from === targetId) connected.add(conn.to);
      if (conn.to === targetId) connected.add(conn.from);
    });
    return connected;
  }, [hoveredCompId, selectedCompId]);

  const filteredComponents = useMemo(() => {
    if (!searchQuery.trim()) return DEFAULT_ARCH_COMPONENTS;
    const q = searchQuery.toLowerCase();
    return DEFAULT_ARCH_COMPONENTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.tech.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(1.8, Math.max(0.7, Number((prev + delta).toFixed(2)))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const renderIcon = (type: string, className = 'w-4 h-4') => {
    switch (type) {
      case 'monitor':
        return <Monitor className={className} />;
      case 'server':
        return <Server className={className} />;
      case 'database':
        return <Database className={className} />;
      case 'cpu':
        return <Cpu className={className} />;
      case 'lock':
        return <Lock className={className} />;
      case 'cloud':
        return <Cloud className={className} />;
      default:
        return <Server className={className} />;
    }
  };

  // Generador de HTML Autónomo interactivo listo para Azure Blob Storage
  const handleDownloadStandaloneHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - Arquitectura Interactiva (Archify)</title>
  <style>
    :root {
      --bg: #04060d;
      --card-bg: #090f1d;
      --card-hover: #10192e;
      --border: rgba(255, 255, 255, 0.08);
      --accent: #2457e6;
      --accent-cyan: #00c2cb;
      --text: #f8fafc;
      --muted: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 16px 24px;
      background: rgba(9, 15, 29, 0.8);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      font-size: 11px;
      font-weight: 700;
      color: var(--accent-cyan);
      background: rgba(0, 194, 203, 0.12);
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid rgba(0, 194, 203, 0.3);
    }
    .container {
      display: flex;
      flex: 1;
      gap: 20px;
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }
    .diagram-panel {
      flex: 2;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    .tier-col {
      background: rgba(255, 255, 255, 0.015);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .tier-title {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      border-bottom: 1px solid var(--border);
      padding-bottom: 8px;
    }
    .node-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px;
      cursor: pointer;
      transition: all 140ms cubic-bezier(0.23, 1, 0.32, 1);
    }
    .node-card:hover {
      background: var(--card-hover);
      border-color: var(--accent-cyan);
      transform: translateY(-2px);
    }
    .node-card:active {
      transform: scale(0.97);
    }
    .node-name {
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #fff;
    }
    .node-tech {
      font-size: 11px;
      color: var(--muted);
      font-family: monospace;
    }
    .inspector-panel {
      flex: 1;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .section-label {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 4px;
    }
    .detail-box {
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 10px 12px;
      font-size: 12px;
      line-height: 1.5;
    }
    @media (max-width: 900px) {
      .container { flex-direction: column; }
      .diagram-panel { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1 style="font-size: 16px; font-weight: 800; color: #fff;">${projectName} • Arquitectura de Sistemas</h1>
      <p style="font-size: 12px; color: var(--muted);">Artifact interactivo compilado con Archify IR</p>
    </div>
    <span class="badge">Archify Standalone • Azure Blob Ready</span>
  </header>

  <div class="container">
    <div class="diagram-panel">
      <div class="tier-col">
        <div class="tier-title">1. Capa Cliente (SPA)</div>
        <div class="node-card" onclick="inspectNode('spa')">
          <div class="node-name">Frontend React SPA</div>
          <div class="node-tech">React 18 + Vite :3000</div>
        </div>
      </div>

      <div class="tier-col">
        <div class="tier-title">2. Host / Docker Network</div>
        <div class="node-card" onclick="inspectNode('api')">
          <div class="node-name">Backend API Gateway</div>
          <div class="node-tech">Spring Boot 3.4.5 :8080</div>
        </div>
        <div class="node-card" onclick="inspectNode('db')">
          <div class="node-name">PostgreSQL 16 DB</div>
          <div class="node-tech">PostgreSQL :5434</div>
        </div>
      </div>

      <div class="tier-col">
        <div class="tier-title">3. Cloud & Multi-Cloud IA</div>
        <div class="node-card" onclick="inspectNode('foundry')">
          <div class="node-name">Azure AI Foundry</div>
          <div class="node-tech">gpt-5-mini Reasoning</div>
        </div>
        <div class="node-card" onclick="inspectNode('keyvault')">
          <div class="node-name">Azure Key Vault</div>
          <div class="node-tech">Gestión Centralizada</div>
        </div>
        <div class="node-card" onclick="inspectNode('cloud_apis')">
          <div class="node-name">Azure & AWS Billing APIs</div>
          <div class="node-tech">Telemetría IAM Read-Only</div>
        </div>
      </div>
    </div>

    <div class="inspector-panel" id="inspector">
      <div>
        <div class="section-label">Componente Seleccionado</div>
        <h2 id="comp-name" style="font-size: 16px; font-weight: 800; color: var(--accent-cyan);">Backend API Gateway</h2>
        <div id="comp-tech" style="font-size: 12px; color: var(--muted); font-family: monospace;">Spring Boot 3.4.5 + Java 21</div>
      </div>
      <div>
        <div class="section-label">Rol en la Arquitectura</div>
        <div class="detail-box" id="comp-role">Orquestación de agentes, validación de reglas de negocio y motor de "Impacto Cero".</div>
      </div>
      <div>
        <div class="section-label">Seguridad & Protocolo</div>
        <div class="detail-box" id="comp-sec">Spring Security JWT Stateless, TLS 1.3, SecretClient con Azure Key Vault.</div>
      </div>
    </div>
  </div>

  <script>
    const data = ${JSON.stringify(DEFAULT_ARCH_COMPONENTS)};
    function inspectNode(id) {
      const comp = data.find(c => c.id === id);
      if (!comp) return;
      document.getElementById('comp-name').textContent = comp.name;
      document.getElementById('comp-tech').textContent = comp.tech + " (" + (comp.port || "HTTPS") + ")";
      document.getElementById('comp-role').textContent = comp.role;
      document.getElementById('comp-sec').textContent = comp.security;
    }
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `archify-${projectId}-arquitectura.html`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200 ${
        isFullScreen ? 'fixed inset-4 z-50 flex flex-col shadow-2xl' : 'mt-4'
      }`}
    >
      {/* Barra de Herramientas Superior Estilo Archify */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                Topología Interactiva Dinámica (Archify)
              </h4>
              <span className="text-[10px] font-mono bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                Archify IR v1.0
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Trazabilidad de relaciones en tiempo real, puertos e inspección de seguridad
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Buscador de Componentes */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar componente..."
              className="pl-8 pr-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-800 w-36 sm:w-44"
            />
          </div>

          {/* Controles de Zoom */}
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => handleZoom(-0.15)}
              title="Alejar (Zoom Out)"
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              title="Restablecer 100%"
              className="px-1.5 text-[10px] font-mono font-semibold text-slate-600"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              onClick={() => handleZoom(0.15)}
              title="Acercar (Zoom In)"
              className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Descargar HTML Standalone Archify (Listo para Azure Blob Storage) */}
          <button
            type="button"
            onClick={handleDownloadStandaloneHtml}
            title="Exportar HTML autónomo para Azure Blob Storage"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-2xs"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>Exportar HTML (.html)</span>
          </button>

          {/* Pantalla Completa */}
          <button
            type="button"
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={isFullScreen ? 'Salir de pantalla completa' : 'Ver pantalla completa'}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200 bg-white"
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Contenedor Principal: Lienzo Topológico + Inspector Lateral */}
      <div className={`flex flex-col lg:flex-row ${isFullScreen ? 'flex-1 overflow-hidden' : ''}`}>
        {/* Lienzo Topológico */}
        <div
          className="flex-1 p-4 sm:p-6 bg-[#04060d] text-slate-100 overflow-auto relative min-h-[460px]"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
            {/* TIER 1: CLIENT PRESENTATION */}
            <div className="rounded-xl border border-sky-900/60 bg-sky-950/20 p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-sky-800/40">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-sky-400">
                  1. Capa Presentación
                </span>
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              </div>

              {filteredComponents
                .filter((c) => c.category === 'client')
                .map((comp) => {
                  const isSelected = selectedCompId === comp.id;
                  const isConnected = activeRelationCompIds.has(comp.id);
                  const isDimmed = !isConnected && activeRelationCompIds.size > 0;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedCompId(comp.id)}
                      onMouseEnter={() => setHoveredCompId(comp.id)}
                      onMouseLeave={() => setHoveredCompId(null)}
                      className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-sky-900/40 border-sky-400 ring-2 ring-sky-400/30 shadow-lg'
                          : 'bg-slate-900/80 border-slate-800 hover:border-sky-500 hover:bg-slate-800/80'
                      } ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 mt-0.5">
                          {renderIcon(comp.iconType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-100 truncate">{comp.name}</h5>
                          <p className="text-[11px] font-mono text-sky-300/80 mt-0.5">{comp.tech}</p>
                          <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {comp.port}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* TIER 2: APPLICATION & DATA */}
            <div className="rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-800/40">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-indigo-400">
                  2. Docker Bridge / Host
                </span>
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
              </div>

              {filteredComponents
                .filter((c) => c.category === 'app')
                .map((comp) => {
                  const isSelected = selectedCompId === comp.id;
                  const isConnected = activeRelationCompIds.has(comp.id);
                  const isDimmed = !isConnected && activeRelationCompIds.size > 0;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedCompId(comp.id)}
                      onMouseEnter={() => setHoveredCompId(comp.id)}
                      onMouseLeave={() => setHoveredCompId(null)}
                      className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-indigo-900/40 border-indigo-400 ring-2 ring-indigo-400/30 shadow-lg'
                          : 'bg-slate-900/80 border-slate-800 hover:border-indigo-500 hover:bg-slate-800/80'
                      } ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
                          {renderIcon(comp.iconType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-100 truncate">{comp.name}</h5>
                          <p className="text-[11px] font-mono text-indigo-300/80 mt-0.5">{comp.tech}</p>
                          <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {comp.port}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* TIER 3: MULTI-CLOUD & AI */}
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-3.5 flex flex-col gap-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-800/40">
                <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-emerald-400">
                  3. Multi-Cloud & IA
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>

              {filteredComponents
                .filter((c) => c.category === 'cloud')
                .map((comp) => {
                  const isSelected = selectedCompId === comp.id;
                  const isConnected = activeRelationCompIds.has(comp.id);
                  const isDimmed = !isConnected && activeRelationCompIds.size > 0;

                  return (
                    <div
                      key={comp.id}
                      onClick={() => setSelectedCompId(comp.id)}
                      onMouseEnter={() => setHoveredCompId(comp.id)}
                      onMouseLeave={() => setHoveredCompId(null)}
                      className={`p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-emerald-900/40 border-emerald-400 ring-2 ring-emerald-400/30 shadow-lg'
                          : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500 hover:bg-slate-800/80'
                      } ${isDimmed ? 'opacity-30' : 'opacity-100'}`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 mt-0.5">
                          {renderIcon(comp.iconType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="text-xs font-bold text-slate-100 truncate">{comp.name}</h5>
                          <p className="text-[11px] font-mono text-emerald-300/80 mt-0.5">{comp.tech}</p>
                          <span className="inline-block mt-2 px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                            {comp.port}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Panel Inspector de Archify (Detalles del Nodo y Relaciones) */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200/80 p-4 sm:p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-800">
                  {renderIcon(selectedComponent.iconType)}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    {selectedComponent.tierLabel}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">{selectedComponent.name}</h4>
                </div>
              </div>
            </div>

            {/* Metadatos Técnicos */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Stack & Versión
              </span>
              <p className="text-xs font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200/60 text-slate-800">
                {selectedComponent.tech}
              </p>
            </div>

            {/* Rol de Arquitectura */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Rol en la Solución
              </span>
              <p className="text-xs text-slate-600 bg-slate-50/50 p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                {selectedComponent.role}
              </p>
            </div>

            {/* Seguridad y Protocolo */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Seguridad & Protocolo
              </span>
              <div className="flex items-start gap-1.5 p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-950 text-xs">
                <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{selectedComponent.security}</span>
              </div>
            </div>

            {/* Conexiones Activas de este componente */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Flujos Conectados ({selectedComponent.outbound.length + selectedComponent.inbound.length})
              </span>
              <div className="space-y-1.5">
                {DEFAULT_CONNECTIONS.filter(
                  (c) => c.from === selectedComponent.id || c.to === selectedComponent.id
                ).map((conn) => (
                  <div
                    key={conn.id}
                    className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 text-[11px] text-slate-700 flex items-center justify-between"
                  >
                    <span className="font-semibold">{conn.label}</span>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">
                      {conn.protocol}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Motor Archify IR</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Verificado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
