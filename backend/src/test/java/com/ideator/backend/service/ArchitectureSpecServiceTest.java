package com.ideator.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArchitectureSpecServiceTest {

    @Mock
    private FoundryAgentOrchestratorService orchestratorService;

    private ArchitectureSpecService architectureSpecService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        architectureSpecService = new ArchitectureSpecService(orchestratorService, objectMapper);
    }

    @Test
    void generateArchitectureSpec_ShouldContainMermaidAndArchitectureSvg_WhenOffline() throws Exception {
        when(orchestratorService.callAgent(eq(AgentPhase.ARCHITECTURE), any()))
                .thenThrow(new RuntimeException("Foundry offline"));

        String json = architectureSpecService.generateArchitectureSpec(1L);

        assertNotNull(json);
        JsonNode root = objectMapper.readTree(json);
        assertTrue(root.has("justification"));
        assertTrue(root.has("deploymentPlan"));
        assertTrue(root.has("mermaidDiagram"));
        assertTrue(root.has("architectureSvg"));
        assertTrue(root.get("architectureSvg").asText().contains("<svg"));
        assertTrue(root.get("mermaidDiagram").asText().contains("flowchart TD"));
    }

    @Test
    void generateArchitectureSpec_ShouldEnrichWithSvg_WhenAgentReturnsPartialJson() throws Exception {
        String partialJson = "{\"justification\": \"Custom Stack\", \"deploymentPlan\": \"Docker Swarm\"}";
        when(orchestratorService.callAgent(eq(AgentPhase.ARCHITECTURE), any())).thenReturn(partialJson);

        String json = architectureSpecService.generateArchitectureSpec(2L);

        assertNotNull(json);
        JsonNode root = objectMapper.readTree(json);
        assertEquals("Custom Stack", root.get("justification").asText());
        assertEquals("Docker Swarm", root.get("deploymentPlan").asText());
        assertTrue(root.has("mermaidDiagram"));
        assertTrue(root.has("architectureSvg"));
        assertTrue(root.get("architectureSvg").asText().contains("<svg"));
    }
}
