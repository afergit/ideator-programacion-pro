package com.ideator.backend.service;

import com.ideator.backend.model.PhaseSpecification;
import com.ideator.backend.repository.PhaseSpecificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Fase F – QA & Testing
 * Consume ideator-qa-agent en Microsoft Azure AI Foundry y persiste
 * la estrategia de pruebas, casos de prueba y metas de cobertura en PostgreSQL.
 */
@Service
@Slf4j
public class QaSpecService {

    private final FoundryAgentOrchestratorService orchestratorService;
    private final PhaseSpecificationRepository repository;

    public QaSpecService() {
        this(null, null);
    }

    @Autowired
    public QaSpecService(
            @Autowired(required = false) FoundryAgentOrchestratorService orchestratorService,
            @Autowired(required = false) PhaseSpecificationRepository repository) {
        this.orchestratorService = orchestratorService;
        this.repository = repository;
    }

    public String generateQaSpec(Long projectId, String prompt) {
        String result = null;
        if (orchestratorService != null) {
            try {
                String payload = (prompt != null && !prompt.isBlank())
                        ? prompt
                        : "{\"projectId\": " + projectId + ", \"phase\": \"QA\"}";
                result = orchestratorService.callAgent(AgentPhase.QA, payload);
            } catch (Exception e) {
                log.warn("Fallo o fallback al consultar ideator-qa-agent: {}", e.getMessage());
            }
        }

        if (result == null || result.isBlank() || !result.trim().startsWith("{")) {
            result = getFallbackQaJson();
        }

        persistSpec(projectId, result);
        return result;
    }

    public String getQaSpec(Long projectId) {
        if (repository != null) {
            return repository.findByProjectIdAndPhaseType(projectId, "QA")
                    .map(PhaseSpecification::getContent)
                    .orElseGet(() -> generateQaSpec(projectId, null));
        }
        return getFallbackQaJson();
    }

    private void persistSpec(Long projectId, String content) {
        if (repository != null) {
            try {
                PhaseSpecification spec = repository.findByProjectIdAndPhaseType(projectId, "QA")
                        .orElse(new PhaseSpecification(projectId, "QA", content));
                spec.setContent(content);
                spec.setUpdatedAt(Instant.now());
                repository.save(spec);
            } catch (Exception e) {
                log.warn("No se pudo persistir PhaseSpecification (QA) para proyecto {}: {}", projectId, e.getMessage());
            }
        }
    }

    private String getFallbackQaJson() {
        return """
        {
          "testingPyramid": "Pirámide de pruebas automatizada: 70% Unitarias (JUnit 5 + Mockito), 20% Integración (SpringBootTest + H2) y 10% E2E de contratos REST.",
          "strategy": "Pirámide de pruebas automatizada: 70% Unitarias (JUnit 5 + Mockito), 20% Integración (SpringBootTest + H2) y 10% E2E de contratos REST.",
          "coverageTarget": "Mínimo 80% de cobertura en servicios y lógica de negocio crítica.",
          "testCases": [
            {
              "id": "TC-001",
              "name": "Autenticación JWT con credenciales válidas",
              "type": "INTEGRATION",
              "expectedResult": "Código HTTP 200 con token JWT no nulo y claims de acceso validados."
            },
            {
              "id": "TC-002",
              "name": "Control de acceso a proyectos privados ajenos",
              "type": "INTEGRATION",
              "expectedResult": "Código HTTP 403 Forbidden o 404 Not Found para usuarios sin membresía."
            },
            {
              "id": "TC-003",
              "name": "Generación y descarga de archivos Markdown de especificación",
              "type": "E2E",
              "expectedResult": "Respuesta con Content-Disposition attachment y bytes UTF-8 válidos."
            },
            {
              "id": "TC-004",
              "name": "Tolerancia a fallos ante desconexión de Azure AI Foundry",
              "type": "UNIT",
              "expectedResult": "Retorno controlado de fallback JSON sin excepciones no controladas 500."
            }
          ]
        }
        """.trim();
    }
}
