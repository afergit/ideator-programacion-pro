package com.ideator.backend.dto.health;

import java.time.Instant;

public record HealthResponse(
        String status,
        String application,
        Instant timestamp,
        DatabaseHealth database,
        AzureStatus azure
) {
}
