// SCRUM-72: Servicio que consume ideator-arch-agent en Microsoft Foundry para justificación de arquitectura, despliegue y diagramas Mermaid/SVG.
package com.ideator.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * SCRUM-72 – ArchitectureSpecService (Fase G: Arquitectura & DevOps)
 *
 * Invoca al agente especializado ideator-arch-agent (fase ARCHITECTURE) a través de
 * {@link FoundryAgentOrchestratorService} para generar la justificación del stack tecnológico,
 * la estrategia de despliegue con contenedores Docker, el diagrama dinámico en Mermaid y
 * el diagrama topológico de red en formato SVG (architectureSvg).
 */
@Service
@Slf4j
public class ArchitectureSpecService {

    private final FoundryAgentOrchestratorService orchestratorService;
    private final ObjectMapper objectMapper;

    public ArchitectureSpecService() {
        this.orchestratorService = null;
        this.objectMapper = new ObjectMapper();
    }

    @Autowired
    public ArchitectureSpecService(
            @Autowired(required = false) FoundryAgentOrchestratorService orchestratorService,
            ObjectMapper objectMapper) {
        this.orchestratorService = orchestratorService;
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    /**
     * Genera la especificación de arquitectura para el proyecto dado invocando a ideator-arch-agent,
     * incluyendo la justificación técnica, el plan de despliegue, el diagrama Mermaid y el SVG de arquitectura.
     *
     * @param projectId identificador del proyecto
     * @return JSON con justification, deploymentPlan, mermaidDiagram y architectureSvg
     */
    public String generateArchitectureSpec(Long projectId) {
        if (orchestratorService != null) {
            try {
                String prompt = "Genera la especificación de arquitectura técnica, el plan de despliegue en contenedores, " +
                        "un diagrama dinámico de arquitectura en sintaxis Mermaid (flowchart TD) y una representación topológica " +
                        "para el proyecto con ID " + projectId + ". " +
                        "Devuelve un objeto JSON con las claves: justification, deploymentPlan, mermaidDiagram y architectureSvg.";
                String response = orchestratorService.callAgent(AgentPhase.ARCHITECTURE, prompt);
                if (response != null && !response.isBlank()) {
                    return enrichWithMermaidAndSvgIfNeeded(response);
                }
            } catch (Exception e) {
                log.warn("Error al invocar ideator-arch-agent, aplicando especificación base: {}", e.getMessage());
            }
        }

        return buildDefaultArchitectureSpec();
    }

    private String enrichWithMermaidAndSvgIfNeeded(String rawResponse) {
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            if (root.isObject()) {
                ObjectNode objectNode = (ObjectNode) root;
                boolean modified = false;

                if (!objectNode.has("mermaidDiagram") || objectNode.get("mermaidDiagram").asText().isBlank()) {
                    objectNode.put("mermaidDiagram", buildDefaultMermaidDiagram());
                    modified = true;
                }
                if (!objectNode.has("architectureSvg") || objectNode.get("architectureSvg").asText().isBlank()) {
                    objectNode.put("architectureSvg", buildDefaultArchitectureSvg());
                    modified = true;
                }

                return modified ? objectMapper.writeValueAsString(objectNode) : rawResponse;
            }
        } catch (Exception e) {
            log.debug("La respuesta no era JSON puro o no pudo parsearse, envolviendo con diagramas base: {}", e.getMessage());
        }

        return buildDefaultArchitectureSpec();
    }

    public String buildDefaultArchitectureSpec() {
        String justification = "El stack tecnológico integra Spring Boot 3.4 para un backend empresarial fuertemente tipado con seguridad JWT stateless, " +
                "React 18 con TypeScript y Vite para una SPA moderna y reactiva, PostgreSQL 15 como base de datos relacional de alta fiabilidad " +
                "con pool HikariCP, Docker Compose para entornos reproducibles y Microsoft Azure AI Foundry junto a Azure OpenAI para capacidades " +
                "autónomas de agentes especializados. Esta topología garantiza velocidad de desarrollo, escala horizontal y bajo acoplamiento.";

        String deploymentPlan = "Docker Compose orquesta los contenedores en una red bridge aislada. " +
                "El backend se empaqueta en una imagen multicapa con Eclipse Temurin 21 exponiendo el puerto 8080. " +
                "El frontend se compila con Vite y se sirve mediante Nginx en el puerto 80/3000. " +
                "PostgreSQL se ejecuta en un contenedor dedicado con volumen persistente para almacenamiento transaccional. " +
                "Para producción, el manifiesto es compatible con Azure Container Apps o AKS, inyectando secretos desde Azure Key Vault.";

        String mermaid = buildDefaultMermaidDiagram();
        String svg = buildDefaultArchitectureSvg();

        ObjectNode json = objectMapper.createObjectNode();
        json.put("justification", justification);
        json.put("deploymentPlan", deploymentPlan);
        json.put("mermaidDiagram", mermaid);
        json.put("architectureSvg", svg);

        try {
            return objectMapper.writeValueAsString(json);
        } catch (Exception e) {
            return "{\"justification\":\"" + justification.replace("\"", "\\\"") +
                    "\",\"deploymentPlan\":\"" + deploymentPlan.replace("\"", "\\\"") +
                    "\",\"mermaidDiagram\":\"" + mermaid.replace("\n", "\\n").replace("\"", "\\\"") +
                    "\",\"architectureSvg\":\"" + svg.replace("\"", "\\\"").replace("\n", "") + "\"}";
        }
    }

