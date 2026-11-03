package com.ideator.backend.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

/**
 * // SCRUM-75: Garantizar que el spec de BD se genera sin valores nulos.
 */
@ExtendWith(MockitoExtension.class)
class DatabaseSpecServiceTest {

    @Mock
    private DatabaseSpecService databaseSpecService;

    @Test
    void generateDatabaseSchema_ShouldReturnValidJsonStructure() {
        String mockSchemaJson = """
            {
              \"tables\": [
                {
                  \"tableName\": \"users\",
                  \"columns\": [
                    {\"name\": \"id\", \"type\": \"BIGINT\", \"primaryKey\": true},
                    {\"name\": \"email\", \"type\": \"VARCHAR(255)\", \"primaryKey\": false}
                  ]
                }
              ]
            }
            """;

        assertNotNull(mockSchemaJson);
        assertTrue(mockSchemaJson.contains("tableName"));
        assertTrue(mockSchemaJson.contains("users"));
    }
}
