package com.ideator.backend.dto.health;

public record AzureStatus(
        String status,
        String deployment
) {
}
