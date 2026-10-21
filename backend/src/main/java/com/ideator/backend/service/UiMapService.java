// SCRUM-71: Service that builds a JSON navigation map of the UI (screens, components, mockup placeholders).
package com.ideator.backend.service;

import com.ideator.backend.service.AzureAiChatService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * SCRUM-71 – UiMapService
 *
 * Calls Azure OpenAI with a System Prompt that outputs a JSON representing the
 * navigation hierarchy of the application (screens, components, links to mockups).
 * The result can be consumed by a frontend viewer.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UiMapService {

    private final AzureAiChatService azureAiChatService;

    /**
     * Generates a UI map for the given project.
     *
     * @param projectId the project identifier
     * @return JSON string with the UI map (or empty JSON on error)
     */
    public String generateUiMap(Long projectId) {
        String prompt = "You are a strict system that must output a JSON representing the UI navigation map for a project with ID " + projectId + ". " +
                "The JSON must contain an array called 'screens', each with 'name', 'components' (array of component names), and optionally a 'mockupUrl'. No extra text.
                "
                ;
        try {
            // Re‑use AzureAiChatService – we pass the prompt as the user message.
            return azureAiChatService.chat(prompt).getRespuestaAlUsuario();
        } catch (Exception e) {
            log.error("Error generating UI map", e);
            return "{}";
        }
    }
}
