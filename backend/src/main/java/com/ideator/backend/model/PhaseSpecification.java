package com.ideator.backend.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

/**
 * Entidad para persistir en PostgreSQL las especificaciones generadas
 * por los agentes de las fases (SECURITY, QA, FINOPS, etc.).
 */
@Entity
@Table(name = "phase_specifications", indexes = {
        @Index(name = "idx_phase_spec_project_type", columnList = "projectId, phaseType")
})
@Getter
@Setter
@NoArgsConstructor
public class PhaseSpecification {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private Long projectId;

    @Column(nullable = false, length = 32)
    private String phaseType; // SECURITY, QA, FINOPS, ARCHITECTURE, UI, DB

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(nullable = false)
    private Instant updatedAt = Instant.now();

    public PhaseSpecification(Long projectId, String phaseType, String content) {
        this.projectId = projectId;
        this.phaseType = phaseType;
        this.content = content;
        this.updatedAt = Instant.now();
    }
}
