// SCRUM-37: LegisApp Benchmark Test - corrección de paquete e integración.
package com.ideator.backend.service;

import com.ideator.backend.service.MarkdownGeneratorService;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * SCRUM-37 – LegisAppBenchmarkTest
 *
 * Prueba de integración que verifica que el {@link MarkdownGeneratorService}
 * es capaz de compilar toda la especificación del proyecto (fases A‑E) sin
 * generar valores nulos ni secciones vacías.
 */
@SpringBootTest
public class LegisAppBenchmarkTest {

    @Autowired
    private MarkdownGeneratorService markdownGeneratorService;

    @Test
    public void testGenerateFullSpecification() {
        // Usamos un proyecto de ejemplo con ID 1 (debe existir en la BD de prueba)
        Long projectId = 1L;
        String productSpec = markdownGeneratorService.generateProductSpecification(projectId);
        String archSpec = markdownGeneratorService.generateArchitectureSpecification(projectId);

        // Verificaciones básicas de contenido
        Assertions.assertNotNull(productSpec, "Product specification should not be null");
        Assertions.assertTrue(productSpec.contains("# Especificación del Producto"), "Header missing");
        Assertions.assertTrue(productSpec.contains("## Problema y Contexto"), "Phase A section missing");
        Assertions.assertTrue(productSpec.contains("## Modelo Físico de Base de Datos"), "Phase B section missing");
        Assertions.assertTrue(productSpec.contains("## Endpoints REST"), "Phase C section missing");
        Assertions.assertTrue(productSpec.contains("## Mapa Conceptual de Interfaces"), "Phase D section missing");

        Assertions.assertNotNull(archSpec, "Architecture specification should not be null");
        Assertions.assertTrue(archSpec.contains("# Arquitectura Definitiva"), "Header missing");
        Assertions.assertTrue(archSpec.contains("## Justificación Técnica"), "Justification missing");
        Assertions.assertTrue(archSpec.contains("## Configuración Docker"), "Docker config missing");
    }
}
