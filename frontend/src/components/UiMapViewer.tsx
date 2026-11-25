// SCRUM-71: Visor Avanzado Studio-Grade para Mapas UI/UX y Wireframes Multi-Interfaz en Cascada
import React, { useEffect, useState } from "react";
import { phaseService } from "../services/phaseService";
import { getApiErrorMessage } from "../lib/api";
import type { ScreenSpec, UiMap } from "../types/phase";
import {
  Layout,
  Loader2,
  Sparkles,
  ExternalLink,
  Eye,
  Code,
  Copy,
  Check,
  Download,
  Monitor,
  Layers,
  Globe,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";

const HTTP_METHOD_COLORS: Record<string, string> = {
  GET: "bg-emerald-100 text-emerald-800 border-emerald-300",
  POST: "bg-indigo-100 text-indigo-800 border-indigo-300",
  PUT: "bg-amber-100 text-amber-800 border-amber-300",
  DELETE: "bg-rose-100 text-rose-800 border-rose-300",
  PATCH: "bg-purple-100 text-purple-800 border-purple-300",
};

export const UiMapViewer: React.FC<{ projectId: string; onCompleted?: () => void }> = ({
  projectId,
  onCompleted,
}) => {
  const [uiMap, setUiMap] = useState<UiMap>({ screens: [] });
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Modo de visualización: 'cascade' (todas en cascada hacia abajo) | 'focus' (pestañas)
  const [viewMode, setViewMode] = useState<"cascade" | "focus">("cascade");
  // Índice de pantalla enfocada en modo focus
  const [focusedScreenIndex, setFocusedScreenIndex] = useState<number>(0);
  // Pestaña activa por pantalla (id -> 'preview' | 'code')
  const [screenTabs, setScreenTabs] = useState<Record<number, "preview" | "code">>({});
  // Copiado temporal por pantalla
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadUiMap = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await phaseService.getUiMap(projectId);
      setUiMap({
        screens: data && Array.isArray(data.screens) ? data.screens : [],
        wireframeHtml: data?.wireframeHtml,
      });
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUiMap();
  }, [projectId]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage("");
    try {
      const data = await phaseService.generateUiMap(projectId, prompt.trim() || undefined);
      setUiMap({
        screens: data && Array.isArray(data.screens) ? data.screens : [],
        wireframeHtml: data?.wireframeHtml,
      });
      setSuccessMessage("¡Mapa de pantallas y wireframes multi-interfaz generados con éxito por ideator-ui-agent!");
      if (onCompleted) onCompleted();
    } catch (e) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const screens = uiMap.screens.length > 0 ? uiMap.screens : [
    {
      name: "Dashboard Principal & KPIs",
      route: "/dashboard",
      description: "Vista principal con métricas clave y resumen ejecutivo.",
      components: ["Navbar", "ProjectStatsWidget", "QuickActionPanel", "RecentActivityFeed"],
      wireframeHtml: uiMap.wireframeHtml,
    },
  ];

  const isMultiScreen = screens.length > 1;

  const getScreenHtml = (screen: ScreenSpec, index: number): string => {
    // Detectar si la pantalla tiene HTML propio único o si es una réplica del root/Dashboard
    const isReplicated =
      !screen.wireframeHtml ||
      screen.wireframeHtml.trim().length < 50 ||
      screen.wireframeHtml.trim() === uiMap.wireframeHtml?.trim() ||
      (index > 0 && screens[0]?.wireframeHtml && screen.wireframeHtml.trim() === screens[0].wireframeHtml.trim()) ||
      (index > 0 && screen.wireframeHtml.includes("Dashboard") && !screen.name.toLowerCase().includes("dashboard"));

    if (!isReplicated && screen.wireframeHtml) {
      return screen.wireframeHtml;
    }

    // Pantalla 0: Dashboard Principal
    if (index === 0) {
      return uiMap.wireframeHtml || getDashboardWireframeHtml(screen);
    }

    // Pantalla 1: Auditoría de Anomalías / Listado de Recursos / Alertas
    if (
      index === 1 ||
      (screen.route && (screen.route.includes("anomal") || screen.route.includes("user") || screen.route.includes("alert"))) ||
      screen.name.toLowerCase().includes("anomal") ||
      screen.name.toLowerCase().includes("alert")
    ) {
      return getAnomaliesWireframeHtml(screen);
    }

    // Pantalla 2: Conectores Cloud IAM / Configuración Zero-Impact
    if (
      index === 2 ||
      (screen.route && (screen.route.includes("connect") || screen.route.includes("setting") || screen.route.includes("iam"))) ||
      screen.name.toLowerCase().includes("conect") ||
      screen.name.toLowerCase().includes("config") ||
      screen.name.toLowerCase().includes("ajust")
    ) {
      return getConnectorsWireframeHtml(screen);
    }

    // Pantalla genérica especializada según sus componentes
    return getSpecializedScreenWireframeHtml(screen, index);
  };

  function getDashboardWireframeHtml(s: ScreenSpec): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.name || "Dashboard"} - FinPulse AI</title>
  <style>
    :root { --bg: #04060d; --card: #0A192F; --border: #1e293b; --text: #f8fafc; --muted: #94a3b8; --cyan: #00C2CB; --indigo: #6366f1; --success: #10b981; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 1.5rem; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .header h1 { font-size: 1.25rem; font-weight: 700; color: var(--text); }
    .badge { background: rgba(0, 194, 203, 0.15); color: var(--cyan); padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; border: 1px solid rgba(0,194,203,0.3); }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; }
    .card h3 { font-size: 0.7rem; text-transform: uppercase; color: var(--muted); margin-bottom: 0.35rem; }
    .card .val { font-size: 1.4rem; font-weight: 800; color: var(--text); }
    .card .sub { font-size: 0.7rem; color: var(--success); margin-top: 0.25rem; }
    .chart-box { background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; margin-bottom: 1rem; }
    .chart-box h3 { font-size: 0.85rem; font-weight: 700; margin-bottom: 0.75rem; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${s.name || "Dashboard FinOps Principal"}</h1>
      <p style="font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem;">Consumo consolidado Azure & AWS en tiempo real</p>
    </div>
    <span class="badge">● Monitoreo Activo</span>
  </div>
  <div class="grid">
    <div class="card">
      <h3>Gasto Mes Actual</h3>
      <div class="val">$3,240.00</div>
      <div class="sub">↓ 14% vs mes anterior</div>
    </div>
    <div class="card">
      <h3>Ahorro Identificado</h3>
      <div class="val" style="color: var(--cyan);">$845.00</div>
      <div class="sub">6 acciones de 1 clic</div>
    </div>
    <div class="card">
      <h3>Cuentas Conectadas</h3>
      <div class="val">2 Tenants</div>
      <div class="sub">1 Azure • 1 AWS</div>
    </div>
    <div class="card">
      <h3>Regla Zero-Impact</h3>
      <div class="val" style="color: var(--success);">100% OK</div>
      <div class="sub">30 días sin tráfico</div>
    </div>
  </div>
  <div class="chart-box">
    <h3>Proyección de Gasto y Curva de Ahorro con FinPulse AI</h3>
    <svg viewBox="0 0 700 120" style="width: 100%; height: 90px; overflow: visible;">
      <polyline fill="none" stroke="#6366f1" stroke-width="2.5" points="0,95 100,85 200,90 300,70 400,60 500,45 600,30 700,20" />
      <polyline fill="none" stroke="#00C2CB" stroke-dasharray="4" stroke-width="2" points="300,70 400,40 500,25 600,15 700,10" />
      <circle cx="700" cy="10" r="4" fill="#00C2CB" />
    </svg>
    <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--muted); margin-top: 0.5rem;">
      <span>Línea Azul: Gasto sin optimizar</span>
      <span style="color: var(--cyan);">Línea Cian Punteada: Gasto proyectado con remediación 1-clic</span>
    </div>
  </div>
