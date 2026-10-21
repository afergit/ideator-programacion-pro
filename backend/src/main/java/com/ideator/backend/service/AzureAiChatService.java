// SCRUM-29: Servicio para interactuar con Azure OpenAI y generar respuestas estructuradas en JSON.
package com.ideator.backend.service;

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.models.ChatCompletions;
import com.azure.ai.openai.models.ChatCompletionsOptions;
import com.azure.ai.openai.models.ChatRequestMessage;
import com.azure.ai.openai.models.ChatRequestSystemMessage;
import com.azure.ai.openai.models.ChatRequestUserMessage;
import com.ideator.backend.config.AzureOpenAIProperties;
import com.ideator.backend.dto.AiAnalysisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * AzureAiChatService
 *
 * Este servicio encapsula la lógica de llamada a Azure OpenAI con un System Prompt
 * estricto que fuerza al modelo a devolver siempre un JSON con la siguiente
 * estructura:
 * {
 *   "analisisInterno": "...",
 *   "estado": "PREGUNTANDO | BLOQUEO | LISTO_FASE_B",
 *   "respuestaAlUsuario": "...",
 *   "preguntasBloqueantes": ["...", "..."]
 * }
 *
 * Además, implementa la regla de “bloqueo” que obliga al modelo a responder
 * con estado "BLOQUEO" cuando faltan datos críticos.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AzureAiChatService {

    private final OpenAIClient openAIClient;
    private final AzureOpenAIProperties properties;

    private static final String SYSTEM_PROMPT = "You are a strict system that must never hallucinate. " +
            "If any required information (problem, target client, MVP scope) is missing, respond with " +
            "estado = \"BLOQUEO\" and list the missing questions in preguntasBloqueantes. " +
            "Otherwise respond with estado = \"LISTO_FASE_B\" or \"PREGUNTANDO\" as appropriate. " +
            "Response must be a single JSON object with fields: analisisInterno, estado, respuestaAlUsuario, preguntasBloqueantes.";

    /**
     * Envía el mensaje del usuario al modelo y devuelve la respuesta estructurada.
     *
     * @param userMessage mensaje del usuario
     * @return {@link AiAnalysisResponse} parseado del JSON del modelo
     */
    public AiAnalysisResponse chat(String userMessage) {
        // Build chat messages: system prompt + user message
        ChatRequestSystemMessage systemMessage = new ChatRequestSystemMessage(SYSTEM_PROMPT);
        ChatRequestUserMessage user = new ChatRequestUserMessage(userMessage);
        ChatCompletionsOptions options = new ChatCompletionsOptions(
                Collections.singletonList((ChatRequestMessage) systemMessage),
                Collections.singletonList((ChatRequestMessage) user)
        );
        // Configure deployment name, temperature = 0 for deterministic output
        options.setDeploymentName(properties.getDeploymentName());
        options.setTemperature(0.0f);

        try {
            ChatCompletions completions = openAIClient.getChatCompletions(options);
            String json = completions.getChoices().get(0).getMessage().getContent();
            // Simple parsing – in production use a robust JSON mapper (e.g., Jackson)
            // For this example we rely on Spring's ObjectMapper (already on classpath)
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(json, AiAnalysisResponse.class);
        } catch (Exception e) {
            log.error("Error calling Azure OpenAI", e);
            // Return a fallback bloqueo response
            AiAnalysisResponse fallback = new AiAnalysisResponse();
            fallback.setAnalisisInterno("Error interno al contactar el modelo.");
            fallback.setEstado("BLOQUEO");
            fallback.setRespuestaAlUsuario("Hubo un problema interno, por favor intenta más tarde.");
            fallback.setPreguntasBloqueantes(Collections.emptyList());
            return fallback;
        }
    }
}
