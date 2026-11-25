package com.ideator.backend.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideator.backend.dto.ScreenSpecDto;
import com.ideator.backend.dto.UiMapDto;
import com.ideator.backend.model.PhaseSpecification;
import com.ideator.backend.repository.PhaseSpecificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

/**
 * SCRUM-71 – UiMapService (Fase D: UI/UX)
 *
 * Invoca al agente especializado ideator-ui-agent a través de
 * {@link FoundryAgentOrchestratorService} para estructurar el mapa conceptual de
 * interfaces y generar el wireframe HTML interactivo (wireframeHtml).
 *
 * En modo offline o cuando el agente no esté disponible, provee un fallback HTML
 * limpio y responsivo, persistiendo las especificaciones en PostgreSQL
 * mediante {@link PhaseSpecificationRepository}.
 */
@Service
@Slf4j
public class UiMapService {

    private final FoundryAgentOrchestratorService orchestratorService;
    private final PhaseSpecificationRepository repository;
    private final ObjectMapper objectMapper;

    public UiMapService() {
        this(null, null);
    }

    @Autowired
    public UiMapService(
            @Autowired(required = false) FoundryAgentOrchestratorService orchestratorService,
            @Autowired(required = false) PhaseSpecificationRepository repository) {
        this.orchestratorService = orchestratorService;
        this.repository = repository;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Obtiene el mapa de UI almacenado en PostgreSQL para el proyecto dado.
     * Si no existe, invoca la generación y lo persiste.
     */
    public String getUiMap(Long projectId) {
        if (repository != null) {
            return repository.findByProjectIdAndPhaseType(projectId, "UI")
                    .map(PhaseSpecification::getContent)
                    .orElseGet(() -> generateUiMap(projectId, null));
        }
        return generateUiMap(projectId, null);
    }

    /**
     * Sobrecarga para compatibilidad con llamadas existentes (ej. SCRUM-73 MarkdownGeneratorService).
     */
    public String generateUiMap(Long projectId) {
        return generateUiMap(projectId, null);
    }

    /**
     * Genera el mapa conceptual de UI y el wireframe interactivo consumiendo ideator-ui-agent
     * o aplicando el fallback seguro en modo offline.
     */
    public String generateUiMap(Long projectId, String prompt) {
        String result = null;
        if (orchestratorService != null) {
            try {
                String payload = (prompt != null && !prompt.isBlank())
                        ? prompt
                        : "{\"projectId\": " + projectId + ", \"phase\": \"UI\"}";
                result = orchestratorService.callAgent(AgentPhase.UI, payload);
            } catch (Exception e) {
                log.warn("Fallo o fallback al consultar ideator-ui-agent: {}", e.getMessage());
            }
        }

        UiMapDto dto = parseOrFallback(result);
        String finalJson = serializeDto(dto);
        persistSpec(projectId, finalJson);
        return finalJson;
    }

    /**
     * Parsea la respuesta en formato JSON a {@link UiMapDto}.
     * Si la respuesta es nula, inválida o carece de wireframeHtml, inyecta el fallback limpio.
     */
    public UiMapDto parseOrFallback(String rawJson) {
        if (rawJson != null && !rawJson.isBlank() && rawJson.trim().startsWith("{")) {
            try {
                UiMapDto dto = objectMapper.readValue(rawJson, UiMapDto.class);
                if (dto.getScreens() == null || dto.getScreens().isEmpty()) {
                    dto.setScreens(getDefaultScreens());
                } else {
                    // Especializar cada pantalla con su propio wireframeHtml si la IA no lo generó por separado o si se replicó el mismo HTML
                    for (int i = 0; i < dto.getScreens().size(); i++) {
                        ScreenSpecDto s = dto.getScreens().get(i);
                        boolean isDuplicate = (i > 0) && (
                            (dto.getWireframeHtml() != null && dto.getWireframeHtml().equals(s.getWireframeHtml())) ||
                            (dto.getScreens().get(0).getWireframeHtml() != null && dto.getScreens().get(0).getWireframeHtml().equals(s.getWireframeHtml())) ||
                            (s.getWireframeHtml() != null && s.getWireframeHtml().contains("Dashboard") && s.getName() != null && !s.getName().toLowerCase().contains("dashboard"))
                        );
                        if (s.getWireframeHtml() == null || s.getWireframeHtml().isBlank() || isDuplicate) {
                            if (i == 0) {
                                s.setWireframeHtml((dto.getWireframeHtml() != null && !dto.getWireframeHtml().isBlank())
                                        ? dto.getWireframeHtml()
                                        : getFallbackWireframeHtml());
                            } else if (i == 1 || (s.getRoute() != null && (s.getRoute().contains("anomal") || s.getRoute().contains("user")))) {
                                s.setWireframeHtml(getAnomaliesWireframeHtml());
                            } else if (i == 2 || (s.getRoute() != null && (s.getRoute().contains("connect") || s.getRoute().contains("setting")))) {
                                s.setWireframeHtml(getConnectorsWireframeHtml());
                            } else {
                                s.setWireframeHtml(generateGenericScreenWireframe(s));
                            }
                        }
                    }
                }
                if (dto.getWireframeHtml() == null || dto.getWireframeHtml().isBlank()) {
                    dto.setWireframeHtml(getFallbackWireframeHtml());
                }
                return dto;
            } catch (Exception e) {
                log.warn("No se pudo deserializar UiMapDto desde la respuesta del agente: {}", e.getMessage());
            }
        }
        return getFallbackUiMap();
    }

    /**
     * Serializa {@link UiMapDto} a JSON.
     */
    public String serializeDto(UiMapDto dto) {
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (JsonProcessingException e) {
            log.error("Error al serializar UiMapDto: {}", e.getMessage());
            return "{\"screens\":[],\"wireframeHtml\":\"\"}";
        }
    }

    private void persistSpec(Long projectId, String content) {
        if (repository != null) {
            try {
                PhaseSpecification spec = repository.findByProjectIdAndPhaseType(projectId, "UI")
                        .orElse(new PhaseSpecification(projectId, "UI", content));
                spec.setContent(content);
                spec.setUpdatedAt(Instant.now());
                repository.save(spec);
                log.info("PhaseSpecification (UI) guardada exitosamente en PostgreSQL para proyecto {}", projectId);
            } catch (Exception e) {
                log.warn("No se pudo persistir PhaseSpecification (UI) para proyecto {}: {}", projectId, e.getMessage());
            }
        }
    }

    public UiMapDto getFallbackUiMap() {
        return UiMapDto.builder()
                .screens(getDefaultScreens())
                .wireframeHtml(getFallbackWireframeHtml())
                .build();
    }

    public List<ScreenSpecDto> getDefaultScreens() {
        return List.of(
                ScreenSpecDto.builder()
                        .name("Dashboard Principal & KPIs")
                        .route("/dashboard")
                        .description("Panel central con métricas clave de salud, alertas activas y resumen de consumo en tiempo real.")
                        .components(List.of("Navbar", "ProjectStatsWidget", "QuickActionPanel", "RecentActivityFeed"))
                        .consumedEndpoints(List.of("GET /api/v1/projects/{id}/summary", "GET /api/v1/metrics/latest"))
                        .validations(List.of("Filtro de fecha obligatorio", "Límite de registros entre 5 y 50"))
                        .wireframeHtml(getFallbackWireframeHtml())
                        .mockupUrl(null)
                        .build(),
                ScreenSpecDto.builder()
                        .name("Detección de Anomalías & Acciones 1-Clic")
                        .route("/anomalies")
                        .description("Listado de desvíos de presupuesto y recursos ociosos con recomendación ejecutiva de remediación.")
                        .components(List.of("AnomalyTable", "ImpactSimulationModal", "RemediateButton", "ThresholdFilter"))
                        .consumedEndpoints(List.of("GET /api/v1/anomalies", "POST /api/v1/remediate"))
                        .validations(List.of("Confirmación obligatoria antes de apagar recursos", "Justificación de remediación"))
                        .wireframeHtml(getAnomaliesWireframeHtml())
                        .mockupUrl(null)
                        .build(),
                ScreenSpecDto.builder()
                        .name("Conectores Cloud IAM & Políticas Zero-Impact")
                        .route("/settings/cloud")
                        .description("Gestión de credenciales IAM de solo lectura hacia Azure y AWS con validación de permisos.")
                        .components(List.of("CloudAccountCard", "IamRoleForm", "ConnectivityBadge", "ValidationLogDrawer"))
                        .consumedEndpoints(List.of("GET /api/v1/connectors", "POST /api/v1/connectors/test"))
                        .validations(List.of("ARN o Azure Subscription ID válido", "Permiso de solo lectura verificado"))
                        .wireframeHtml(getConnectorsWireframeHtml())
                        .mockupUrl(null)
                        .build()
        );
    }

    private String getAnomaliesWireframeHtml() {
        return """
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Detección de Anomalías - FinPulse AI</title>
          <style>
            :root {
              --bg: #04060d;
              --card: #0A192F;
              --border: #1e293b;
              --text: #f8fafc;
              --muted: #94a3b8;
              --accent: #00C2CB;
              --warning: #f59e0b;
              --danger: #ef4444;
              --success: #10b981;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 1.5rem; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .header h1 { font-size: 1.25rem; font-weight: 700; color: var(--text); }
            .badge { background: rgba(0, 194, 203, 0.15); color: var(--accent); padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; border: 1px solid rgba(0,194,203,0.3); }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
            .card { background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1rem; }
            .card h3 { font-size: 0.75rem; text-transform: uppercase; color: var(--muted); margin-bottom: 0.5rem; }
            .card .val { font-size: 1.5rem; font-weight: 800; color: var(--text); }
            .card .sub { font-size: 0.7rem; color: var(--warning); margin-top: 0.25rem; }
            table { width: 100%; border-collapse: collapse; background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; overflow: hidden; font-size: 0.8rem; }
            th { background: #070d18; text-align: left; padding: 0.75rem 1rem; color: var(--muted); border-bottom: 1px solid var(--border); font-weight: 600; }
            td { padding: 0.75rem 1rem; border-bottom: 1px solid rgba(30,41,59,0.5); }
            .action-btn { background: var(--accent); color: #04060d; border: none; padding: 0.35rem 0.75rem; border-radius: 0.375rem; font-weight: 700; font-size: 0.75rem; cursor: pointer; }
            .action-btn:hover { opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Auditoría de Anomalías de Costos</h1>
              <p style="font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem;">Reglas de impacto cero y detección proactiva en Azure & AWS</p>
            </div>
            <span class="badge">4 Anomalías Detectadas</span>
          </div>
          <div class="grid">
            <div class="card">
              <h3>Ahorro Potencial Mensual</h3>
              <div class="val" style="color: var(--accent);">$485.00</div>
              <div class="sub">12% del presupuesto actual</div>
            </div>
            <div class="card">
              <h3>Discos Huérfanos</h3>
              <div class="val">8 Unidades</div>
              <div class="sub" style="color: var(--danger);">Inactivos > 45 días</div>
            </div>
            <div class="card">
              <h3>Simulación Impacto Cero</h3>
              <div class="val" style="color: var(--success);">100% Validado</div>
              <div class="sub" style="color: var(--muted);">Sin tráfico en últimos 30 días</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Recurso Cloud</th>
                <th>Tipo</th>
                <th>Región</th>
                <th>Costo Inútil</th>
                <th>Acción Recomendada</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>vol-dev-stage-04</strong></td>
                <td>Azure Managed Disk</td>
                <td>East US</td>
                <td style="color: var(--warning);">$72.00 / mes</td>
                <td><button class="action-btn">Desacoplar 1-Clic</button></td>
              </tr>
              <tr>
                <td><strong>vm-worker-batch-test</strong></td>
                <td>Standard_D4s_v5</td>
                <td>Brazil South</td>
                <td style="color: var(--warning);">$145.00 / mes</td>
                <td><button class="action-btn">Redimensionar 1-Clic</button></td>
              </tr>
            </tbody>
          </table>
        </body>
        </html>
        """.trim();
    }

    private String getConnectorsWireframeHtml() {
        return """
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Conectores Cloud IAM - FinPulse AI</title>
          <style>
            :root {
              --bg: #04060d;
              --card: #0A192F;
              --border: #1e293b;
              --text: #f8fafc;
              --muted: #94a3b8;
              --accent: #00C2CB;
              --success: #10b981;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 1.5rem; }
            .header { border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .header h1 { font-size: 1.25rem; font-weight: 700; }
            .header p { font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem; }
            .connectors-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
            .connector-card { background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; }
            .connector-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
            .provider-title { font-weight: 700; font-size: 0.95rem; }
            .status-badge { background: rgba(16, 185, 129, 0.15); color: var(--success); padding: 0.2rem 0.5rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 700; }
            .field { margin-bottom: 0.75rem; }
            .field label { display: block; font-size: 0.7rem; color: var(--muted); margin-bottom: 0.25rem; text-transform: uppercase; font-weight: 600; }
            .field input { width: 100%; background: #070d18; border: 1px solid var(--border); border-radius: 0.375rem; padding: 0.5rem 0.75rem; color: var(--text); font-size: 0.75rem; font-family: monospace; }
            .btn { background: var(--accent); color: #04060d; border: none; padding: 0.5rem 1rem; border-radius: 0.375rem; font-weight: 700; font-size: 0.75rem; cursor: pointer; margin-top: 0.5rem; width: 100%; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Conexiones Multi-Cloud Seguras</h1>
            <p>Roles IAM con política de solo lectura auditada y gestión de secretos en Azure Key Vault</p>
          </div>
          <div class="connectors-grid">
            <div class="connector-card">
              <div class="connector-top">
                <span class="provider-title">Microsoft Azure Tenant</span>
                <span class="status-badge">● Conectado (Solo Lectura)</span>
              </div>
              <div class="field">
                <label>Subscription ID</label>
                <input type="text" value="9e7c5411-2b08-4e89-b88a-d79860b741aa" readonly />
              </div>
              <div class="field">
                <label>Rol Asignado</label>
                <input type="text" value="Cost Management Reader (RBAC)" readonly />
              </div>
              <button class="btn">Sincronizar Telemetría Ahora</button>
            </div>
            <div class="connector-card">
              <div class="connector-top">
                <span class="provider-title">Amazon Web Services (AWS)</span>
                <span class="status-badge">● Conectado (Solo Lectura)</span>
              </div>
              <div class="field">
                <label>Role ARN</label>
                <input type="text" value="arn:aws:iam::123456789012:role/FinPulseReadOnly" readonly />
              </div>
              <div class="field">
                <label>External ID</label>
                <input type="text" value="finpulse-tenant-vault-sec-2026" readonly />
              </div>
              <button class="btn">Sincronizar Cost Explorer</button>
            </div>
          </div>
        </body>
        </html>
        """.trim();
    }

    /**
     * Retorna un HTML wireframe interactivo limpio, autónomo y responsivo
     * para renderizarse dentro del iframe de la Fase D en modo offline.
     */
    public String getFallbackWireframeHtml() {
        return """
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Mockup Visual Interactivo - Ideator MVP</title>
          <style>
            :root {
              --bg: #04060d;
              --sidebar: #090d1a;
              --card: #0e1322;
              --accent: #6366f1;
              --accent-hover: #4f46e5;
              --text: #f8fafc;
              --muted: #94a3b8;
              --border: #1e293b;
              --badge-bg: rgba(99, 102, 241, 0.15);
              --success: #10b981;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background-color: var(--bg);
              color: var(--text);
              display: flex;
              height: 100vh;
              overflow: hidden;
            }
            .sidebar {
              width: 220px;
              background: var(--sidebar);
              border-right: 1px solid var(--border);
              display: flex;
              flex-direction: column;
              flex-shrink: 0;
            }
            .brand {
              padding: 1.15rem 1rem;
              font-size: 0.95rem;
              font-weight: 700;
              color: var(--accent);
              display: flex;
              align-items: center;
              gap: 0.5rem;
              border-bottom: 1px solid var(--border);
            }
            .brand .pill {
              font-size: 0.65rem;
              padding: 0.15rem 0.4rem;
              border-radius: 9999px;
              background: var(--badge-bg);
              color: #a5b4fc;
              border: 1px solid rgba(99, 102, 241, 0.3);
            }
            .nav-list {
              padding: 0.75rem 0.5rem;
              display: flex;
              flex-direction: column;
              gap: 0.25rem;
              flex: 1;
            }
            .nav-btn {
              display: flex;
              align-items: center;
              gap: 0.6rem;
              padding: 0.55rem 0.75rem;
              border-radius: 0.5rem;
              font-size: 0.8rem;
              color: var(--muted);
              cursor: pointer;
              transition: all 0.15s ease;
              border: none;
              background: transparent;
              width: 100%;
              text-align: left;
            }
            .nav-btn:hover, .nav-btn.active {
              background: rgba(99, 102, 241, 0.12);
              color: var(--text);
            }
            .nav-btn.active {
              border-left: 3px solid var(--accent);
            }
            .workspace {
              flex: 1;
              display: flex;
              flex-direction: column;
              overflow-y: auto;
            }
            .header-bar {
              height: 52px;
              background: var(--card);
              border-bottom: 1px solid var(--border);
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0 1.5rem;
              flex-shrink: 0;
            }
            .header-bar h2 {
              font-size: 0.9rem;
              font-weight: 600;
            }
            .status-tag {
              font-size: 0.7rem;
              padding: 0.2rem 0.55rem;
              border-radius: 9999px;
              background: rgba(16, 185, 129, 0.12);
              color: var(--success);
              border: 1px solid rgba(16, 185, 129, 0.25);
              display: flex;
              align-items: center;
              gap: 0.35rem;
            }
            .main-body {
              padding: 1.25rem 1.5rem;
              display: flex;
              flex-direction: column;
              gap: 1.25rem;
            }
            .metrics-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
              gap: 1rem;
            }
            .metric-card {
              background: var(--card);
              border: 1px solid var(--border);
              border-radius: 0.75rem;
              padding: 1rem;
            }
            .metric-card span.label {
              font-size: 0.7rem;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              color: var(--muted);
              display: block;
              margin-bottom: 0.35rem;
            }
            .metric-card span.value {
              font-size: 1.35rem;
              font-weight: 700;
              color: var(--text);
            }
            .views-grid {
              display: grid;
              grid-template-columns: 2fr 1fr;
              gap: 1rem;
            }
            .card-panel {
              background: var(--card);
              border: 1px solid var(--border);
              border-radius: 0.75rem;
              padding: 1.25rem;
            }
            .card-panel h3 {
              font-size: 0.85rem;
              font-weight: 600;
              margin-bottom: 0.75rem;
            }
            .flow-item {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 0.55rem 0;
              border-bottom: 1px solid rgba(255, 255, 255, 0.05);
              font-size: 0.8rem;
            }
            .flow-item:last-child {
              border-bottom: none;
            }
            .flow-components {
              color: #a5b4fc;
              font-family: monospace;
              font-size: 0.75rem;
            }
            .cta-button {
              background: var(--accent);
              color: #fff;
              border: none;
              padding: 0.45rem 0.9rem;
              border-radius: 0.5rem;
              font-size: 0.75rem;
              font-weight: 600;
              cursor: pointer;
              transition: background 0.15s;
              width: 100%;
              margin-top: 0.75rem;
            }
            .cta-button:hover {
              background: var(--accent-hover);
            }
          </style>
        </head>
        <body>
          <div class="sidebar">
            <div class="brand">
              ⚡ Ideator UI <span class="pill">Fase D</span>
            </div>
            <div class="nav-list">
              <button class="nav-btn active" onclick="activateNav(this, 'Dashboard General')">📊 Dashboard</button>
              <button class="nav-btn" onclick="activateNav(this, 'Workspace Multi-Agente')">🤖 Agentes IA</button>
              <button class="nav-btn" onclick="activateNav(this, 'Modelo Relacional BD')">🗄️ Esquema DB</button>
              <button class="nav-btn" onclick="activateNav(this, 'Especificación REST API')">🔌 Endpoints API</button>
              <button class="nav-btn" onclick="activateNav(this, 'Matriz Ciberseguridad')">🛡️ Seguridad</button>
            </div>
          </div>
          <div class="workspace">
            <div class="header-bar">
              <h2 id="current-screen-title">Dashboard General</h2>
              <div class="status-tag">● Mockup Interactivo Activo</div>
            </div>
            <div class="main-body">
              <div class="metrics-grid">
                <div class="metric-card">
                  <span class="label">Fase Actual</span>
                  <span class="value">D: UI / UX</span>
                </div>
                <div class="metric-card">
                  <span class="label">Vistas Definidas</span>
                  <span class="value">4 Pantallas</span>
                </div>
                <div class="metric-card">
                  <span class="label">Agente Creador</span>
                  <span class="value">ideator-ui-agent</span>
                </div>
              </div>
              <div class="views-grid">
                <div class="card-panel">
                  <h3>Mapa de Componentes por Pantalla</h3>
                  <div class="flow-item">
                    <span>1. Dashboard Principal</span>
                    <span class="flow-components">Navbar, ProjectStats, QuickAction</span>
                  </div>
                  <div class="flow-item">
                    <span>2. Workspace Multi-Agente</span>
                    <span class="flow-components">PhaseStepper, ChatWorkspace, ArtifactTabs</span>
                  </div>
                  <div class="flow-item">
                    <span>3. Visor de Arquitectura</span>
                    <span class="flow-components">MermaidViewer, OwaspMatrix, FinopsCalc</span>
                  </div>
                  <div class="flow-item">
                    <span>4. Gestor de Base de Datos</span>
                    <span class="flow-components">TableSchemaList, ColumnAttrTable, SqlModal</span>
                  </div>
                </div>
                <div class="card-panel">
                  <h3>Acciones Interactivas</h3>
                  <p style="font-size: 0.75rem; color: var(--muted); line-height: 1.4;">
                    Este wireframe interactivo simula la disposición visual propuesta para el frontend de la plataforma.
                  </p>
                  <button class="cta-button" onclick="testInteraction()">Probar Interacción</button>
                </div>
              </div>
            </div>
          </div>
          <script>
            function activateNav(btn, title) {
              document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
              btn.classList.add('active');
              document.getElementById('current-screen-title').innerText = title;
            }
            function testInteraction() {
              alert('Interacción exitosa en el wireframe interactivo de ideator-ui-agent.');
            }
          </script>
        </body>
        </html>
        """.trim();
    }

    private String generateGenericScreenWireframe(ScreenSpecDto s) {
        String screenName = (s != null && s.getName() != null) ? s.getName() : "Vista Especializada";
        String route = (s != null && s.getRoute() != null) ? s.getRoute() : "/view";
        String description = (s != null && s.getDescription() != null)
                ? s.getDescription()
                : "Interfaz de usuario especializada diseñada por ideator-ui-agent.";

        StringBuilder compsHtml = new StringBuilder();
        if (s != null && s.getComponents() != null) {
            for (String comp : s.getComponents()) {
                compsHtml.append("<span class=\"comp-pill\">").append(comp).append("</span>");
            }
        }

        return String.format("""
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>%s - FinPulse AI</title>
          <style>
            :root {
              --bg: #04060d;
              --card: #0A192F;
              --border: #1e293b;
              --text: #f8fafc;
              --muted: #94a3b8;
              --accent: #6366f1;
              --accent-cyan: #00C2CB;
            }
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg); color: var(--text); padding: 1.5rem; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .header h1 { font-size: 1.25rem; font-weight: 700; color: var(--text); }
            .route-tag { background: rgba(99, 102, 241, 0.15); color: #a5b4fc; padding: 0.25rem 0.6rem; border-radius: 9999px; font-size: 0.75rem; font-family: monospace; border: 1px solid rgba(99,102,241,0.3); }
            .desc { font-size: 0.8rem; color: var(--muted); margin-bottom: 1.5rem; line-height: 1.5; }
            .grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
            .card { background: var(--card); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.25rem; }
            .card h3 { font-size: 0.8rem; text-transform: uppercase; color: var(--accent-cyan); margin-bottom: 0.75rem; font-weight: 700; }
            .comp-pill { display: inline-block; background: rgba(255,255,255,0.06); border: 1px solid var(--border); padding: 0.25rem 0.6rem; border-radius: 0.375rem; font-size: 0.75rem; margin: 0.2rem; font-family: monospace; color: #cbd5e1; }
            .action-btn { background: var(--accent-cyan); color: #04060d; border: none; padding: 0.6rem 1.2rem; border-radius: 0.5rem; font-weight: 700; font-size: 0.8rem; cursor: pointer; width: 100%%; margin-top: 1rem; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>%s</h1>
            <span class="route-tag">%s</span>
          </div>
          <p class="desc">%s</p>
          <div class="grid">
            <div class="card">
              <h3>Estructura Visual y Componentes</h3>
              <div>%s</div>
            </div>
            <div class="card">
              <h3>Estado de la Vista</h3>
              <p style="font-size: 0.75rem; color: var(--muted); line-height: 1.4;">
                Vista generada y mapeada con los contratos REST de la solución.
              </p>
              <button class="action-btn" onclick="alert('Acción simulada en %s')">Ejecutar Acción Principal</button>
            </div>
          </div>
        </body>
        </html>
        """.trim(), screenName, screenName, route, description, compsHtml.toString(), screenName);
    }
}
