package com.ideator.backend.web;
// SCRUM-27 CRUD de Proyectos: Endpoints REST y vistas básicas en React para crear y listar proyectos privados, validando acceso por token JWT.
// Epic: Épica 1

import com.ideator.backend.dto.project.ProjectRequest;
import com.ideator.backend.dto.project.ProjectResponse;
import com.ideator.backend.security.UserPrincipal;
import com.ideator.backend.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public List<ProjectResponse> list(@AuthenticationPrincipal UserPrincipal principal) {
        return projectService.listForUser(principal.getId());
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@PathVariable UUID id,
                               @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.findById(id, principal.getId());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectResponse create(@Valid @RequestBody ProjectRequest request,
                                  @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.create(principal.getId(), request);
    }

    @PutMapping("/{id}")
    public ProjectResponse update(@PathVariable UUID id,
                                  @Valid @RequestBody ProjectRequest request,
                                  @AuthenticationPrincipal UserPrincipal principal) {
        return projectService.update(id, principal.getId(), request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id,
                       @AuthenticationPrincipal UserPrincipal principal) {
        projectService.delete(id, principal.getId());
    }
}
