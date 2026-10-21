// SCRUM-70: Entity representing a REST endpoint specification.
package com.ideator.backend.model;

import jakarta.persistence.*;
import java.util.UUID;

/**
 * SCRUM-70 – EndpointSpec
 *
 * Represents a concrete REST endpoint generated from the database model.
 */
@Entity
@Table(name = "endpoint_spec")
public class EndpointSpec {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private Long projectId;

    @Column(nullable = false)
    private String httpMethod; // GET, POST, PUT, DELETE, etc.

    @Column(nullable = false)
    private String path; // e.g. "/api/v1/projects/{id}/tasks"

    @Column(columnDefinition = "TEXT")
    private String requestBody; // JSON schema for request body (optional)

    @Column(columnDefinition = "TEXT")
    private String responseBody; // JSON schema for response body

    @Column(columnDefinition = "TEXT")
    private String statusCodes; // JSON array of allowed status codes

    // Getters y Setters
    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Long getProjectId() { return projectId; }
    public void setProjectId(Long projectId) { this.projectId = projectId; }
    public String getHttpMethod() { return httpMethod; }
    public void setHttpMethod(String httpMethod) { this.httpMethod = httpMethod; }
    public String getPath() { return path; }
    public void setPath(String path) { this.path = path; }
    public String getRequestBody() { return requestBody; }
    public void setRequestBody(String requestBody) { this.requestBody = requestBody; }
    public String getResponseBody() { return responseBody; }
    public void setResponseBody(String responseBody) { this.responseBody = responseBody; }
    public String getStatusCodes() { return statusCodes; }
    public void setStatusCodes(String statusCodes) { this.statusCodes = statusCodes; }
}
