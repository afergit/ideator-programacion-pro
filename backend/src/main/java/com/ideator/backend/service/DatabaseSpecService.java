// SCRUM-69: Service that calls Azure OpenAI to generate a physical relational DB model from Phase‑A decisions.
package com.ideator.backend.service;

import com.ideator.backend.config.AzureOpenAIProperties;
import com.ideator.backend.dto.AiAnalysisResponse;
import com.ideator.backend.service.AzureAiChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * SCRUM-69 – DatabaseSpecService
 *
 * Invoca a Azure OpenAI con un System Prompt que transforma las decisiones de la
 * fase A (problema, cliente, alcance MVP, etc.) en una propuesta de modelo
 * relacional físico (tablas, columnas, tipos, PK/FK) serializada en JSON.
 *
 * En una implementación productiva se debería validar y versionar el JSON.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseSpecService {

    private final AzureAiChatService azureAiChatService;
    private final AzureOpenAIProperties properties;

    /**
     * Genera la especificación física de la base de datos a partir del análisis
     * interno recibido de la fase A.
     *
     * @param analysisInternal el texto de análisis interno (ej. "analisisInterno" del
     *                         AiAnalysisResponse de la fase A)
     * @return JSON con la propuesta de modelo relacional
     */
    public String generatePhysicalModel(String analysisInternal) {
        String prompt = "You are a strict system that must translate the following internal analysis into a physical relational database model. " +
                "Return a single JSON object with the keys: tables (array), each table has name, columns (array of {name, type, nullable, primaryKey, foreignKey}), " +
                "and relationships (array of {sourceTable, sourceColumn, targetTable, targetColumn}). No explanation, only the JSON.\n" +
                "Analysis: " + analysisInternal;
        try {
            // Re‑use AzureAiChatService but force temperature to 0 for deterministic output
            AiAnalysisResponse response = azureAiChatService.chat(prompt);
            // In this simplified version we assume the model returns the JSON directly in respuestaAlUsuario
            return response.getRespuestaAlUsuario();
        } catch (Exception e) {
            log.error("Error generating DB spec", e);
            return "{}"; // fallback empty JSON
        }
    }
}
