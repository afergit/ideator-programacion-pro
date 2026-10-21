package com.ideator.backend.dto.health;

public record DatabaseHealth(
        String status,
        String detail
) {
}
