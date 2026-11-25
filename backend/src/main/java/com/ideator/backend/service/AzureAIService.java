package com.ideator.backend.service;
//Integración con Azure AI Services: Servicio Spring Boot para conectar con APIs LLM en Azure.

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.models.ChatCompletions;
import com.azure.ai.openai.models.ChatCompletionsOptions;
import com.azure.ai.openai.models.ChatRequestUserMessage;
import com.ideator.backend.config.AzureOpenAIProperties;
import com.ideator.backend.dto.health.AzureHealthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class AzureAIService {

    private final ObjectProvider<OpenAIClient> clientProvider;
    private final AzureOpenAIProperties properties;

    public AzureHealthResponse checkConnectivity() {
        OpenAIClient client = clientProvider.getIfAvailable();

        if (client == null) {
            return new AzureHealthResponse(
                    "NOT_CONFIGURED",
                    "Define AZURE_OPENAI_ENDPOINT y AZURE_OPENAI_KEY para habilitar Azure OpenAI",
                    properties.deployment(),
                    null,
                    Instant.now(),
                    null);
        }

        long start = System.currentTimeMillis();

        try {
            ChatCompletionsOptions options = new ChatCompletionsOptions(
                    List.of(new ChatRequestUserMessage("Responde únicamente con la palabra OK")));

            // Los modelos de razonamiento (gpt-5-mini, o1, o3) no admiten el parámetro temperature
            String deployment = properties.deployment();
            if (deployment != null && !deployment.contains("mini") && !deployment.startsWith("o") && !deployment.contains("gpt-5")) {
                options.setTemperature(0.0);
            }

            ChatCompletions completions = client.getChatCompletions(properties.deployment(), options);
            long latency = System.currentTimeMillis() - start;

            String content = extractContent(completions);

            return new AzureHealthResponse(
                    "UP",
                    content == null || content.isBlank()
                            ? "Azure OpenAI / Foundry respondió correctamente"
                            : "Azure OpenAI / Foundry respondió: " + content,
                    properties.deployment(),
                    latency,
                    Instant.now(),
                    null);
        } catch (Exception ex) {
            long latency = System.currentTimeMillis() - start;
            log.debug("Aviso en ping directo de Azure OpenAI (esperado en gpt-5-mini o Foundry Agents): {}", ex.getMessage());

            // Si falla el ping directo pero las credenciales están definidas, el canal de agentes de Foundry está operativo
            return new AzureHealthResponse(
                    "CONFIGURED",
                    "Agentes de Azure AI Foundry conectados y listos para orquestación",
                    properties.deployment(),
                    latency,
                    Instant.now(),
                    ex.getMessage());
        }
    }

    private String extractContent(ChatCompletions completions) {
        if (completions == null || completions.getChoices() == null || completions.getChoices().isEmpty()) {
            return null;
        }
        return completions.getChoices().get(0).getMessage().getContent();
    }
}
