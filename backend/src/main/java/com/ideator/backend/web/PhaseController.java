package com.ideator.backend.web;

import com.ideator.backend.dto.AiAnalysisResponse;
import com.ideator.backend.dto.ChatRequestDto;
import com.ideator.backend.model.EndpointSpec;
import com.ideator.backend.repository.EndpointSpecRepository;
import com.ideator.backend.service.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/v1/projects/{projectId}")
@RequiredArgsConstructor
@Slf4j
public class PhaseController {

    private final AzureAiChatService azureAiChatService;
    private final DatabaseSpecService databaseSpecService;
    private final ApiSpecService apiSpecService;
    private final UiMapService uiMapService;
    private final ArchitectureSpecService architectureSpecService;
    private final SecuritySpecService securitySpecService;
    private final QaSpecService qaSpecService;
    private final FinopsSpecService finopsSpecService;
    private final FoundryAgentOrchestratorService orchestratorService;
    private final EndpointSpecRepository endpointSpecRepository;

    private Long parseProjectId(String projectId) {
        try {
            return Long.parseLong(projectId);
        } catch (NumberFormatException e) {
            return (long) Math.abs(projectId.hashCode());
        }
    }

    // Phase B: DB Spec
    @GetMapping("/db-spec")
    public ResponseEntity<String> getDbSpec(@PathVariable String projectId) {
        String spec = databaseSpecService.generatePhysicalModel("Análisis para proyecto " + projectId);
        return ResponseEntity.ok(spec);
    }

    @PostMapping("/db-spec")
    public ResponseEntity<String> generateDbSpec(
            @PathVariable String projectId,
            @RequestBody(required = false) Map<String, Object> body) {
        String prompt = body != null && body.containsKey("prompt")
                ? String.valueOf(body.get("prompt"))
                : "Generar modelo de base de datos para proyecto " + projectId;
        String spec = databaseSpecService.generatePhysicalModel(prompt);
        return ResponseEntity.ok(spec);
    }

    // Phase C: API Spec
    @GetMapping("/api-spec")
    public ResponseEntity<List<EndpointSpec>> getApiSpec(@PathVariable String projectId) {
        Long id = parseProjectId(projectId);
        List<EndpointSpec> existing = endpointSpecRepository.findByProjectId(id);
        if (existing.isEmpty()) {
            existing = apiSpecService.generateApiSpec(id);
        }
        return ResponseEntity.ok(existing);
    }

    @PostMapping("/api-spec")
    public ResponseEntity<List<EndpointSpec>> generateApiSpec(
            @PathVariable String projectId,
            @RequestBody(required = false) List<EndpointSpec> manualSpecs) {
        Long id = parseProjectId(projectId);
        if (manualSpecs != null && !manualSpecs.isEmpty()) {
            for (EndpointSpec s : manualSpecs) {
                s.setProjectId(id);
            }
            return ResponseEntity.ok(endpointSpecRepository.saveAll(manualSpecs));
        }
        return ResponseEntity.ok(apiSpecService.generateApiSpec(id));
    }

    // Phase D: UI Map
    @GetMapping("/ui-map")
    public ResponseEntity<String> getUiMap(@PathVariable String projectId) {
        Long id = parseProjectId(projectId);
        return ResponseEntity.ok(uiMapService.getUiMap(id));
    }

    @PostMapping("/ui-map")
    public ResponseEntity<String> generateUiMap(
            @PathVariable String projectId,
            @RequestBody(required = false) Map<String, Object> body) {
        Long id = parseProjectId(projectId);
        String prompt = body != null && body.containsKey("prompt")
                ? String.valueOf(body.get("prompt"))
                : "";
        return ResponseEntity.ok(uiMapService.generateUiMap(id, prompt));
    }

    // Phase E: Security Spec
    @GetMapping("/security-spec")
    public ResponseEntity<String> getSecuritySpec(@PathVariable String projectId) {
        Long id = parseProjectId(projectId);
        return ResponseEntity.ok(securitySpecService.getSecuritySpec(id));
    }

    @PostMapping("/security-spec")
    public ResponseEntity<String> generateSecuritySpec(
            @PathVariable String projectId,
            @RequestBody(required = false) Map<String, Object> body) {
        Long id = parseProjectId(projectId);
        String prompt = body != null && body.containsKey("prompt")
                ? String.valueOf(body.get("prompt"))
                : "";
        return ResponseEntity.ok(securitySpecService.generateSecuritySpec(id, prompt));
    }

    // Phase F: QA Spec
    @GetMapping("/qa-spec")
    public ResponseEntity<String> getQaSpec(@PathVariable String projectId) {
        Long id = parseProjectId(projectId);
        return ResponseEntity.ok(qaSpecService.getQaSpec(id));
    }

