// Servicio para interactuar con Azure AI Foundry (ideator-context-agent) y generar respuestas estructuradas en JSON.
package com.ideator.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideator.backend.dto.AiAnalysisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.Collections;

/**
 * AzureAiChatService
 *
 * Consume el agente especializado ideator-context-agent (fase CONTEXT) a través de
 * {@link FoundryAgentOrchestratorService}. El agente en Microsoft Foundry contiene
 * las instrucciones y reglas del sistema para responder con el JSON estructurado:
 * {
 *   "analisisInterno": "...",
 *   "estado": "PREGUNTANDO | BLOQUEO | LISTO_FASE_B",
 *   "respuestaAlUsuario": "...",
 *   "preguntasBloqueantes": ["...", "..."]
 * }
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AzureAiChatService {

    private final FoundryAgentOrchestratorService orchestratorService;
    private final ObjectMapper objectMapper;

    /**
     * Envía el mensaje del usuario al agente de contexto de Foundry y devuelve la respuesta estructurada.
     *
     * @param userMessage mensaje del usuario
     * @return {@link AiAnalysisResponse} parseado del JSON devuelto por el agente
     */
    public AiAnalysisResponse chat(String userMessage) {
        try {
            String rawResponse = orchestratorService.callAgent(AgentPhase.CONTEXT, userMessage);
            return parseResponse(rawResponse);
        } catch (Exception e) {
            log.error("Error al invocar ideator-context-agent en Foundry", e);
            AiAnalysisResponse fallback = new AiAnalysisResponse();
            fallback.setAnalisisInterno("Error interno al contactar el modelo.");
            fallback.setEstado("BLOQUEO");
            fallback.setRespuestaAlUsuario("Hubo un problema interno, por favor intenta más tarde.");
            fallback.setPreguntasBloqueantes(Collections.emptyList());
            return fallback;
        }
    }

    private AiAnalysisResponse parseResponse(String rawResponse) {
        if (!StringUtils.hasText(rawResponse)) {
            throw new IllegalArgumentException("Respuesta vacía del agente");
        }
        try {
            return objectMapper.readValue(rawResponse, AiAnalysisResponse.class);
        } catch (Exception e) {
            String cleaned = cleanJsonMarkdown(rawResponse);
            try {
                return objectMapper.readValue(cleaned, AiAnalysisResponse.class);
            } catch (Exception ex) {
                log.warn("La respuesta del agente no es JSON estricto, envolviendo en AiAnalysisResponse: {}", rawResponse);
                AiAnalysisResponse resp = new AiAnalysisResponse();
                resp.setAnalisisInterno(rawResponse);
                resp.setEstado("PREGUNTANDO");
                resp.setRespuestaAlUsuario(rawResponse);
                resp.setPreguntasBloqueantes(Collections.emptyList());
                return resp;
            }
        }
    }

    private String cleanJsonMarkdown(String raw) {
        String cleaned = raw.trim();
        if (cleaned.startsWith("```json")) {
            cleaned = cleaned.substring(7);
        } else if (cleaned.startsWith("```")) {
            cleaned = cleaned.substring(3);
        }
        if (cleaned.endsWith("```")) {
            cleaned = cleaned.substring(0, cleaned.length() - 3);
        }
        return cleaned.trim();
    }
}