</body>
</html>`;
  }

  function getAnomaliesWireframeHtml(s: ScreenSpec): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.name || "Anomalías"} - FinPulse AI</title>
  <style>
    :root { --bg: #04060d; --card: #0A192F; --border: #1e293b; --text: #f8fafc; --muted: #94a3b8; --cyan: #00C2CB; --warn: #f59e0b; --danger: #ef4444; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 1.5rem; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.25rem; }
    .header h1 { font-size: 1.25rem; font-weight: 700; }
    .filters { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
    .filter-btn { background: #070d18; border: 1px solid var(--border); color: var(--muted); padding: 0.35rem 0.75rem; border-radius: 0.5rem; font-size: 0.75rem; cursor: pointer; }
    .filter-btn.active { background: rgba(0, 194, 203, 0.15); border-color: var(--cyan); color: var(--cyan); font-weight: 700; }
    table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; font-size: 0.78rem; overflow: hidden; }
    th { background: #070d18; text-align: left; padding: 0.75rem 1rem; color: var(--muted); border-bottom: 1px solid var(--border); font-weight: 600; }
    td { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(30,41,59,0.5); }
    .badge-warn { background: rgba(245, 158, 11, 0.15); color: var(--warn); padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
    .badge-crit { background: rgba(239, 68, 68, 0.15); color: var(--danger); padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
    .action-btn { background: var(--cyan); color: #04060d; border: none; padding: 0.35rem 0.75rem; border-radius: 0.375rem; font-weight: 700; font-size: 0.75rem; cursor: pointer; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>${s.name || "Detección de Anomalías & Desperdicios Cloud"}</h1>
      <p style="font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem;">Auditoría con validación de tráfico Zero-Impact</p>
    </div>
    <span class="badge-crit">4 Desvíos Críticos</span>
  </div>
  <div class="filters">
    <button class="filter-btn active">Todas (4)</button>
    <button class="filter-btn">Azure Disks (2)</button>
    <button class="filter-btn">AWS EC2 Ociosas (1)</button>
    <button class="filter-btn">Snapshots Antiguos (1)</button>
  </div>
  <table>
    <thead>
      <tr>
        <th>Recurso Cloud</th>
        <th>Proveedor</th>
        <th>Severidad</th>
        <th>Costo Mensual</th>
        <th>Impacto Cero</th>
        <th>Acción Ejecutable</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>vol-stage-orphaned-04</strong><br/><span style="font-size:0.68rem; color:var(--muted)">Azure Managed Disk 512GB</span></td>
        <td>Azure East US</td>
        <td><span class="badge-crit">CRÍTICO</span></td>
        <td style="color: var(--warn); font-weight:700;">$78.50 / mes</td>
        <td style="color:#10b981;">✓ 0 bytes en 45 días</td>
        <td><button class="action-btn" onclick="remediate(this, 'vol-stage-orphaned-04')">Desacoplar 1-Clic</button></td>
      </tr>
      <tr>
        <td><strong>vm-backend-batch-dev</strong><br/><span style="font-size:0.68rem; color:var(--muted)">Standard_D8s_v5 (8 vCPU)</span></td>
        <td>Azure Brazil South</td>
        <td><span class="badge-warn">MODERADO</span></td>
        <td style="color: var(--warn); font-weight:700;">$210.00 / mes</td>
        <td style="color:#10b981;">✓ CPU media &lt; 3%</td>
        <td><button class="action-btn" onclick="remediate(this, 'vm-backend-batch-dev')">Redimensionar 1-Clic</button></td>
      </tr>
      <tr>
        <td><strong>snap-backup-legacy-2025</strong><br/><span style="font-size:0.68rem; color:var(--muted)">EBS Snapshot 1TB</span></td>
        <td>AWS us-east-1</td>
        <td><span class="badge-warn">LEVE</span></td>
        <td style="color: var(--warn); font-weight:700;">$50.00 / mes</td>
        <td style="color:#10b981;">✓ Snapshot huérfano</td>
        <td><button class="action-btn" onclick="remediate(this, 'snap-backup-legacy-2025')">Archivar a Cold</button></td>
      </tr>
    </tbody>
  </table>
  <script>
    function remediate(btn, resId) {
      var orig = btn.innerText;
      btn.innerText = 'Validando Zero-Impact...';
      btn.style.background = '#f59e0b';
      setTimeout(function() {
        btn.innerText = '✓ Remediado con Éxito';
        btn.style.background = '#10b981';
        btn.disabled = true;
      }, 700);
    }
  </script>
</body>
</html>`;
  }

  function getConnectorsWireframeHtml(s: ScreenSpec): string {
    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.name || "Conectores"} - FinPulse AI</title>
  <style>
    :root { --bg: #04060d; --card: #0A192F; --border: #1e293b; --text: #f8fafc; --muted: #94a3b8; --cyan: #00C2CB; --success: #10b981; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 1.5rem; }
    .header { border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .header h1 { font-size: 1.25rem; font-weight: 700; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; }
    .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .badge { background: rgba(16, 185, 129, 0.15); color: var(--success); padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
    .field { margin-bottom: 0.85rem; }
    .field label { display: block; font-size: 0.7rem; color: var(--muted); margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600; }
    .field input { width: 100%; background: #070d18; border: 1px solid var(--border); border-radius: 0.375rem; padding: 0.5rem 0.75rem; color: var(--text); font-size: 0.75rem; font-family: monospace; }
    .btn { background: var(--cyan); color: #04060d; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 700; font-size: 0.75rem; cursor: pointer; width: 100%; margin-top: 0.5rem; transition: background 0.2s; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${s.name || "Gestión de Conectores Cloud IAM"}</h1>
    <p style="font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem;">Credenciales de solo lectura con secretos asegurados en Azure Key Vault</p>
  </div>
  <div class="grid">
    <div class="card">
      <div class="top">
        <strong style="font-size: 0.95rem;">Microsoft Azure</strong>
        <span class="badge">● Rol Conectado (Reader)</span>
      </div>
      <div class="field">
        <label>Azure Subscription ID</label>
        <input type="text" value="9e7c5411-2b08-4e89-b88a-d79860b741aa" readonly />
      </div>
      <div class="field">
        <label>Application Client ID (SPN)</label>
        <input type="text" value="finpulse-reader-app-spn" readonly />
      </div>
      <button class="btn" onclick="syncProvider(this, 'Azure')">Sincronizar Telemetría Ahora</button>
    </div>
    <div class="card">
      <div class="top">
        <strong style="font-size: 0.95rem;">Amazon Web Services (AWS)</strong>
        <span class="badge">● Rol Conectado (CostExplorer)</span>
      </div>
      <div class="field">
        <label>Role ARN de Confianza</label>
        <input type="text" value="arn:aws:iam::123456789012:role/FinPulseReadOnly" readonly />
      </div>
      <div class="field">
        <label>External ID de Seguridad</label>
        <input type="text" value="finpulse-vault-sec-tenant-2026" readonly />
      </div>
      <button class="btn" onclick="syncProvider(this, 'AWS')">Sincronizar Cost Explorer</button>
    </div>
  </div>
  <script>
    function syncProvider(btn, name) {
      var orig = btn.innerText;
      btn.innerText = 'Consultando Azure Key Vault...';
      btn.style.background = '#6366f1';
      btn.disabled = true;
      setTimeout(function() {
        btn.innerText = '✓ ' + name + ' Sincronizado (200 OK)';
        btn.style.background = '#10b981';
        setTimeout(function() {
          btn.innerText = orig;
          btn.disabled = false;
          btn.style.background = '#00C2CB';
        }, 2500);
      }, 750);
    }
  </script>
</body>
</html>`;
  }

  function getSpecializedScreenWireframeHtml(s: ScreenSpec, idx: number): string {
    const comps = (s.components || []).map((c) => `<span style="display:inline-block;background:rgba(255,255,255,0.06);border:1px solid #1e293b;padding:0.25rem 0.6rem;border-radius:0.375rem;font-size:0.75rem;margin:0.2rem;font-family:monospace;color:#cbd5e1;">${c}</span>`).join("");
    const eps = (s.consumedEndpoints || []).map((e) => `<li style="font-family:monospace;font-size:0.75rem;color:#00C2CB;margin-bottom:0.3rem;">${e}</li>`).join("");

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.name || `Pantalla #${idx + 1}`} - FinPulse AI</title>
  <style>
    :root { --bg: #04060d; --card: #0A192F; --border: #1e293b; --text: #f8fafc; --muted: #94a3b8; --cyan: #00C2CB; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 1.5rem; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.25rem; }
    .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; }
    .btn { background: var(--cyan); color: #04060d; border: none; padding: 0.55rem 1rem; border-radius: 0.375rem; font-weight: 700; font-size: 0.75rem; cursor: pointer; width: 100%; margin-top: 1rem; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1 style="font-size:1.25rem; font-weight:700;">${s.name || `Pantalla #${idx + 1}`}</h1>
      <p style="font-size:0.75rem; color:var(--muted); margin-top:0.25rem;">${s.description || "Vista modular de usuario"}</p>
    </div>
    <span style="font-family:monospace;font-size:0.75rem;background:#070d18;padding:0.25rem 0.6rem;border-radius:0.375rem;border:1px solid var(--border);">${s.route || `/view-${idx + 1}`}</span>
  </div>
  <div class="grid">
    <div class="card">
      <h3 style="font-size:0.8rem;text-transform:uppercase;color:var(--cyan);margin-bottom:0.75rem;font-weight:700;">Componentes UI Asignados</h3>
      <div>${comps || '<span style="color:var(--muted);font-size:0.75rem;">Componentes dinámicos de vista</span>'}</div>
    </div>
    <div class="card">
      <h3 style="font-size:0.8rem;text-transform:uppercase;color:var(--cyan);margin-bottom:0.75rem;font-weight:700;">Contratos REST</h3>
      <ul style="padding-left:1.2rem;">${eps || '<li style="color:var(--muted);font-size:0.75rem;">Sin endpoints explícitos</li>'}</ul>
      <button class="btn" onclick="alert('Acción ejecutada en ${s.name}')">Interactuar con Vista</button>
    </div>
  </div>
</body>
</html>`;
  }

  const handleCopyHtml = async (html: string, id: string) => {
    if (!html) return;
    try {
      await navigator.clipboard.writeText(html);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Error al copiar HTML:", err);
    }
  };

  const handleDownloadHtml = (html: string, filename: string) => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${filename}.html`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = (html: string) => {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  const scrollToScreen = (index: number) => {
    const el = document.getElementById(`screen-card-${index}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Panel de Control y Parámetros de Diseño */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                <Layout className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900">
                Fase D: Arquitectura Frontend & Wireframes UX/UI
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isMultiScreen
                ? `Se detectaron ${screens.length} interfaces de usuario completas para el proyecto.`
                : "Especificación de interfaz única autocontenida."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all active:scale-98 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {loading ? "Diseñando Interfaces..." : "Disparar Agente UI"}
            </button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
            Instrucciones para pantallas, componentes y diseño
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="ej. Enfatizar vista de Dashboard FinOps y pantalla de alertas de anomalías con botón de remediación"
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

      {/* 2. Barra de Control de Vistas y Mini-Navegador Rápido (Solo si hay 2 o más pantallas) */}
      {isMultiScreen && (
        <div className="sticky top-2 z-20 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 p-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Selector de Modo: Cascada vs Foco */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setViewMode("cascade")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === "cascade"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cascada Continua ({screens.length} Vistas)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("focus")}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold transition-all ${
                viewMode === "focus"
                  ? "bg-white text-indigo-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />
              <span>Inspector Individual</span>
            </button>
          </div>

          {/* Mini-Navegador de Salto Rápido entre Pantallas */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden md:inline">
              Saltar a:
            </span>
            {screens.map((screen, idx) => {
              const isSelected = viewMode === "focus" && focusedScreenIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    if (viewMode === "cascade") {
                      scrollToScreen(idx);
                    } else {
                      setFocusedScreenIndex(idx);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <span className="font-mono opacity-70">#{idx + 1}</span> {screen.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Renderizado de Interfaces (Modo Cascada Continua vs Modo Foco) */}
      {viewMode === "cascade" || !isMultiScreen ? (
        <div className="space-y-8">
          {screens.map((screen, idx) => {
            const screenHtml = getScreenHtml(screen, idx);
            const activeTab = screenTabs[idx] || "preview";
            const screenSlug = screen.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

            return (
              <section
                key={idx}
                id={`screen-card-${idx}`}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden scroll-mt-20 transition-all hover:border-slate-300"
              >
                {/* Cabecera de la Pantalla */}
                <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/80 via-white to-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Pantalla #{idx + 1}
                      </span>
                      {screen.route && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {screen.route}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{screen.name}</h3>
                    {screen.description && (
                      <p className="text-xs text-slate-600 mt-0.5 max-w-3xl leading-relaxed">
                        {screen.description}
                      </p>
                    )}
                  </div>

                  {/* Acciones de la Pantalla */}
                  <div className="flex items-center flex-wrap gap-1.5 self-start md:self-auto">
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs mr-1">
                      <button
                        type="button"
                        onClick={() => setScreenTabs((prev) => ({ ...prev, [idx]: "preview" }))}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                          activeTab === "preview" ? "bg-white text-indigo-700 font-bold shadow-2xs" : "text-slate-600"
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Vista</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setScreenTabs((prev) => ({ ...prev, [idx]: "code" }))}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-medium transition-colors ${
                          activeTab === "code" ? "bg-white text-indigo-700 font-bold shadow-2xs" : "text-slate-600"
                        }`}
                      >
                        <Code className="w-3 h-3" />
                        <span>HTML</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyHtml(screenHtml, `screen-${idx}`)}
                      title="Copiar HTML de esta pantalla"
                      className="p-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
                    >
                      {copiedId === `screen-${idx}` ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                      )}
                      <span className="hidden sm:inline">
                        {copiedId === `screen-${idx}` ? "¡Copiado!" : "Copiar"}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadHtml(screenHtml, `wireframe-${screenSlug || idx}`)}
                      title="Descargar archivo .html"
                      className="p-1.5 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden sm:inline">.html</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenNewTab(screenHtml)}
                      title="Abrir en pestaña completa"
                      className="p-1.5 px-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Marco de Navegador Mockup Chrome */}
                <div className="p-5 space-y-4">
                  {activeTab === "preview" ? (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#04060d] shadow-lg">
                      {/* Browser Chrome Header */}
                      <div className="px-4 py-2 bg-[#0A192F] border-b border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
                          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                        </div>

                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#04060d] text-slate-400 font-mono text-[11px] border border-slate-800 max-w-sm truncate">
                          <Globe className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span>https://finpulse.ai{screen.route || `/${screenSlug}`}</span>
                        </div>

                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider hidden sm:inline">
                          React 18 • Tailwind
                        </span>
                      </div>

                      {/* Mockup Iframe Autocontenido */}
                      {screenHtml ? (
                        <iframe
                          srcDoc={screenHtml}
                          sandbox="allow-scripts allow-same-origin"
                          className="w-full h-[460px] bg-[#04060d] border-none"
                          title={`Wireframe ${screen.name}`}
                        />
                      ) : (
                        <div className="w-full h-[320px] flex flex-col items-center justify-center gap-2 text-slate-500 bg-[#04060d]">
                          <Monitor className="w-8 h-8 text-slate-700" />
                          <p className="text-xs">No hay mockup HTML disponible para esta vista.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#04060d]">
                      <pre className="p-4 text-xs font-mono text-emerald-400 overflow-auto h-[460px] select-all leading-relaxed">
                        <code>{screenHtml || "<!-- Sin HTML generado -->"}</code>
                      </pre>
                    </div>
                  )}

                  {/* Panel de Metadatos: Endpoints Consumidos y Componentes */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    {/* Endpoints Consumidos (Fase C) */}
                    <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        Endpoints REST Consumidos (Fase C):
                      </span>
                      {screen.consumedEndpoints && screen.consumedEndpoints.length > 0 ? (
                        <div className="space-y-1.5">
                          {screen.consumedEndpoints.map((ep, ei) => {
                            const [method, ...rest] = ep.split(" ");
                            const path = rest.join(" ");
                            return (
                              <div
                                key={ei}
                                className="flex items-center gap-2 text-xs font-mono bg-white p-1.5 px-2 rounded-md border border-slate-200"
                              >
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                    HTTP_METHOD_COLORS[method] || "bg-slate-100 text-slate-800 border-slate-200"
                                  }`}
                                >
                                  {method}
                                </span>
                                <span className="text-slate-800 truncate">{path || ep}</span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No tiene endpoints vinculados explícitamente.</p>
                      )}
                    </div>

                    {/* Componentes Reutilizables */}
                    <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-200/80">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                        Componentes UI Reutilizables:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {screen.components && screen.components.length > 0 ? (
                          screen.components.map((comp, ci) => (
                            <span
                              key={ci}
                              className="px-2 py-1 rounded-md bg-white text-slate-700 text-xs font-mono font-medium border border-slate-200 shadow-2xs"
                            >
                              {comp}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">Sin componentes listados.</span>
                        )}
                      </div>

                      {screen.validations && screen.validations.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                            Reglas de Validación:
                          </span>
                          <ul className="space-y-1">
                            {screen.validations.map((val, vi) => (
                              <li key={vi} className="text-[11px] text-slate-600 flex items-center gap-1.5">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{val}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Modo Focus / Pestañas Individuales */
        <div className="space-y-4">
          {(() => {
            const screen = screens[focusedScreenIndex] || screens[0];
            const screenHtml = getScreenHtml(screen, focusedScreenIndex);
            const activeTab = screenTabs[focusedScreenIndex] || "preview";
            const screenSlug = screen.name.toLowerCase().replace(/[^a-z0-9]/g, "-");

            return (
              <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Pantalla #{focusedScreenIndex + 1} de {screens.length}
                      </span>
                      {screen.route && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {screen.route}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{screen.name}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyHtml(screenHtml, "focus")}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                      {copiedId === "focus" ? "¡Copiado!" : "Copiar HTML"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadHtml(screenHtml, `wireframe-${screenSlug}`)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs"
                    >
                      Descargar .html
                    </button>
                  </div>
                </div>

                <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#04060d]">
                  <iframe
                    srcDoc={screenHtml}
                    sandbox="allow-scripts allow-same-origin"
                    className="w-full h-[500px] bg-[#04060d] border-none"
                    title={`Wireframe ${screen.name}`}
                  />
                </div>
              </section>
            );
          })()}
        </div>
      )}
    </div>
  );
};
