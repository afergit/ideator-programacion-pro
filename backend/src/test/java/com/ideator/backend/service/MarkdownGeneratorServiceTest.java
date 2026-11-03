package com.ideator.backend.service;

import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.models.KeyVaultSecret;
import com.ideator.backend.model.ChatMessage;
import com.ideator.backend.model.EndpointSpec;
import com.ideator.backend.repository.ChatMessageRepository;
import com.ideator.backend.repository.EndpointSpecRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarkdownGeneratorServiceTest {

    @Mock
    private ChatMessageRepository chatMessageRepository;

    @Mock
    private EndpointSpecRepository endpointSpecRepository;

    @Mock
    private DatabaseSpecService databaseSpecService;

    @Mock
    private UiMapService uiMapService;

    @Mock
    private ArchitectureSpecService architectureSpecService;

    @Mock
    private SecretClient secretClient;

    private MarkdownGeneratorService service;

    @BeforeEach
    void setUp() {
        service = new MarkdownGeneratorService(
                chatMessageRepository,
                endpointSpecRepository,
                databaseSpecService,
                uiMapService,
                architectureSpecService,
                secretClient
        );
    }

    @Test
    void generateProductSpecification_ShouldContainAllPhaseSections() {
        Long projectId = 1L;

        ChatMessage msg = new ChatMessage();
        msg.setContent("Queremos un software para gestión de ideas y proyectos.");
        when(chatMessageRepository.findByProjectIdOrderByCreatedAtAsc(projectId)).thenReturn(List.of(msg));

        when(databaseSpecService.generatePhysicalModel(anyString())).thenReturn("{\"tables\": []}");

        EndpointSpec ep = new EndpointSpec();
        ep.setHttpMethod("GET");
        ep.setPath("/api/v1/projects");
        ep.setRequestBody(null);
        ep.setResponseBody("{\"projects\": []}");
        ep.setStatusCodes("200, 401");
        when(endpointSpecRepository.findByProjectId(projectId)).thenReturn(List.of(ep));

        when(uiMapService.generateUiMap(projectId)).thenReturn("{\"screens\": [\"Dashboard\"]}");

        String md = service.generateProductSpecification(projectId);

        assertNotNull(md);
        assertTrue(md.contains("# Especificación del Producto"));
        assertTrue(md.contains("## Problema y Contexto"));
        assertTrue(md.contains("Queremos un software para gestión de ideas"));
        assertTrue(md.contains("## Modelo Físico de Base de Datos"));
        assertTrue(md.contains("## Endpoints REST"));
        assertTrue(md.contains("| GET | /api/v1/projects |"));
        assertTrue(md.contains("## Mapa Conceptual de Interfaces"));
    }

    @Test
    void generateArchitectureSpecification_ShouldContainAllSectionsAndRetrieveSecret() {
        Long projectId = 1L;
        when(architectureSpecService.generateArchitectureSpec(projectId))
                .thenReturn("Stack basado en Spring Boot 3 y React.");

        KeyVaultSecret mockSecret = mock(KeyVaultSecret.class);
        when(mockSecret.getValue()).thenReturn("test-azure-key-12345");
        when(secretClient.getSecret("AzureOpenAiKey")).thenReturn(mockSecret);

        String arch = service.generateArchitectureSpecification(projectId);

        assertNotNull(arch);
        assertTrue(arch.contains("# Arquitectura Definitiva"));
        assertTrue(arch.contains("## Justificación Técnica"));
        assertTrue(arch.contains("## Diagrama de Arquitectura"));
        assertTrue(arch.contains("## Configuración Docker"));
        assertTrue(arch.contains("## Estrategia de Consumo de Azure AI"));
        assertTrue(arch.contains("Clave AzureOpenAiKey recuperada exitosamente desde Azure Key Vault."));
        verify(secretClient, times(1)).getSecret("AzureOpenAiKey");
    }

    @Test
    void retrieveAzureOpenAiKey_ShouldReturnKeyFromKeyVault() {
        KeyVaultSecret mockSecret = mock(KeyVaultSecret.class);
        when(mockSecret.getValue()).thenReturn("my-secret-key");
        when(secretClient.getSecret("AzureOpenAiKey")).thenReturn(mockSecret);

        String key = service.retrieveAzureOpenAiKey();

        assertEquals("my-secret-key", key);
        verify(secretClient, times(1)).getSecret("AzureOpenAiKey");
    }

    @Test
    void aliases_ShouldProduceIdenticalOutput() {
        Long projectId = 42L;
        when(architectureSpecService.generateArchitectureSpec(projectId)).thenReturn("Justificación");

        assertEquals(service.generateArchitectureSpecification(projectId), service.generateArchitectureSpec(projectId));
        assertEquals(service.generateProductSpecification(projectId), service.generateProductSpec(projectId));
    }
}
