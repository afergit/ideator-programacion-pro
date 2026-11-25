// SCRUM-70: Service that generates a list of REST endpoint specifications from the DB model.
package com.ideator.backend.service;

import com.ideator.backend.model.EndpointSpec;
import com.ideator.backend.repository.EndpointSpecRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * SCRUM-70 – ApiSpecService
 *
 * Genera especificaciones de endpoints REST a partir del modelo de datos, consumiendo
 * opcionalmente el agente especializado ideator-api-agent (fase API) en Microsoft Foundry
 * a través de {@link FoundryAgentOrchestratorService}.
 */
@Service
@Slf4j
public class ApiSpecService {

    private final EndpointSpecRepository endpointSpecRepository;
    private final FoundryAgentOrchestratorService orchestratorService;

    public ApiSpecService(EndpointSpecRepository endpointSpecRepository) {
        this(endpointSpecRepository, null);
    }

    @Autowired
    public ApiSpecService(EndpointSpecRepository endpointSpecRepository,
                          @Autowired(required = false) FoundryAgentOrchestratorService orchestratorService) {
        this.endpointSpecRepository = endpointSpecRepository;
        this.orchestratorService = orchestratorService;
    }

    /**
     * Genera especificaciones de endpoints para un proyecto dado y las guarda.
     *
     * @param projectId ID del proyecto
     * @return la lista de {@link EndpointSpec} generada
     */
    public List<EndpointSpec> generateApiSpec(Long projectId) {
        if (orchestratorService != null) {
            try {
                log.info("Consultando ideator-api-agent en Foundry para proyecto {}", projectId);
                orchestratorService.callAgent(AgentPhase.API, "{\"projectId\": " + projectId + "}");
            } catch (Exception e) {
                log.warn("Fallo o fallback al consultar ideator-api-agent: {}", e.getMessage());
            }
        }

        List<EndpointSpec> specs = new ArrayList<>();
        // Ejemplo de CRUD para una entidad "Project"
        specs.add(createSpec(projectId, "GET", "/api/v1/projects", null, "ProjectResponse[]", "[200,401,403,500]"));
        specs.add(createSpec(projectId, "POST", "/api/v1/projects", "ProjectRequest", "ProjectResponse", "[201,400,401,403,500]"));
        specs.add(createSpec(projectId, "GET", "/api/v1/projects/{id}", null, "ProjectResponse", "[200,401,403,404,500]"));
        specs.add(createSpec(projectId, "PUT", "/api/v1/projects/{id}", "ProjectRequest", "ProjectResponse", "[200,400,401,403,404,500]"));
        specs.add(createSpec(projectId, "DELETE", "/api/v1/projects/{id}", null, null, "[204,401,403,404,500]"));
        // Persistir
        endpointSpecRepository.saveAll(specs);
        log.info("Generated {} API specs for project {}", specs.size(), projectId);
        return specs;
    }

    private EndpointSpec createSpec(Long projectId, String method, String path, String requestBody, String responseBody, String statusCodes) {
        EndpointSpec spec = new EndpointSpec();
        spec.setProjectId(projectId);
        spec.setHttpMethod(method);
        spec.setPath(path);
        spec.setRequestBody(requestBody);
        spec.setResponseBody(responseBody);
        spec.setStatusCodes(statusCodes);
        return spec;
    }
}
