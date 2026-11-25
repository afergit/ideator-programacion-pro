// SCRUM-73: Service that compiles project data into Markdown documents.
package com.ideator.backend.service;

import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.models.KeyVaultSecret;
import com.ideator.backend.model.ChatMessage;
import com.ideator.backend.model.EndpointSpec;
import com.ideator.backend.repository.ChatMessageRepository;
import com.ideator.backend.repository.EndpointSpecRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * SCRUM-73 – MarkdownGeneratorService
 *
 * Compila toda la información almacenada (Fases A‑H) en PostgreSQL y genera dos
 * documentos Markdown que cumplen con los entregables del proyecto:
 *   1️⃣ {@code Especificacion_Producto.md} (Fases A, B, C, D)
 *   2️⃣ {@code Arquitectura_Definitiva.md} (Fases E: Security, F: QA, G: Architecture, H: FinOps)
 *
 * Inyecta SecretClient para recuperar la clave AzureOpenAiKey de Azure Key Vault.
 */
@Service
@Slf4j
public class MarkdownGeneratorService {

    private final ChatMessageRepository chatMessageRepository;
    private final EndpointSpecRepository endpointSpecRepository;
    private final DatabaseSpecService databaseSpecService; // from SCRUM‑69
    private final UiMapService uiMapService;               // from SCRUM‑71
    private final ArchitectureSpecService architectureSpecService; // from SCRUM‑72
    private final SecuritySpecService securitySpecService; // Fase E: Ciberseguridad
    private final QaSpecService qaSpecService;             // Fase F: QA & Testing
    private final FinopsSpecService finopsSpecService;     // Fase H: FinOps
    private final SecretClient secretClient;

    public MarkdownGeneratorService(ChatMessageRepository chatMessageRepository,
                                    EndpointSpecRepository endpointSpecRepository,
                                    DatabaseSpecService databaseSpecService,
                                    UiMapService uiMapService,
                                    ArchitectureSpecService architectureSpecService) {
        this(chatMessageRepository, endpointSpecRepository, databaseSpecService, uiMapService, architectureSpecService,
                new SecuritySpecService(), new QaSpecService(), new FinopsSpecService(), null);
    }

    public MarkdownGeneratorService(ChatMessageRepository chatMessageRepository,
                                    EndpointSpecRepository endpointSpecRepository,
                                    DatabaseSpecService databaseSpecService,
                                    UiMapService uiMapService,
                                    ArchitectureSpecService architectureSpecService,
                                    SecretClient secretClient) {
        this(chatMessageRepository, endpointSpecRepository, databaseSpecService, uiMapService, architectureSpecService,
                new SecuritySpecService(), new QaSpecService(), new FinopsSpecService(), secretClient);
    }

    @Autowired
    public MarkdownGeneratorService(ChatMessageRepository chatMessageRepository,
                                    EndpointSpecRepository endpointSpecRepository,
                                    DatabaseSpecService databaseSpecService,
                                    UiMapService uiMapService,
                                    ArchitectureSpecService architectureSpecService,
                                    @Autowired(required = false) SecuritySpecService securitySpecService,
                                    @Autowired(required = false) QaSpecService qaSpecService,
                                    @Autowired(required = false) FinopsSpecService finopsSpecService,
                                    @Autowired(required = false) SecretClient secretClient) {
        this.chatMessageRepository = chatMessageRepository;
        this.endpointSpecRepository = endpointSpecRepository;
        this.databaseSpecService = databaseSpecService;
        this.uiMapService = uiMapService;
        this.architectureSpecService = architectureSpecService;
        this.securitySpecService = securitySpecService != null ? securitySpecService : new SecuritySpecService();
        this.qaSpecService = qaSpecService != null ? qaSpecService : new QaSpecService();
        this.finopsSpecService = finopsSpecService != null ? finopsSpecService : new FinopsSpecService();
        this.secretClient = secretClient;
    }

