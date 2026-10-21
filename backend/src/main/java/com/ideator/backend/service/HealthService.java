package com.ideator.backend.service;

import com.azure.ai.openai.OpenAIClient;
import com.ideator.backend.config.AzureOpenAIProperties;
import com.ideator.backend.dto.health.AzureStatus;
import com.ideator.backend.dto.health.DatabaseHealth;
import com.ideator.backend.dto.health.HealthResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class HealthService {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectProvider<OpenAIClient> azureClientProvider;
    private final AzureOpenAIProperties azureProperties;

    public HealthResponse check() {
        DatabaseHealth database = checkDatabase();

        boolean azureConfigured = azureClientProvider.getIfAvailable() != null && azureProperties.isConfigured();
        AzureStatus azure = new AzureStatus(
                azureConfigured ? "CONFIGURED" : "NOT_CONFIGURED",
                azureProperties.deployment()
        );

        String status = "UP".equals(database.status()) ? "UP" : "DOWN";

        return new HealthResponse(status, "ideator-api", Instant.now(), database, azure);
    }

    private DatabaseHealth checkDatabase() {
        try {
            jdbcTemplate.queryForObject("select 1", Integer.class);
            return new DatabaseHealth("UP", "Conexión a PostgreSQL establecida");
        } catch (Exception ex) {
            return new DatabaseHealth("DOWN", ex.getClass().getSimpleName() + ": " + ex.getMessage());
        }
    }
}
