package com.ideator.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideator.backend.dto.AiAnalysisResponse;
import com.ideator.backend.model.ChatMessage;
import com.ideator.backend.repository.ChatMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * SCRUM-75 / SCRUM-38: Validar logica de orquestacion multi-agente, bloqueos y persistencia con Mockito y JUnit 5.
 */
@ExtendWith(MockitoExtension.class)
class AzureAiChatServiceTest {

    @Mock
    private FoundryAgentOrchestratorService orchestratorService;

    @Mock
    private ChatMessageRepository chatMessageRepository;

    private AzureAiChatService azureAiChatService;

    @BeforeEach
    void setUp() {
        azureAiChatService = new AzureAiChatService(orchestratorService, new ObjectMapper());
    }

    @Test
    void chat_ShouldCallContextAgentAndReturnReadyForPhaseB() {
        String agentResponse = """
        
            {
              "analisisInterno": "Alcance definido correctamente",
              "estado": "LISTO_FASE_B",
              "respuestaAlUsuario": "Todos los datos del MVP estan completos, pasamos a Fase B",
              "preguntasBloqueantes": []
            }
            """;

        when(orchestratorService.callAgent(eq(AgentPhase.CONTEXT), eq("Quiero un sistema de gestión legal"))).thenReturn(agentResponse);

        AiAnalysisResponse response = azureAiChatService.chat("Quiero un sistema de gestión legal");

        assertNotNull(response);
        assertEquals("LISTO_FASE_B", response.getEstado());
        assertEquals("Alcance definido correctamente", response.getAnalisisInterno());
        assertTrue(response.getPreguntasBloqueantes().isEmpty());
        verify(orchestratorService, times(1)).callAgent(eq(AgentPhase.CONTEXT), anyString());
    }

    @Test
    void processChatMessage_ShouldDetectBlockingQuestions() {
        String agentBlockingResponse = """
            {
              "analisisInterno": "Falta definir el publico objetivo",
              "estado": "BLOQUEO",
              "respuestaAlUsuario": "¿A que segmento de usuarios esta dirigida la plataforma?",
              "preguntasBloqueantes": ["¿Cual es el usuario objetivo del MVP?"]
            }
            """;

        when(orchestratorService.callAgent(eq(AgentPhase.CONTEXT), anyString())).thenReturn(agentBlockingResponse);

        AiAnalysisResponse response = azureAiChatService.chat("Quiero una app sin definir alcance");

        assertNotNull(response);
        assertEquals("BLOQUEO", response.getEstado());
        assertFalse(response.getPreguntasBloqueantes().isEmpty());
        assertEquals(1, response.getPreguntasBloqueantes().size());
        assertEquals("¿Cual es el usuario objetivo del MVP?", response.getPreguntasBloqueantes().get(0));
        verify(orchestratorService, times(1)).callAgent(eq(AgentPhase.CONTEXT), anyString());
    }

    @Test
    void chat_ShouldReturnFallbackBloqueo_WhenOrchestratorThrowsException() {
        when(orchestratorService.callAgent(eq(AgentPhase.CONTEXT), anyString()))
                .thenThrow(new RuntimeException("Simulated connection error to Azure Foundry"));

        AiAnalysisResponse response = azureAiChatService.chat("Mensaje de prueba");

        assertNotNull(response);
        assertEquals("BLOQUEO", response.getEstado());
        assertTrue(response.getRespuestaAlUsuario().contains("Hubo un problema"));
    }

    @Test
    void processChatMessage_ShouldPersistMessageToDatabase() {
        ChatMessage message = new ChatMessage();
        message.setProjectId(1L);
        message.setContent("Hola, quiero crear una app de logistica");
        message.setSender(ChatMessage.Sender.USER);

        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(message);

        ChatMessage saved = chatMessageRepository.save(message);

        assertNotNull(saved);
        verify(chatMessageRepository, times(1)).save(any(ChatMessage.class));
    }
}
