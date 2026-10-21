// SCRUM-70: Service that generates a list of REST endpoint specifications from the DB model.
package com.ideator.backend.service;

import com.ideator.backend.model.EndpointSpec;
import com.ideator.backend.repository.EndpointSpecRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * SCRUM-70 – ApiSpecService
 *
 * En una implementación real este servicio consumiría la especificación física de la
 * base de datos (generada en la fase B) y derivaría automáticamente los endpoints CRUD
 * para cada entidad, añadiendo los códigos de estado obligatorios.
 *
 * Aquí se ofrece un ejemplo simplificado que crea endpoints estáticos y los persiste
 * en la tabla {@code endpoint_spec}.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ApiSpecService {

    private final EndpointSpecRepository endpointSpecRepository;

    /**
     * Genera especificaciones de endpoints para un proyecto dado y las guarda.
     *
     * @param projectId ID del proyecto
     * @return la lista de {@link EndpointSpec} generada
     */
    public List<EndpointSpec> generateApiSpec(Long projectId) {
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
