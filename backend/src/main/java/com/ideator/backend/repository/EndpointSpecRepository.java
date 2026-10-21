// SCRUM-70: Repository for CRUD of EndpointSpec.
package com.ideator.backend.repository;

import com.ideator.backend.model.EndpointSpec;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface EndpointSpecRepository extends JpaRepository<EndpointSpec, UUID> {
    List<EndpointSpec> findByProjectId(Long projectId);
}
