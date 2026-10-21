package com.ideator.backend.dto.project;

import com.ideator.backend.domain.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProjectRequest(
        @NotBlank(message = "El nombre del proyecto es obligatorio")
        @Size(max = 160, message = "El nombre no puede superar los 160 caracteres")
        String name,

        @Size(max = 4000, message = "La descripción no puede superar los 4000 caracteres")
        String description,

        ProjectStatus status
) {
}
