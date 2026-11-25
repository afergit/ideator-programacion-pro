package com.ideator.backend.service;

import com.ideator.backend.model.PhaseSpecification;
import com.ideator.backend.repository.PhaseSpecificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Fase E – Ciberseguridad & AppSec
 * Consume ideator-sec-agent en Microsoft Azure AI Foundry y persiste
 * la matriz de controles OWASP Top 10 y estrategia de protección en PostgreSQL.
 */
@Service
@Slf4j
public class SecuritySpecService {

    private final FoundryAgentOrchestratorService orchestratorService;
    private final PhaseSpecificationRepository repository;

    public SecuritySpecService() {
        this(null, null);
    }

    @Autowired
    public SecuritySpecService(
            @Autowired(required = false) FoundryAgentOrchestratorService orchestratorService,
            @Autowired(required = false) PhaseSpecificationRepository repository) {
        this.orchestratorService = orchestratorService;
        this.repository = repository;
    }

    public String generateSecuritySpec(Long projectId, String prompt) {
        String result = null;
        if (orchestratorService != null) {
            try {
                String payload = (prompt != null && !prompt.isBlank())
                        ? prompt
                        : "{\"projectId\": " + projectId + ", \"phase\": \"SECURITY\"}";
                result = orchestratorService.callAgent(AgentPhase.SECURITY, payload);
            } catch (Exception e) {
                log.warn("Fallo o fallback al consultar ideator-sec-agent: {}", e.getMessage());
            }
        }

        if (result == null || result.isBlank() || !result.trim().startsWith("{")) {
            result = getFallbackSecurityJson();
        }

        persistSpec(projectId, result);
        return result;
    }

    public String getSecuritySpec(Long projectId) {
        if (repository != null) {
            return repository.findByProjectIdAndPhaseType(projectId, "SECURITY")
                    .map(PhaseSpecification::getContent)
                    .orElseGet(() -> generateSecuritySpec(projectId, null));
        }
        return getFallbackSecurityJson();
    }

    private void persistSpec(Long projectId, String content) {
        if (repository != null) {
            try {
                PhaseSpecification spec = repository.findByProjectIdAndPhaseType(projectId, "SECURITY")
                        .orElse(new PhaseSpecification(projectId, "SECURITY", content));
                spec.setContent(content);
                spec.setUpdatedAt(Instant.now());
                repository.save(spec);
            } catch (Exception e) {
                log.warn("No se pudo persistir PhaseSpecification (SECURITY) para proyecto {}: {}", projectId, e.getMessage());
            }
        }
    }

    private String getFallbackSecurityJson() {
        return """
        {
          "owaspTop10": [
            {
              "id": "A01",
              "title": "A01:2021 - Broken Access Control",
              "riskLevel": "CRITICAL",
              "category": "A01:2021 - Broken Access Control",
              "mitigation": "RBAC estricto en controladores con @PreAuthorize('hasRole(...)') y aislamiento de datos por usuario y proyecto a nivel JPA."
            },
            {
              "id": "A02",
              "title": "A02:2021 - Cryptographic Failures",
              "riskLevel": "HIGH",
              "category": "A02:2021 - Cryptographic Failures",
              "mitigation": "Cifrado TLS 1.3 en tránsito, passwords con BCrypt (coste 10) y almacenamiento seguro de API keys en Azure Key Vault."
            },
            {
              "id": "A03",
              "title": "A03:2021 - Injection",
              "riskLevel": "CRITICAL",
              "category": "A03:2021 - Injection",
              "mitigation": "Consultas parametrizadas obligatorias mediante Spring Data JPA / Hibernate, descartando concatenación directa de queries SQL."
            },
            {
              "id": "A07",
              "title": "A07:2021 - Identification & Authentication Failures",
              "riskLevel": "HIGH",
              "category": "A07:2021 - Identification & Authentication Failures",
              "mitigation": "Tokens JWT HMAC-SHA256 con expiración de 24h, rotación de secretos y logout mediante eliminación controlada en cliente."
            }
          ],
          "keyVaultStrategy": "Integración con Azure Key Vault (SecretClient) para desacoplar credenciales críticas de base de datos e IA del código fuente.",
          "dataProtection": "Cabeceras HTTP de protección activa (HSTS, Content-Security-Policy, X-Frame-Options) y sanitización estricta de payloads JSON."
        }
        """.trim();
    }
}
