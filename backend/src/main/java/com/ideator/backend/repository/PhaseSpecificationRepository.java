package com.ideator.backend.repository;

import com.ideator.backend.model.PhaseSpecification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PhaseSpecificationRepository extends JpaRepository<PhaseSpecification, UUID> {
    Optional<PhaseSpecification> findByProjectIdAndPhaseType(Long projectId, String phaseType);
}
