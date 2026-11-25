package com.ideator.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

/**
 * SCRUM-75 / SCRUM-38: Garantizar que el spec de BD se genera sin valores nulos consumiendo ideator-db-agent.
 */
@ExtendWith(MockitoExtension.class)
class DatabaseSpecServiceTest {

    @Mock
    private FoundryAgentOrchestratorService orchestratorService;

    @InjectMocks
    private DatabaseSpecService databaseSpecService;

    @Test
    void generateDatabaseSchema_ShouldReturnValidJsonStructure() {
        String mockSchemaJson = """
            {
              "tables": [
                {
                  "tableName": "users",
                  "columns": [
                    {"name": "id", "type": "BIGINT", "primaryKey": true},
                    {"name": "email", "type": "VARCHAR(255)", "primaryKey": false}
                  ]
                }
              ]
            }
            """;

        when(orchestratorService.callAgent(eq(AgentPhase.DB), anyString())).thenReturn(mockSchemaJson);

        String result = databaseSpecService.generatePhysicalModel("Análisis de Fase A");

        assertNotNull(result);
        assertTrue(result.contains("tableName"));
        assertTrue(result.contains("users"));
        verify(orchestratorService, times(1)).callAgent(eq(AgentPhase.DB), anyString());
    }

    @Test
    void generatePhysicalModel_ShouldReturnFallback_WhenAgentFails() {
        when(orchestratorService.callAgent(eq(AgentPhase.DB), anyString()))
                .thenThrow(new RuntimeException("Foundry unavailable"));

        String result = databaseSpecService.generatePhysicalModel("Análisis");

        assertNotNull(result);
        assertTrue(result.contains("tables"));
        assertTrue(result.contains("erdSvg"));
    }
}
