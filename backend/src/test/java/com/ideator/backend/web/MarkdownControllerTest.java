package com.ideator.backend.web;

import com.ideator.backend.service.MarkdownGeneratorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MarkdownControllerTest {

    @Mock
    private MarkdownGeneratorService markdownGeneratorService;

    @InjectMocks
    private MarkdownController markdownController;

    @BeforeEach
    void setUp() {
    }

    @Test
    void getProductSpecification_ShouldReturn200WithUtf8AttachmentHeaders() {
        Long projectId = 1L;
        String mockContent = "# Especificación del Producto\nContenido UTF-8: áéíóú ñ";
        when(markdownGeneratorService.generateProductSpecification(projectId)).thenReturn(mockContent);

        ResponseEntity<String> response = markdownController.getProductSpecification(projectId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockContent, response.getBody());

        // Verificar cabecera Content-Disposition
        assertEquals("attachment; filename=\"Especificacion_Producto.md\"",
                response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));

        // Verificar cabecera Content-Type UTF-8
        String contentType = response.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE);
        assertNotNull(contentType);
        assertTrue(contentType.contains("text/markdown"));
        assertTrue(contentType.toUpperCase().contains("UTF-8"));

        verify(markdownGeneratorService, times(1)).generateProductSpecification(projectId);
    }

    @Test
    void getArchitectureSpecification_ShouldReturn200WithUtf8AttachmentHeaders() {
        Long projectId = 1L;
        String mockContent = "# Arquitectura Definitiva\nContenido UTF-8: áéíóú ñ";
        when(markdownGeneratorService.generateArchitectureSpecification(projectId)).thenReturn(mockContent);

        ResponseEntity<String> response = markdownController.getArchitectureSpecification(projectId);

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(mockContent, response.getBody());

        // Verificar cabecera Content-Disposition
        assertEquals("attachment; filename=\"Arquitectura_Definitiva.md\"",
                response.getHeaders().getFirst(HttpHeaders.CONTENT_DISPOSITION));

        // Verificar cabecera Content-Type UTF-8
        String contentType = response.getHeaders().getFirst(HttpHeaders.CONTENT_TYPE);
        assertNotNull(contentType);
        assertTrue(contentType.contains("text/markdown"));
        assertTrue(contentType.toUpperCase().contains("UTF-8"));

        verify(markdownGeneratorService, times(1)).generateArchitectureSpecification(projectId);
    }
}
