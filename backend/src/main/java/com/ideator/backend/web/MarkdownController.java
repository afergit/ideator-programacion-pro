package com.ideator.backend.web;

import com.ideator.backend.service.MarkdownGeneratorService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * SCRUM-73: Exponer generación de documentación final vía API REST.
 * Proporciona endpoints para descargar Especificacion_Producto.md y Arquitectura_Definitiva.md.
 */
@RestController
@RequestMapping("/api/v1/projects")
public class MarkdownController {

    private final MarkdownGeneratorService markdownGeneratorService;

    public MarkdownController(MarkdownGeneratorService markdownGeneratorService) {
        this.markdownGeneratorService = markdownGeneratorService;
    }

    private Long parseProjectId(String projectId) {
        try {
            return Long.parseLong(projectId);
        } catch (NumberFormatException e) {
            return (long) Math.abs(projectId.hashCode());
        }
    }

    @GetMapping("/{projectId}/markdown/product")
    public ResponseEntity<String> getProductSpecification(@PathVariable String projectId) {
        Long id = parseProjectId(projectId);
        String markdownContent = markdownGeneratorService.generateProductSpecification(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Especificacion_Producto.md\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/markdown; charset=UTF-8")
                .contentType(MediaType.parseMediaType("text/markdown; charset=UTF-8"))
                .body(markdownContent);
    }

    public ResponseEntity<String> getProductSpecification(Long projectId) {
        return getProductSpecification(String.valueOf(projectId));
    }

    @GetMapping("/{projectId}/markdown/architecture")
    public ResponseEntity<String> getArchitectureSpecification(@PathVariable String projectId) {
        Long id = parseProjectId(projectId);
        String markdownContent = markdownGeneratorService.generateArchitectureSpecification(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"Arquitectura_Definitiva.md\"")
                .header(HttpHeaders.CONTENT_TYPE, "text/markdown; charset=UTF-8")
                .contentType(MediaType.parseMediaType("text/markdown; charset=UTF-8"))
                .body(markdownContent);
    }

    public ResponseEntity<String> getArchitectureSpecification(Long projectId) {
        return getArchitectureSpecification(String.valueOf(projectId));
    }
}