    /**
     * Recupera la clave AzureOpenAiKey de Azure Key Vault usando SecretClient.
     *
     * @return el valor del secreto AzureOpenAiKey o null si no se pudo recuperar
     */
    public String retrieveAzureOpenAiKey() {
        if (secretClient != null) {
            try {
                KeyVaultSecret secret = secretClient.getSecret("AzureOpenAiKey");
                if (secret != null) {
                    return secret.getValue();
                }
            } catch (Exception e) {
                log.warn("No se pudo recuperar la clave AzureOpenAiKey de Azure Key Vault: {}", e.getMessage());
            }
        }
        return null;
    }

    public SecretClient getSecretClient() {
        return this.secretClient;
    }

    /**
     * Alias para compatibilidad con controladores y clientes.
     */
    public String generateProductSpec(Long projectId) {
        return generateProductSpecification(projectId);
    }

    /**
     * Genera el documento {@code Especificacion_Producto.md} con la siguiente estructura:
     * <pre>
     * Problema y contexto (fase A) – obtenidos del primer mensaje del chat.
     * Modelo físico de BD (fase B) – JSON del DatabaseSpecService.
     * Endpoints REST (fase C) – tabla de EndpointSpec.
     * Mapa conceptual de interfaces (fase D) – JSON del UiMapService.
     * </pre>
     */
    public String generateProductSpecification(Long projectId) {
        StringBuilder sb = new StringBuilder();
        sb.append("# Especificación del Producto\n\n");

        // Fase A – Tomamos el primer mensaje del usuario si existe
        sb.append("## Problema y Contexto\n");
        List<ChatMessage> chat = chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId);
        if (chat != null && !chat.isEmpty()) {
            ChatMessage first = chat.get(0);
            sb.append(first.getContent()).append("\n\n");
        } else {
            sb.append("No se registraron mensajes iniciales para el problema y contexto.\n\n");
        }

        // Fase B – Modelo físico DB
        sb.append("## Modelo Físico de Base de Datos\n");
        String dbJson = databaseSpecService.generatePhysicalModel("placeholder analysis");
        sb.append("```json\n").append(dbJson != null ? dbJson : "{}").append("\n```\n\n");

        try {
            if (dbJson != null) {
                com.fasterxml.jackson.databind.JsonNode dbRoot = new com.fasterxml.jackson.databind.ObjectMapper().readTree(dbJson);
                if (dbRoot.has("mermaidDiagram") && !dbRoot.get("mermaidDiagram").asText().isBlank()) {
                    sb.append("### Diagrama Entidad-Relación (ERD)\n");
                    sb.append("```mermaid\n").append(dbRoot.get("mermaidDiagram").asText()).append("\n```\n\n");
                }
            }
        } catch (Exception ignored) {}

        // Fase C – Endpoints REST
        sb.append("## Endpoints REST\n");
        List<EndpointSpec> endpoints = endpointSpecRepository.findByProjectId(projectId);
        sb.append("| Método | Ruta | Request Body | Response Body | Status Codes |\n");
        sb.append("|--------|------|--------------|---------------|--------------|\n");
        if (endpoints != null && !endpoints.isEmpty()) {
            for (EndpointSpec e : endpoints) {
                sb.append(String.format("| %s | %s | %s | %s | %s |\n",
                        e.getHttpMethod(),
                        e.getPath(),
                        e.getRequestBody() != null ? e.getRequestBody() : "-",
                        e.getResponseBody() != null ? e.getResponseBody() : "-",
                        e.getStatusCodes()));
            }
        }
        sb.append("\n");

        // Fase D – Mapa Conceptual de Interfaces
        sb.append("## Mapa Conceptual de Interfaces\n");
        String uiMapJson = uiMapService.generateUiMap(projectId);
        sb.append("```json\n").append(uiMapJson != null ? uiMapJson : "{}").append("\n```\n");

