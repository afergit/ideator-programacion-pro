// SCRUM-69: Servicio que consume ideator-db-agent en Microsoft Foundry para generar el modelo relacional físico y diagrama ERD SVG.
package com.ideator.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ideator.backend.dto.ColumnSpecDto;
import com.ideator.backend.dto.DbSpecDto;
import com.ideator.backend.dto.TableSpecDto;
import com.ideator.backend.model.PhaseSpecification;
import com.ideator.backend.repository.PhaseSpecificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * SCRUM-69 – DatabaseSpecService (Fase B: Base de Datos Relacional)
 *
 * Invoca al agente especializado ideator-db-agent (fase DB) a través de
 * {@link FoundryAgentOrchestratorService} para transformar las decisiones de la
 * fase A en una propuesta de modelo relacional físico (tablas, columnas, tipos, PK/FK)
 * y genera el diagrama entidad-relación en formato SVG (erdSvg).
 *
 * En modo offline, provee un fallback SVG limpio y responsivo con el modelo relacional
 * canónico de Ideator persistido en PostgreSQL.
 */
@Service
@Slf4j
public class DatabaseSpecService {

    private final FoundryAgentOrchestratorService orchestratorService;
    private final PhaseSpecificationRepository repository;
    private final ObjectMapper objectMapper;

    public DatabaseSpecService() {
        this(null, null);
    }