    public String buildDefaultMermaidDiagram() {
        return "flowchart TD\n" +
                "    subgraph Client[\"Capa de Presentación (Client-Side)\"]\n" +
                "        UI[\"Frontend SPA<br/>React 18 + TypeScript + Vite :3000\"]\n" +
                "    end\n\n" +
                "    subgraph Host[\"Host Local / Docker Compose\"]\n" +
                "        subgraph AppNet[\"Red Aislada (Bridge Network)\"]\n" +
                "            API[\"Backend REST API<br/>Spring Boot 3.4.5 + Security :8080\"]\n" +
                "            DB[(\"Base de Datos Relacional<br/>PostgreSQL 15 :5434:5432\")]\n" +
                "        end\n" +
                "    end\n\n" +
                "    subgraph Cloud[\"Infraestructura Cloud (Microsoft Azure)\"]\n" +
                "        Foundry[\"Azure AI Foundry<br/>Agents Multi-Phase Pipeline\"]\n" +
                "        OpenAI[\"Azure OpenAI Service<br/>Deployment (gpt-5-mini / gpt-4o)\"]\n" +
                "        Vault[\"Azure Key Vault<br/>Gestión Centralizada de Secretos\"]\n" +
                "    end\n\n" +
                "    UI -->|HTTPS REST Bearer JWT| API\n" +
                "    API -->|JDBC HikariCP Pool| DB\n" +
                "    API -->|Foundry Agent Protocol| Foundry\n" +
                "    API -->|Azure OpenAI SDK| OpenAI\n" +
                "    API -->|KeyVault SecretClient| Vault";
    }

    /**
     * Retorna el diagrama topológico de arquitectura en formato SVG limpio,
     * responsivo y adaptado al visor de la Fase G.
     */
    public String buildDefaultArchitectureSvg() {
        return """
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 520" width="100%" height="100%" style="background-color: #04060d; border-radius: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
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

          <!-- TIER 1: CLIENT PRESENTATION LAYER -->
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

          <!-- TIER 2: HOST LOCAL & DOCKER COMPOSE -->
          <g filter="url(#cardShadow)">
            <rect x="340" y="50" width="270" height="420" rx="12" fill="#0c122c" stroke="#4f46e5" stroke-width="2"/>
            <rect x="340" y="50" width="270" height="42" rx="12" fill="url(#hostGrad)"/>
            <text x="356" y="77" fill="#ffffff" font-size="13" font-weight="bold">🐳 Host / Docker Bridge Network</text>

            <!-- Container 1: Backend API -->
            <rect x="355" y="110" width="240" height="170" rx="8" fill="#0f172a" stroke="#4338ca" stroke-width="1.5"/>
            <text x="368" y="135" fill="#818cf8" font-size="11" font-weight="bold">Backend REST API</text>
            <text x="368" y="155" fill="#94a3b8" font-size="10">• Spring Boot 3.4.5 + Java 21</text>
            <text x="368" y="175" fill="#94a3b8" font-size="10">• Puerto: <tspan fill="#f8fafc">8080:8080</tspan></text>
            <text x="368" y="195" fill="#94a3b8" font-size="10">• Spring Security JWT Stateless</text>
            <text x="368" y="215" fill="#94a3b8" font-size="10">• Orquestador 8 Agentes Foundry</text>
            <text x="368" y="235" fill="#94a3b8" font-size="10">• HikariCP Connection Pool (10)</text>
            <text x="368" y="255" fill="#94a3b8" font-size="10">• Fallback Resiliente Offline</text>

            <!-- Container 2: Postgres DB -->
            <rect x="355" y="300" width="240" height="140" rx="8" fill="#0f172a" stroke="#334155" stroke-width="1"/>
            <text x="368" y="325" fill="#818cf8" font-size="11" font-weight="bold">Base de Datos PostgreSQL 15</text>
            <text x="368" y="348" fill="#94a3b8" font-size="10">• Mapeo: <tspan fill="#f8fafc">5434:5432</tspan> (Evita colisiones)</text>
            <text x="368" y="368" fill="#94a3b8" font-size="10">• Volumen: <tspan fill="#f8fafc">ideator_pgdata</tspan></text>
            <text x="368" y="388" fill="#94a3b8" font-size="10">• Hibernate Dialect PostgreSQL</text>
            <text x="368" y="408" fill="#94a3b8" font-size="10">• Persistencia PhaseSpecification</text>
          </g>

          <!-- TIER 3: MICROSOFT AZURE CLOUD -->
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

          <!-- FLOW ARROWS -->
          <!-- Client -> Backend -->
          <path d="M 280 180 L 340 180" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#connArrow)"/>
          <text x="286" y="172" fill="#7dd3fc" font-size="9" font-weight="bold">HTTPS/JWT</text>

          <!-- Backend -> DB -->
          <path d="M 475 280 L 475 300" fill="none" stroke="#818cf8" stroke-width="2" marker-end="url(#connArrow)"/>
          <text x="482" y="293" fill="#a5b4fc" font-size="9" font-weight="bold">JDBC:5434</text>

          <!-- Backend -> Foundry -->
          <path d="M 595 165 L 685 165" fill="none" stroke="#34d399" stroke-width="2" marker-end="url(#connArrow)"/>
          <text x="612" y="157" fill="#6ee7b7" font-size="9" font-weight="bold">Agents API</text>

          <!-- Backend -> Key Vault -->
          <path d="M 595 395 L 685 395" fill="none" stroke="#34d399" stroke-width="2" marker-end="url(#connArrow)"/>
          <text x="615" y="387" fill="#6ee7b7" font-size="9" font-weight="bold">SDK Secret</text>
        </svg>
        """.trim();
    }
}
