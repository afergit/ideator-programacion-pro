package com.ideator.backend.service;

import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.models.KeyVaultSecret;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ideator.backend.config.AzureFoundryProperties;
import com.ideator.backend.config.AzureOpenAIProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

import java.util.List;

/**
 * Servicio Orquestador Multi-Agente para Microsoft Azure AI Foundry.
 *
 * Consume de forma desacoplada los 5 agentes especializados:
 * - ideator-context-agent (CONTEXT)
 * - ideator-db-agent (DB)
 * - ideator-api-agent (API)
 * - ideator-ui-agent (UI)
 * - ideator-arch-agent (ARCHITECTURE)
 *
 * Construye dinámicamente el endpoint del protocolo de respuestas de OpenAI:
 * {project-endpoint}/agents/{agentName}/endpoint/protocols/openai/responses?api-version={api-version}
 *
 * Autentica mediante Azure Key Vault recuperando el secreto 'AzureOpenAiKey'
 * y enviándolo en las cabeceras HTTP (api-key y Authorization: Bearer).
 */
@Service
@Slf4j
public class FoundryAgentOrchestratorService {

    private final AzureFoundryProperties properties;
    private final SecretClient secretClient;
    private final AzureOpenAIProperties openAIProperties;
    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Autowired
    public FoundryAgentOrchestratorService(
            AzureFoundryProperties properties,
            @Autowired(required = false) SecretClient secretClient,
            @Autowired(required = false) AzureOpenAIProperties openAIProperties,
            @Autowired(required = false) RestTemplate restTemplate,
            ObjectMapper objectMapper) {
        this.properties = properties != null ? properties : new AzureFoundryProperties();
        this.secretClient = secretClient;
        this.openAIProperties = openAIProperties;
        this.restTemplate = restTemplate != null ? restTemplate : new RestTemplate();
        this.objectMapper = objectMapper != null ? objectMapper : new ObjectMapper();
    }

    /**
     * Construye dinámicamente la URL del protocolo de respuestas de Foundry para el agente de la fase dada.
     *
     * @param phase Fase del ciclo de diseño
     * @return URL completa del endpoint del agente
     */
    public String buildEndpointUrl(AgentPhase phase) {
        String base = properties.getProjectEndpoint();
        if (base == null || base.isBlank()) {
            base = "https://acolque-6927-resource.services.ai.azure.com/api/projects/acolque-4355";
        }
        if (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }

        String agentName = resolveAgentName(phase);
        String apiVersion = properties.getApiVersion();
        if (!StringUtils.hasText(apiVersion)) {
            apiVersion = "2025-05-15-preview";
        }

        return String.format("%s/agents/%s/endpoint/protocols/openai/responses?api-version=%s",
                base, agentName, apiVersion);
    }

    /**
     * Resuelve el nombre del agente registrado para la fase especificada.
     */
    public String resolveAgentName(AgentPhase phase) {
        if (phase == null) {
            return "ideator-context-agent";
        }
        return properties.getAgentName(phase);
    }

    /**
     * Recupera la clave de autenticación desde Azure Key Vault (secreto 'AzureOpenAiKey'),
     * con fallback a las propiedades o variable de entorno.
     */
    public String resolveApiKey() {
        if (secretClient != null) {
            try {
                KeyVaultSecret secret = secretClient.getSecret("AzureOpenAiKey");
                if (secret != null && StringUtils.hasText(secret.getValue())) {
                    log.debug("Clave AzureOpenAiKey obtenida desde Azure Key Vault para Foundry Agent");
                    return secret.getValue();
                }
            } catch (Exception e) {
                log.warn("No se pudo obtener el secreto 'AzureOpenAiKey' de Azure Key Vault: {}", e.getMessage());
            }
        }

        if (openAIProperties != null && StringUtils.hasText(openAIProperties.apiKey())) {
            return openAIProperties.apiKey();
        }

        String envKey = System.getenv("AZURE_OPENAI_KEY");
        if (StringUtils.hasText(envKey)) {
            return envKey;
        }

        return "";
    }

    /**
     * Invoca al agente correspondiente a la fase dada pasando el payload de entrada.
     *
     * @param phaseName Nombre de la fase en String (CONTEXT, DB, API, UI, ARCHITECTURE)
     * @param payload Carga de entrada
     * @return Contenido generado extraído de la respuesta del agente
     */
    public String callAgent(String phaseName, String payload) {
        AgentPhase phase = AgentPhase.valueOf(phaseName.toUpperCase());
        return callAgent(phase, payload);
    }