        return sb.toString();
    }

    /**
     * Alias para compatibilidad con controladores y clientes.
     */
    public String generateArchitectureSpec(Long projectId) {
        return generateArchitectureSpecification(projectId);
    }

    /**
     * Genera el documento {@code Arquitectura_Definitiva.md} que consolida las fases:
     * - Fase E: Seguridad y Mitigación de Amenazas (OWASP & Key Vault)
     * - Fase F: Plan de Pruebas y Aseguramiento de Calidad (QA)
     * - Fase G: Justificación Técnica, Diagrama y Docker (Arquitectura & DevOps)
     * - Fase H: Presupuesto y Estimación de Costos Cloud (FinOps)
     */
    public String generateArchitectureSpecification(Long projectId) {
        StringBuilder sb = new StringBuilder();
        sb.append("# Arquitectura Definitiva\n\n");

        // Fase E – Ciberseguridad & AppSec (OWASP & Key Vault)
        sb.append("## Seguridad y Mitigación de Amenazas (OWASP & Key Vault)\n");
        sb.append("```json\n").append(securitySpecService.getSecuritySpec(projectId)).append("\n```\n\n");

        // Fase F – QA & Testing
        sb.append("## Plan de Pruebas y Aseguramiento de Calidad (QA)\n");
        sb.append("```json\n").append(qaSpecService.getQaSpec(projectId)).append("\n```\n\n");

        // Fase G – Justificación Técnica y Diagrama
        sb.append("## Justificación Técnica\n");
        String archJson = architectureSpecService.generateArchitectureSpec(projectId);
        try {
            com.fasterxml.jackson.databind.JsonNode root = new com.fasterxml.jackson.databind.ObjectMapper().readTree(archJson);
            if (root.has("justification")) {
                sb.append(root.get("justification").asText()).append("\n\n");
            }
            sb.append("## Diagrama de Arquitectura\n");
            if (root.has("mermaidDiagram") && !root.get("mermaidDiagram").asText().isBlank()) {
                sb.append("```mermaid\n").append(root.get("mermaidDiagram").asText()).append("\n```\n\n");
            } else {
                sb.append("(Insertar diagrama aquí – en producción usar PlantUML o Mermaid)\n\n");
            }
            if (root.has("deploymentPlan")) {
                sb.append("## Plan de Despliegue Cloud\n");
                sb.append(root.get("deploymentPlan").asText()).append("\n\n");
            }
        } catch (Exception e) {
            sb.append(archJson).append("\n\n");
            sb.append("## Diagrama de Arquitectura\n");
            sb.append("(Insertar diagrama aquí – en producción usar PlantUML o Mermaid)\n\n");
        }
        sb.append("## Configuración Docker\n");
        sb.append("```yaml\n");
        sb.append("version: '3.8'\nservices:\n  backend:\n    build: ./backend\n    ports:\n      - \"8080:8080\"\n    environment:\n      - SPRING_PROFILES_ACTIVE=prod\n  frontend:\n    build: ./frontend\n    ports:\n      - \"80:80\"\n  postgres:\n    image: postgres:15\n    environment:\n      - POSTGRES_DB=ideator\n      - POSTGRES_USER=ideator\n      - POSTGRES_PASSWORD=password\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:\n```\n\n");
        sb.append("## Estrategia de Consumo de Azure AI\n");
        sb.append("Se utiliza el servicio orquestador `FoundryAgentOrchestratorService` para consumir de forma desacoplada los 8 agentes especializados alojados en Microsoft Azure AI Foundry (ideator-context-agent, ideator-db-agent, ideator-api-agent, ideator-ui-agent, ideator-sec-agent, ideator-qa-agent, ideator-arch-agent, ideator-finops-agent).\n\n");

        // Fase H – FinOps & Presupuesto Cloud
        sb.append("## Presupuesto y Estimación de Costos Cloud (FinOps)\n");
        sb.append("```json\n").append(finopsSpecService.getFinopsSpec(projectId)).append("\n```\n\n");

        // Recuperar AzureOpenAiKey si SecretClient está configurado
        String key = retrieveAzureOpenAiKey();
        if (key != null && !key.isBlank()) {
            sb.append("\nClave AzureOpenAiKey recuperada exitosamente desde Azure Key Vault.\n");
        }

        return sb.toString();
    }
}