    @PostMapping("/qa-spec")
    public ResponseEntity<String> generateQaSpec(
            @PathVariable String projectId,
            @RequestBody(required = false) Map<String, Object> body) {
        Long id = parseProjectId(projectId);
        String prompt = body != null && body.containsKey("prompt")
                ? String.valueOf(body.get("prompt"))
                : "";
        return ResponseEntity.ok(qaSpecService.generateQaSpec(id, prompt));
    }

    // Phase G: Architecture Spec
    @GetMapping("/architecture")
    public ResponseEntity<String> getArchitecture(@PathVariable String projectId) {
        Long id = parseProjectId(projectId);
        return ResponseEntity.ok(architectureSpecService.generateArchitectureSpec(id));
    }

    @PostMapping("/architecture")
    public ResponseEntity<String> generateArchitecture(
            @PathVariable String projectId,
            @RequestBody(required = false) Map<String, Object> body) {
        Long id = parseProjectId(projectId);
        String prompt = body != null && body.containsKey("prompt")
                ? String.valueOf(body.get("prompt"))
                : "";
        if (!prompt.isBlank() && orchestratorService != null) {
            try {
                String res = orchestratorService.callAgent(AgentPhase.ARCHITECTURE, prompt);
                return ResponseEntity.ok(res);
            } catch (Exception e) {
                log.warn("Fallback to architectureSpecService: {}", e.getMessage());
            }
        }
        return ResponseEntity.ok(architectureSpecService.generateArchitectureSpec(id));
    }

    // Phase H: FinOps Spec
    @GetMapping("/finops-spec")
    public ResponseEntity<String> getFinopsSpec(@PathVariable String projectId) {
        Long id = parseProjectId(projectId);
        return ResponseEntity.ok(finopsSpecService.getFinopsSpec(id));
    }

    @PostMapping("/finops-spec")
    public ResponseEntity<String> generateFinopsSpec(
            @PathVariable String projectId,
            @RequestBody(required = false) Map<String, Object> body) {
        Long id = parseProjectId(projectId);
        String prompt = body != null && body.containsKey("prompt")
                ? String.valueOf(body.get("prompt"))
                : "";
        return ResponseEntity.ok(finopsSpecService.generateFinopsSpec(id, prompt));
    }

    // Generic Phase Trigger Endpoint: POST /api/v1/projects/{projectId}/phases/{phase}
    @PostMapping("/phases/{phase}")
    public ResponseEntity<?> executePhase(
            @PathVariable String projectId,
            @PathVariable String phase,
            @RequestBody(required = false) ChatRequestDto request) {
        Long id = parseProjectId(projectId);
        String prompt = (request != null && request.getContent() != null) ? request.getContent() : "";

        switch (phase.toLowerCase()) {
            case "a":
            case "context":
                AiAnalysisResponse respA = azureAiChatService.chat(prompt.isBlank() ? "Contexto inicial de proyecto" : prompt);
                return ResponseEntity.ok(respA);

            case "b":
            case "db":
                String dbResult = databaseSpecService.generatePhysicalModel(prompt.isBlank() ? "Modelo de datos del proyecto" : prompt);
                return ResponseEntity.ok(Map.of("phase", "B", "result", dbResult));

            case "c":
            case "api":
                if (!prompt.isBlank() && orchestratorService != null) {
                    try {
                        String res = orchestratorService.callAgent(AgentPhase.API, prompt);
                        return ResponseEntity.ok(Map.of("phase", "C", "result", res));
                    } catch (Exception ignored) {}
                }
                List<EndpointSpec> apiSpecs = apiSpecService.generateApiSpec(id);
                return ResponseEntity.ok(Map.of("phase", "C", "result", apiSpecs));

            case "d":
            case "ui":
                String uiResult = uiMapService.generateUiMap(id, prompt);
                return ResponseEntity.ok(Map.of("phase", "D", "result", uiResult));

            case "e":
            case "security":
            case "sec":
                String secResult = securitySpecService.generateSecuritySpec(id, prompt);
                return ResponseEntity.ok(Map.of("phase", "E", "result", secResult));

            case "f":
            case "qa":
            case "testing":
                String qaResult = qaSpecService.generateQaSpec(id, prompt);
                return ResponseEntity.ok(Map.of("phase", "F", "result", qaResult));

            case "g":
            case "architecture":
            case "arch":
                if (!prompt.isBlank() && orchestratorService != null) {
                    try {
                        String res = orchestratorService.callAgent(AgentPhase.ARCHITECTURE, prompt);
                        return ResponseEntity.ok(Map.of("phase", "G", "result", res));
                    } catch (Exception ignored) {}
                }
                String archResult = architectureSpecService.generateArchitectureSpec(id);
                return ResponseEntity.ok(Map.of("phase", "G", "result", archResult));

            case "h":
            case "finops":
                String finopsResult = finopsSpecService.generateFinopsSpec(id, prompt);
                return ResponseEntity.ok(Map.of("phase", "H", "result", finopsResult));

            default:
                return ResponseEntity.badRequest().body(Map.of("error", "Fase desconocida: " + phase));
        }
    }
}
