package com.ideator.backend.dto.project;

import com.ideator.backend.domain.Project;
import com.ideator.backend.domain.enums.AccessLevel;
import com.ideator.backend.domain.enums.ProjectStatus;

import java.time.Instant;
import java.util.UUID;

public record ProjectResponse(
        UUID id,
        String name,
        String description,
        UUID ownerId,
        String ownerName,
        ProjectStatus status,
        Instant createdAt,
        Instant updatedAt,
        AccessLevel accessLevel
) {
    public static ProjectResponse from(Project project, AccessLevel accessLevel) {
        return new ProjectResponse(
                project.getId(),
                project.getName(),
                project.getDescription(),
                project.getOwner().getId(),
                project.getOwner().getName(),
                project.getStatus(),
                project.getCreatedAt(),
                project.getUpdatedAt(),
                accessLevel
        );
    }
}
