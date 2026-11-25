package com.ideator.backend.service;

import com.ideator.backend.model.PhaseSpecification;
import com.ideator.backend.repository.PhaseSpecificationRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Instant;

/**
 * Fase H – FinOps & Costos Cloud
 * Consume ideator-finops-agent en Microsoft Azure AI Foundry y persiste
 * la estimación mensual de infraestructura en USD y recomendaciones de ahorro.
 */
@Service
@Slf4j
public class FinopsSpecService {

    private final FoundryAgentOrchestratorService orchestratorService;
    private final PhaseSpecificationRepository repository;

    public FinopsSpecService() {
        this(null, null);
    }

    @Autowired
    public FinopsSpecService(
            @Autowired(required = false) FoundryAgentOrchestratorService orchestratorService,
            @Autowired(required = false) PhaseSpecificationRepository repository) {
        this.orchestratorService = orchestratorService;
        this.repository = repository;
    }

    public String generateFinopsSpec(Long projectId, String prompt) {
        String result = null;
        if (orchestratorService != null) {
            try {
                String payload = (prompt != null && !prompt.isBlank())
                        ? prompt
                        : "{\"projectId\": " + projectId + ", \"phase\": \"FINOPS\"}";
                result = orchestratorService.callAgent(AgentPhase.FINOPS, payload);
            } catch (Exception e) {
                log.warn("Fallo o fallback al consultar ideator-finops-agent: {}", e.getMessage());
            }
        }

        if (result == null || result.isBlank() || !result.trim().startsWith("{")) {
            result = getFallbackFinopsJson();
        }

        persistSpec(projectId, result);
        return result;
    }

    public String getFinopsSpec(Long projectId) {
        if (repository != null) {
            return repository.findByProjectIdAndPhaseType(projectId, "FINOPS")
                    .map(PhaseSpecification::getContent)
                    .orElseGet(() -> generateFinopsSpec(projectId, null));
        }
        return getFallbackFinopsJson();
    }

    private void persistSpec(Long projectId, String content) {
        if (repository != null) {
            try {
                PhaseSpecification spec = repository.findByProjectIdAndPhaseType(projectId, "FINOPS")
                        .orElse(new PhaseSpecification(projectId, "FINOPS", content));
                spec.setContent(content);
                spec.setUpdatedAt(Instant.now());
                repository.save(spec);
            } catch (Exception e) {
                log.warn("No se pudo persistir PhaseSpecification (FINOPS) para proyecto {}: {}", projectId, e.getMessage());
            }
        }
    }

    private String getFallbackFinopsJson() {
        return """
        {
          "monthlyBudgetTotalUsd": 84.50,
          "monthlyBudgetUsd": 84.50,
          "currency": "USD",
          "costBreakdown": [
            {
              "service": "Azure Container Apps (Backend + Frontend)",
              "tier": "Serverless Consumption",
              "monthlyCostUsd": 35.00,
              "estimatedCostUsd": 35.00,
              "description": "0.5 vCPU, 1 GB RAM por réplica con escala a cero réplicas en inactividad nocturna.",
              "details": "0.5 vCPU, 1 GB RAM por réplica con escala a cero réplicas en inactividad nocturna."
            },
            {
              "service": "Azure Database for PostgreSQL (Flexible Server B1ms)",
              "tier": "Burstable B1ms",
              "monthlyCostUsd": 25.50,
              "estimatedCostUsd": 25.50,
              "description": "1 vCPU, 2 GB RAM, 32 GB SSD y retención de backups automáticos de 7 días.",
              "details": "1 vCPU, 2 GB RAM, 32 GB SSD y retención de backups automáticos de 7 días."
            },
            {
              "service": "Azure AI Foundry / OpenAI (GPT-4o / gpt-5-mini)",
              "tier": "Pay-as-you-go",
              "monthlyCostUsd": 18.00,
              "estimatedCostUsd": 18.00,
              "description": "Consumo estimado de 500k tokens de entrada y 150k de salida en ciclo de ideación.",
              "details": "Consumo estimado de 500k tokens de entrada y 150k de salida en ciclo de ideación."
            },
            {
              "service": "Azure Key Vault & Red Egress",
              "tier": "Standard",
              "monthlyCostUsd": 6.00,
              "estimatedCostUsd": 6.00,
              "description": "Operaciones criptográficas de certificados y transferencia de datos estándar.",
              "details": "Operaciones criptográficas de certificados y transferencia de datos estándar."
            }
          ],
          "recommendations": [
            "Habilitar auto-scale a cero instancias en entornos de desarrollo fuera de horario comercial (-30% de costo de cómputo).",
            "Aprovechar Azure OpenAI Prompt Caching para reducir hasta 50% el costo de tokens en fases iterativas.",
            "Configurar alertas en Microsoft Cost Management al alcanzar el 80% y 100% del umbral mensual."
          ],
          "optimizationRecommendations": [
            "Habilitar auto-scale a cero instancias en entornos de desarrollo fuera de horario comercial (-30% de costo de cómputo).",
            "Aprovechar Azure OpenAI Prompt Caching para reducir hasta 50% el costo de tokens en fases iterativas.",
            "Configurar alertas en Microsoft Cost Management al alcanzar el 80% y 100% del umbral mensual."
          ]
        }
        """.trim();
    }
}
