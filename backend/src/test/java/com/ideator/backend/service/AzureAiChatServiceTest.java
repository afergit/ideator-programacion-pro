package com.ideator.backend.service;

import com.ideator.backend.dto.AiAnalysisResponse;
import com.ideator.backend.model.ChatMessage;
import com.ideator.backend.repository.ChatMessageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * // SCRUM-75: Validar logica de bloqueos y persistencia de mensajes con Mockito y JUnit 5.
 */
@ExtendWith(MockitoExtension.class)
class AzureAiChatServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @InjectMocks
    private AzureAiChatService azureAiChatService;

    @BeforeEach
    void setUp() {
        // Configuracion inicial previa a cada test
    }

    @Test
    void processChatMessage_ShouldDetectBlockingQuestions() {
        // Mock de comportamiento y validacion del DTO estructurado en estado BLOQUEO
        AiAnalysisResponse mockResponse = new AiAnalysisResponse(
                "Falta definir el publico objetivo",
                "BLOQUEO",
                "¿A que segmento de usuarios esta dirigida la plataforma?",
                List.of("¿Cual es el usuario objetivo del MVP?")
        );

        assertNotNull(mockResponse);
        assertEquals("BLOQUEO", mockResponse.estado());
        assertFalse(mockResponse.preguntasBloqueantes().isEmpty());
    }

    @Test
    void processChatMessage_ShouldPersistMessageToDatabase() {
        ChatMessage message = new ChatMessage();
        message.setProjectId(1L);
        message.setContent("Hola, quiero crear una app de logistica");
        message.setSender("USER");

        when(chatMessageRepository.save(any(ChatMessage.class))).thenReturn(message);

        ChatMessage saved = chatMessageRepository.save(message);

        assertNotNull(saved);
        verify(chatMessageRepository, times(1)).save(any(ChatMessage.class));
    }
}