    @Autowired
    public DatabaseSpecService(
            @Autowired(required = false) FoundryAgentOrchestratorService orchestratorService,
            @Autowired(required = false) PhaseSpecificationRepository repository) {
        this.orchestratorService = orchestratorService;
        this.repository = repository;
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Genera la especificación física de la base de datos a partir del análisis
     * interno recibido de la fase A invocando al agente ideator-db-agent.
     * Incluye enriquecimiento automático con diagrama ERD SVG.
     *
     * @param analysisInternal el texto de análisis interno de la fase A
     * @return JSON con tables y erdSvg
     */
    public String generatePhysicalModel(String analysisInternal) {
        String result = null;
        if (orchestratorService != null) {
            try {
                String payload = (analysisInternal != null && !analysisInternal.isBlank())
                        ? analysisInternal
                        : "Generar modelo relacional de base de datos para la aplicación";
                result = orchestratorService.callAgent(AgentPhase.DB, payload);
            } catch (Exception e) {
                log.warn("Fallo o fallback al consultar ideator-db-agent: {}", e.getMessage());
            }
        }

        if (result != null && !result.isBlank() && result.trim().startsWith("{")) {
            return enrichWithErdSvg(result);
        }

        return buildDefaultDbSpec();
    }

    /**
     * Enriquece la respuesta JSON del agente inyectando el diagrama ERD en SVG si está ausente.
     */
    public String enrichWithErdSvg(String rawJson) {
        try {
            JsonNode root = objectMapper.readTree(rawJson);
            if (root.isObject()) {
                ObjectNode obj = (ObjectNode) root;
                if (!obj.has("erdSvg") || obj.get("erdSvg").asText().isBlank()) {
                    obj.put("erdSvg", getFallbackErdSvg());
                }
                if (!obj.has("mermaidDiagram") || obj.get("mermaidDiagram").asText().isBlank()) {
                    obj.put("mermaidDiagram", generateMermaidDiagram(getDefaultTables()));
                }
                return objectMapper.writeValueAsString(obj);
            }
        } catch (Exception e) {
            log.warn("Error parseando respuesta JSON de base de datos: {}", e.getMessage());
        }
        return buildDefaultDbSpec();
    }

    /**
     * Retorna la especificación física por defecto con tablas normalizadas y diagrama ERD SVG / Mermaid.
     */
    public String buildDefaultDbSpec() {
        List<TableSpecDto> tables = getDefaultTables();
        DbSpecDto dto = DbSpecDto.builder()
                .tables(tables)
                .erdSvg(getFallbackErdSvg())
                .mermaidDiagram(generateMermaidDiagram(tables))
                .build();
        try {
            return objectMapper.writeValueAsString(dto);
        } catch (Exception e) {
            return "{\"tables\":[],\"erdSvg\":\"" + getFallbackErdSvg().replace("\"", "\\\"").replace("\n", "") + "\"}";
        }
    }

    /**
     * Genera dinámicamente la sintaxis de Mermaid erDiagram a partir de la lista de tablas.
     */
    public String generateMermaidDiagram(List<TableSpecDto> tables) {
        if (tables == null || tables.isEmpty()) {
            return "erDiagram\n    EMPTY_SCHEMA {\n        string status \"Sin tablas\"\n    }";
        }
        StringBuilder sb = new StringBuilder("erDiagram\n");
        Set<String> tableNames = new HashSet<>();
        for (TableSpecDto t : tables) {
            if (t.getName() != null) {
                tableNames.add(t.getName().trim().toLowerCase());
            }
        }

        // Relaciones 1:N detectadas
        for (TableSpecDto t : tables) {
            String child = t.getName().trim().toLowerCase().replaceAll("[^a-zA-Z0-9_]", "_");
            if (t.getColumns() != null) {
                for (ColumnSpecDto c : t.getColumns()) {
                    String target = null;
                    if (c.getForeignKey() != null && !c.getForeignKey().isBlank()) {
                        String clean = c.getForeignKey().split("[(.]")[0].trim().toLowerCase();
                        if (tableNames.contains(clean)) {
                            target = clean;
                        }
                    } else if (c.getName() != null && c.getName().endsWith("_id") && !c.getName().equals("id")) {
                        String plural = c.getName().replaceFirst("_id$", "s").toLowerCase();
                        if (tableNames.contains(plural)) {
                            target = plural;
                        }
                    }
                    if (target != null && !target.equals(child)) {
                        sb.append(String.format("    %s ||--o{ %s : %s\n",
                                target.replaceAll("[^a-zA-Z0-9_]", "_"),
                                child,
                                c.getName().replaceAll("[^a-zA-Z0-9_]", "_")));
                    }
                }
            }
        }
        sb.append("\n");

        // Entidades, columnas y claves PK / FK
        for (TableSpecDto t : tables) {
            String tableName = t.getName().trim().replaceAll("[^a-zA-Z0-9_]", "_");
            sb.append("    ").append(tableName).append(" {\n");
            if (t.getColumns() != null) {
                for (ColumnSpecDto c : t.getColumns()) {
                    String type = c.getType() != null ? c.getType().trim().split("[\\s(]")[0].toLowerCase() : "string";
                    String name = c.getName() != null ? c.getName().trim().replaceAll("[^a-zA-Z0-9_]", "_") : "col";
                    String tag = Boolean.TRUE.equals(c.getPrimaryKey()) ? " PK" : (c.getForeignKey() != null ? " FK" : "");
                    sb.append(String.format("        %s %s%s\n", type, name, tag));
                }
            }
            sb.append("    }\n");
        }
        return sb.toString();
    }

    public List<TableSpecDto> getDefaultTables() {
        return List.of(
                TableSpecDto.builder()
                        .name("users")
                        .columns(List.of(
                                ColumnSpecDto.builder().name("id").type("BIGINT GENERATED ALWAYS AS IDENTITY").primaryKey(true).nullable(false).build(),
                                ColumnSpecDto.builder().name("email").type("VARCHAR(255)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("password_hash").type("VARCHAR(255)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("role").type("VARCHAR(32)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("created_at").type("TIMESTAMPTZ").primaryKey(false).nullable(false).build()
                        ))
                        .build(),
                TableSpecDto.builder()
                        .name("projects")
                        .columns(List.of(
                                ColumnSpecDto.builder().name("id").type("BIGINT GENERATED ALWAYS AS IDENTITY").primaryKey(true).nullable(false).build(),
                                ColumnSpecDto.builder().name("name").type("VARCHAR(255)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("owner_id").type("BIGINT").foreignKey("users(id)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("status").type("VARCHAR(32)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("updated_at").type("TIMESTAMPTZ").primaryKey(false).nullable(false).build()
                        ))
                        .build(),
                TableSpecDto.builder()
                        .name("phase_specifications")
                        .columns(List.of(
                                ColumnSpecDto.builder().name("id").type("UUID").primaryKey(true).nullable(false).build(),
                                ColumnSpecDto.builder().name("project_id").type("BIGINT").foreignKey("projects(id)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("phase_type").type("VARCHAR(32)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("content").type("TEXT").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("updated_at").type("TIMESTAMPTZ").primaryKey(false).nullable(false).build()
                        ))
                        .build(),
                TableSpecDto.builder()
                        .name("chat_messages")
                        .columns(List.of(
                                ColumnSpecDto.builder().name("id").type("BIGINT GENERATED ALWAYS AS IDENTITY").primaryKey(true).nullable(false).build(),
                                ColumnSpecDto.builder().name("project_id").type("BIGINT").foreignKey("projects(id)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("sender").type("VARCHAR(16)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("content").type("TEXT").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("created_at").type("TIMESTAMPTZ").primaryKey(false).nullable(false).build()
                        ))
                        .build(),
                TableSpecDto.builder()
                        .name("endpoint_specs")
                        .columns(List.of(
                                ColumnSpecDto.builder().name("id").type("BIGINT GENERATED ALWAYS AS IDENTITY").primaryKey(true).nullable(false).build(),
                                ColumnSpecDto.builder().name("project_id").type("BIGINT").foreignKey("projects(id)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("http_method").type("VARCHAR(16)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("path").type("VARCHAR(255)").primaryKey(false).nullable(false).build(),
                                ColumnSpecDto.builder().name("status_codes").type("VARCHAR(64)").primaryKey(false).nullable(false).build()
                        ))
                        .build()
        );
    }

    /**
     * Retorna un diagrama ERD en SVG limpio, responsivo y adaptado al tema oscuro (#04060d)
     * con relaciones foráneas, badges PK/FK y tipos de datos de PostgreSQL.
     */
    public String getFallbackErdSvg() {
        return """
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 520" width="100%" height="100%" style="background-color: #04060d; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;">
          <defs>
            <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#4f46e5" />
              <stop offset="100%" stop-color="#6366f1" />
            </linearGradient>
            <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#0284c7" />
              <stop offset="100%" stop-color="#38bdf8" />
            </linearGradient>
            <filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000000" flood-opacity="0.6"/>
            </filter>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#818cf8"/>
            </marker>
          </defs>

          <!-- Grid Background Effect -->
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#1e293b" stroke-width="0.5" stroke-opacity="0.4"/>
          </pattern>
          <rect width="960" height="520" fill="url(#grid)" />

          <!-- RELATIONS / CONNECTORS -->
          <!-- users.id -> projects.owner_id -->
          <path d="M 270 120 C 310 120, 310 120, 350 120" fill="none" stroke="#818cf8" stroke-width="2" marker-end="url(#arrow)" stroke-dasharray="4,2"/>
          <text x="315" y="110" fill="#a5b4fc" font-size="10" font-weight="bold">1 : N</text>

          <!-- projects.id -> phase_specifications.project_id -->
          <path d="M 600 120 C 640 120, 640 120, 680 120" fill="none" stroke="#818cf8" stroke-width="2" marker-end="url(#arrow)" stroke-dasharray="4,2"/>
          <text x="640" y="110" fill="#a5b4fc" font-size="10" font-weight="bold">1 : N</text>

          <!-- projects.id -> chat_messages.project_id -->
          <path d="M 475 240 C 475 270, 320 270, 320 300" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="370" y="275" fill="#7dd3fc" font-size="10" font-weight="bold">1 : N</text>

          <!-- projects.id -> endpoint_specs.project_id -->
          <path d="M 500 240 C 500 270, 640 270, 640 300" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow)"/>
          <text x="560" y="275" fill="#7dd3fc" font-size="10" font-weight="bold">1 : N</text>

          <!-- TABLE 1: users -->
          <g filter="url(#shadow)">
            <rect x="40" y="40" width="230" height="195" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
            <rect x="40" y="40" width="230" height="32" rx="8" fill="url(#headerGrad)"/>
            <text x="52" y="61" fill="#ffffff" font-size="12" font-weight="bold">🗄️ users</text>
            <rect x="220" y="47" width="40" height="18" rx="4" fill="rgba(0,0,0,0.25)"/>
            <text x="226" y="60" fill="#e0e7ff" font-size="9" font-weight="bold">BASE</text>

            <g font-size="11" fill="#f8fafc" transform="translate(52, 92)">
              <text y="0"><tspan fill="#f59e0b" font-weight="bold">PK</tspan>  id : <tspan fill="#94a3b8">BIGINT</tspan></text>
              <text y="24">email : <tspan fill="#94a3b8">VARCHAR(255)</tspan></text>
              <text y="48">password_hash : <tspan fill="#94a3b8">VARCHAR(255)</tspan></text>
              <text y="72">role : <tspan fill="#94a3b8">VARCHAR(32)</tspan></text>
              <text y="96">created_at : <tspan fill="#94a3b8">TIMESTAMPTZ</tspan></text>
            </g>
          </g>

          <!-- TABLE 2: projects -->
          <g filter="url(#shadow)">
            <rect x="350" y="40" width="250" height="195" rx="8" fill="#0f172a" stroke="#6366f1" stroke-width="2"/>
            <rect x="350" y="40" width="250" height="32" rx="8" fill="url(#headerGrad)"/>
            <text x="362" y="61" fill="#ffffff" font-size="12" font-weight="bold">⭐ projects (Core)</text>
            <rect x="545" y="47" width="45" height="18" rx="4" fill="rgba(0,0,0,0.25)"/>
            <text x="551" y="60" fill="#e0e7ff" font-size="9" font-weight="bold">CENTRAL</text>

            <g font-size="11" fill="#f8fafc" transform="translate(362, 92)">
              <text y="0"><tspan fill="#f59e0b" font-weight="bold">PK</tspan>  id : <tspan fill="#94a3b8">BIGINT</tspan></text>
              <text y="24">name : <tspan fill="#94a3b8">VARCHAR(255)</tspan></text>
              <text y="48"><tspan fill="#c084fc" font-weight="bold">FK</tspan>  owner_id : <tspan fill="#94a3b8">BIGINT</tspan></text>
              <text y="72">status : <tspan fill="#94a3b8">VARCHAR(32)</tspan></text>
              <text y="96">updated_at : <tspan fill="#94a3b8">TIMESTAMPTZ</tspan></text>
            </g>
          </g>

          <!-- TABLE 3: phase_specifications -->
          <g filter="url(#shadow)">
            <rect x="680" y="40" width="240" height="195" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
            <rect x="680" y="40" width="240" height="32" rx="8" fill="url(#headerGrad)"/>
            <text x="692" y="61" fill="#ffffff" font-size="12" font-weight="bold">📄 phase_specifications</text>

            <g font-size="11" fill="#f8fafc" transform="translate(692, 92)">
              <text y="0"><tspan fill="#f59e0b" font-weight="bold">PK</tspan>  id : <tspan fill="#94a3b8">UUID</tspan></text>
              <text y="24"><tspan fill="#c084fc" font-weight="bold">FK</tspan>  project_id : <tspan fill="#94a3b8">BIGINT</tspan></text>
              <text y="48">phase_type : <tspan fill="#94a3b8">VARCHAR(32)</tspan></text>
              <text y="72">content : <tspan fill="#94a3b8">TEXT (JSON)</tspan></text>
              <text y="96">updated_at : <tspan fill="#94a3b8">TIMESTAMPTZ</tspan></text>
            </g>
          </g>

          <!-- TABLE 4: chat_messages -->
          <g filter="url(#shadow)">
            <rect x="190" y="300" width="250" height="185" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
            <rect x="190" y="300" width="250" height="32" rx="8" fill="url(#accentGrad)"/>
            <text x="202" y="321" fill="#ffffff" font-size="12" font-weight="bold">💬 chat_messages (Fase A)</text>

            <g font-size="11" fill="#f8fafc" transform="translate(202, 350)">
              <text y="0"><tspan fill="#f59e0b" font-weight="bold">PK</tspan>  id : <tspan fill="#94a3b8">BIGINT</tspan></text>
              <text y="24"><tspan fill="#c084fc" font-weight="bold">FK</tspan>  project_id : <tspan fill="#94a3b8">BIGINT</tspan></text>
              <text y="48">sender : <tspan fill="#94a3b8">VARCHAR(16)</tspan></text>
              <text y="72">content : <tspan fill="#94a3b8">TEXT</tspan></text>
              <text y="96">created_at : <tspan fill="#94a3b8">TIMESTAMPTZ</tspan></text>
            </g>
          </g>

          <!-- TABLE 5: endpoint_specs -->
          <g filter="url(#shadow)">
            <rect x="520" y="300" width="250" height="185" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1.5"/>
            <rect x="520" y="300" width="250" height="32" rx="8" fill="url(#accentGrad)"/>
            <text x="532" y="321" fill="#ffffff" font-size="12" font-weight="bold">🔌 endpoint_specs (Fase C)</text>

            <g font-size="11" fill="#f8fafc" transform="translate(532, 350)">
              <text y="0"><tspan fill="#f59e0b" font-weight="bold">PK</tspan>  id : <tspan fill="#94a3b8">BIGINT</tspan></text>
              <text y="24"><tspan fill="#c084fc" font-weight="bold">FK</tspan>  project_id : <tspan fill="#94a3b8">BIGINT</tspan></text>
              <text y="48">http_method : <tspan fill="#94a3b8">VARCHAR(16)</tspan></text>
              <text y="72">path : <tspan fill="#94a3b8">VARCHAR(255)</tspan></text>
              <text y="96">status_codes : <tspan fill="#94a3b8">VARCHAR(64)</tspan></text>
            </g>
          </g>
        </svg>
        """.trim();
    }
}
