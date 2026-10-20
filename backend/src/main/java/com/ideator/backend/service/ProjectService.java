package com.ideator.backend.service;

import com.ideator.backend.domain.Project;
import com.ideator.backend.domain.ProjectMember;
import com.ideator.backend.domain.User;
import com.ideator.backend.domain.enums.AccessLevel;
import com.ideator.backend.domain.enums.ProjectStatus;
import com.ideator.backend.dto.project.ProjectRequest;
import com.ideator.backend.dto.project.ProjectResponse;
import com.ideator.backend.exception.ApiException;
import com.ideator.backend.repository.ProjectMemberRepository;
import com.ideator.backend.repository.ProjectRepository;
import com.ideator.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ProjectResponse> listForUser(UUID userId) {
        Map<UUID, Project> projects = new LinkedHashMap<>();

        projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(userId)
                .forEach(project -> projects.put(project.getId(), project));
        projectRepository.findAllByMemberId(userId)
                .forEach(project -> projects.putIfAbsent(project.getId(), project));

        return projects.values().stream()
                .map(project -> ProjectResponse.from(project, resolveAccess(project, userId)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse findById(UUID projectId, UUID userId) {
        Project project = findVisibleProject(projectId, userId);
        return ProjectResponse.from(project, resolveAccess(project, userId));
    }

    @Transactional
    public ProjectResponse create(UUID userId, ProjectRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));

        Project project = new Project();
        project.setName(request.name().trim());
        project.setDescription(normalizeDescription(request.description()));
        project.setOwner(owner);
        project.setStatus(request.status() != null ? request.status() : ProjectStatus.DRAFT);
        project.addMember(new ProjectMember(project, owner, AccessLevel.OWNER));

        Project saved = projectRepository.save(project);
        return ProjectResponse.from(saved, AccessLevel.OWNER);
    }

    @Transactional
    public ProjectResponse update(UUID projectId, UUID userId, ProjectRequest request) {
        Project project = findVisibleProject(projectId, userId);
        AccessLevel accessLevel = resolveAccess(project, userId);

        if (!accessLevel.canEdit()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Tu nivel de acceso no permite editar este proyecto");
        }

        project.setName(request.name().trim());
        project.setDescription(normalizeDescription(request.description()));
        if (request.status() != null) {
            project.setStatus(request.status());
        }

        Project saved = projectRepository.saveAndFlush(project);
        return ProjectResponse.from(saved, accessLevel);
    }

    @Transactional
    public void delete(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Proyecto no encontrado"));

        if (!project.getOwner().getId().equals(userId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Solo el propietario puede eliminar el proyecto");
        }

        projectRepository.delete(project);
    }

    private Project findVisibleProject(UUID projectId, UUID userId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Proyecto no encontrado"));

        if (project.getOwner().getId().equals(userId)) {
            return project;
        }

        projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.FORBIDDEN, "No tienes acceso a este proyecto"));

        return project;
    }

    private AccessLevel resolveAccess(Project project, UUID userId) {
        if (project.getOwner().getId().equals(userId)) {
            return AccessLevel.OWNER;
        }

        return projectMemberRepository.findByProjectIdAndUserId(project.getId(), userId)
                .map(ProjectMember::getAccessLevel)
                .orElse(AccessLevel.VIEWER);
    }

    private String normalizeDescription(String description) {
        return description == null || description.isBlank() ? null : description.trim();
    }
}