    /**
     * Invoca al agente de la fase indicada y extrae el texto generado.
     *
     * @param phase Fase del ciclo (CONTEXT, DB, API, UI, ARCHITECTURE)
     * @param payload Contenido de entrada para el agente
     * @return Texto generado por el agente de Foundry
     */
    public String callAgent(AgentPhase phase, String payload) {
        String url = buildEndpointUrl(phase);
        log.info("Invocando agente {} ({}) en {}", phase, resolveAgentName(phase), url);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));

        String apiKey = resolveApiKey();
        if (StringUtils.hasText(apiKey)) {
            headers.set("api-key", apiKey);
            headers.set("Authorization", "Bearer " + apiKey);
        }

        String requestBody = buildRequestBody(payload);
        HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return extractGeneratedContent(response.getBody());
            } else {
                log.warn("Respuesta no exitosa del agente {}: status={}", phase, response.getStatusCode());
                return "";
            }
        } catch (Exception e) {
            log.error("Error al invocar agente {} en URL {}: {}", phase, url, e.getMessage());
            throw new RuntimeException("Error en comunicación con agente Foundry (" + phase + "): " + e.getMessage(), e);
        }
    }

    /**
     * Construye el cuerpo JSON de la petición HTTP conforme al protocolo de respuestas de OpenAI.
     */
    public String buildRequestBody(String payload) {
        if (payload != null && payload.trim().startsWith("{")
                && (payload.contains("\"input\"") || payload.contains("\"messages\""))) {
            return payload;
        }
        ObjectNode root = objectMapper.createObjectNode();
        root.put("input", payload != null ? payload : "");
        return root.toString();
    }

    /**
     * Extrae el contenido textual generado a partir de la respuesta JSON del protocolo de respuestas de Foundry.
     *
     * Soporta:
     * 1. Protocolo OpenAI Responses API: output[].content[].text
     * 2. Protocolo OpenAI Chat Completions: choices[0].message.content
     * 3. Campos directos: response, output_text, text, content, message
     */
    public String extractGeneratedContent(String responseJson) {
        if (!StringUtils.hasText(responseJson)) {
            return "";
        }
        try {
            JsonNode root = objectMapper.readTree(responseJson);

            // 1. Protocolo OpenAI Responses API: output[].content[].text
            JsonNode outputNode = root.path("output");
            if (outputNode.isArray() && !outputNode.isEmpty()) {
                StringBuilder sb = new StringBuilder();
                for (JsonNode item : outputNode) {
                    JsonNode contentNode = item.path("content");
                    if (contentNode.isArray()) {
                        for (JsonNode c : contentNode) {
                            if (c.has("text") && !c.path("text").isNull()) {
                                sb.append(c.path("text").asText());
                            } else if (c.isTextual()) {
                                sb.append(c.asText());
                            }
                        }
                    } else if (contentNode.isTextual()) {
                        sb.append(contentNode.asText());
                    } else if (item.has("text") && !item.path("text").isNull()) {
                        sb.append(item.path("text").asText());
                    }
                }
                if (!sb.isEmpty()) {
                    return cleanJson(sb.toString().trim());
                }
            } else if (outputNode.isTextual()) {
                return cleanJson(outputNode.asText().trim());
            }

            // 2. Protocolo OpenAI Chat Completions: choices[0].message.content
            JsonNode choicesNode = root.path("choices");
            if (choicesNode.isArray() && !choicesNode.isEmpty()) {
                JsonNode messageNode = choicesNode.get(0).path("message");
                if (messageNode.has("content") && !messageNode.path("content").isNull()) {
                    return cleanJson(messageNode.path("content").asText().trim());
                }
            }

            // 3. Campos directos
            for (String field : List.of("response", "output_text", "text", "content", "message")) {
                if (root.has(field) && !root.path(field).isNull() && root.path(field).isTextual()) {
                    return cleanJson(root.path(field).asText().trim());
                }
            }

            return cleanJson(responseJson.trim());
        } catch (Exception e) {
            log.debug("No se pudo interpretar como JSON, retornando texto plano: {}", e.getMessage());
            return cleanJson(responseJson.trim());
        }
    }

    /**
     * Sanitiza el texto devuelto por el modelo LLM, eliminando bloques markdown (```json ... ```)
     * y extrayendo el contenido JSON delimitado por llaves o corchetes para evitar fallos de deserialización.
     */
    public static String cleanJson(String raw) {
        if (!StringUtils.hasText(raw)) {
            return "";
        }
        String trimmed = raw.trim();

        // 1. Eliminar fences de código markdown si existen
        if (trimmed.startsWith("```")) {
            int firstNewline = trimmed.indexOf('\n');
            if (firstNewline != -1) {
                trimmed = trimmed.substring(firstNewline + 1);
            }
            if (trimmed.endsWith("```")) {
                trimmed = trimmed.substring(0, trimmed.length() - 3);
            }
            trimmed = trimmed.trim();
        }

        // 2. Extraer el bloque JSON más externo {...} o [...] si viene acompañado de texto o reasoning
        int firstBrace = trimmed.indexOf('{');
        int firstBracket = trimmed.indexOf('[');
        int start = -1;
        if (firstBrace != -1 && firstBracket != -1) {
            start = Math.min(firstBrace, firstBracket);
        } else if (firstBrace != -1) {
            start = firstBrace;
        } else if (firstBracket != -1) {
            start = firstBracket;
        }

        if (start != -1) {
            int lastBrace = trimmed.lastIndexOf('}');
            int lastBracket = trimmed.lastIndexOf(']');
            int end = Math.max(lastBrace, lastBracket);
            if (end > start) {
                return trimmed.substring(start, end + 1).trim();
            }
        }

        return trimmed;
    }
}
