package com.ideator.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideator.backend.dto.ScreenSpecDto;
import com.ideator.backend.dto.UiMapDto;
import com.ideator.backend.model.PhaseSpecification;
import com.ideator.backend.repository.PhaseSpecificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UiMapServiceTest {

    @Mock
    private FoundryAgentOrchestratorService orchestratorService;

    @Mock
    private PhaseSpecificationRepository repository;

    private UiMapService uiMapService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        uiMapService = new UiMapService(orchestratorService, repository);
    }

    @Test
    void generateUiMap_ShouldReturnFallbackWithWireframeHtml_WhenOrchestratorThrowsException() throws Exception {
        Long projectId = 10L;
        when(orchestratorService.callAgent(eq(AgentPhase.UI), any())).thenThrow(new RuntimeException("Azure offline"));

        String jsonResult = uiMapService.generateUiMap(projectId);

        assertNotNull(jsonResult);
        UiMapDto dto = objectMapper.readValue(jsonResult, UiMapDto.class);
        assertNotNull(dto);
        assertFalse(dto.getScreens().isEmpty());
        assertNotNull(dto.getWireframeHtml());
        assertTrue(dto.getWireframeHtml().contains("<iframe") || dto.getWireframeHtml().contains("Mockup Visual Interactivo") || dto.getWireframeHtml().contains("<!DOCTYPE html>"));

        // Verify saved in repository
        ArgumentCaptor<PhaseSpecification> captor = ArgumentCaptor.forClass(PhaseSpecification.class);
        verify(repository).save(captor.capture());
        assertEquals(projectId, captor.getValue().getProjectId());
        assertEquals("UI", captor.getValue().getPhaseType());
        assertTrue(captor.getValue().getContent().contains("wireframeHtml"));
    }

    @Test
    void generateUiMap_ShouldParseAgentResponseAndPreserveWireframeHtml() throws Exception {
        Long projectId = 20L;
        String customHtml = "<!DOCTYPE html><html><body><h1>Custom Agent Wireframe</h1></body></html>";
        String agentJson = """
        {
          "screens": [
            {
              "name": "Custom Dashboard",
              "components": ["Header", "Graph"],
              "mockupUrl": "https://mockup.internal/1"
            }
          ],
          "wireframeHtml": "%s"
        }
        """.formatted(customHtml).trim();

        when(orchestratorService.callAgent(eq(AgentPhase.UI), any())).thenReturn(agentJson);

        String jsonResult = uiMapService.generateUiMap(projectId, "Generar UI custom");

        assertNotNull(jsonResult);
        UiMapDto dto = objectMapper.readValue(jsonResult, UiMapDto.class);
        assertEquals(1, dto.getScreens().size());
        assertEquals("Custom Dashboard", dto.getScreens().get(0).getName());
        assertEquals(customHtml, dto.getWireframeHtml());

        verify(repository).save(any(PhaseSpecification.class));
    }

    @Test
    void getUiMap_ShouldReturnPersistedUiMapFromRepository() {
        Long projectId = 30L;
        String persistedJson = "{\"screens\":[{\"name\":\"Persisted View\"}],\"wireframeHtml\":\"<div>Persisted</div>\"}";
        PhaseSpecification existingSpec = new PhaseSpecification(projectId, "UI", persistedJson);

        when(repository.findByProjectIdAndPhaseType(projectId, "UI")).thenReturn(Optional.of(existingSpec));

        String result = uiMapService.getUiMap(projectId);

        assertEquals(persistedJson, result);
        verify(orchestratorService, never()).callAgent(any(AgentPhase.class), any());
    }

    @Test
    void serializationAndDeserialization_ShouldWorkSeamlessly() throws Exception {
        UiMapDto original = UiMapDto.builder()
                .screens(List.of(
                        ScreenSpecDto.builder()
                                .name("Pantalla Test")
                                .components(List.of("Comp1", "Comp2"))
                                .build()
                ))
                .wireframeHtml("<!DOCTYPE html><html><body>Test</body></html>")
                .build();

        String serialized = uiMapService.serializeDto(original);
        UiMapDto deserialized = objectMapper.readValue(serialized, UiMapDto.class);

        assertEquals(original.getScreens().size(), deserialized.getScreens().size());
        assertEquals(original.getScreens().get(0).getName(), deserialized.getScreens().get(0).getName());
        assertEquals(original.getWireframeHtml(), deserialized.getWireframeHtml());
    }
}
