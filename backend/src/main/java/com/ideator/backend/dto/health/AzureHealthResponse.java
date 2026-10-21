package com.ideator.backend.dto.health;

import java.time.Instant;

public record AzureHealthResponse(
        String status,
        String detail,
        String deployment,
        Long latencyMs,
        Instant checkedAt,
        String error
) {
}
