package com.ideator.backend.repository;

import com.ideator.backend.domain.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface ProjectRepository extends JpaRepository<Project, UUID> {

    List<Project> findAllByOwnerIdOrderByCreatedAtDesc(UUID ownerId);

    @Query("""
            select pm.project
            from ProjectMember pm
            where pm.user.id = :userId
            order by pm.project.createdAt desc
            """)
    List<Project> findAllByMemberId(@Param("userId") UUID userId);
}
