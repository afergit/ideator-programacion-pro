// SCRUM-72: Service that builds the technical architecture justification and deployment strategy.
package com.ideator.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * SCRUM-72 – ArchitectureSpecService
 *
 * Generates a textual justification of the chosen technology stack (Spring Boot 3,
 * React/TypeScript, PostgreSQL, Docker, Azure OpenAI) and outlines a containerised
 * deployment strategy (Docker Compose + Azure Container Instances).
 *
 * In a real‑world scenario this would probably be templated and stored in a
 * dedicated table, but for the purpose of the sprint we return a plain JSON with
 * two fields: `justification` and `deploymentPlan`.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ArchitectureSpecService {

    public String generateArchitectureSpec(Long projectId) {
        // Hard‑coded justification – adapt as needed for each project.
        String justification = "The stack combines Spring Boot 3 for a robust, type‑safe backend with JWT security, " +
                "React + TypeScript for a modern, component‑driven UI, PostgreSQL as a reliable relational " +
                "database, Docker for reproducible builds, and Azure OpenAI to provide AI‑assisted features. " +
                "This combination ensures rapid development, easy scaling, and maintainability.
                ";

        String deploymentPlan = "Docker Compose orchestrates the backend, frontend and PostgreSQL containers. " +
                "The backend image is built from the `backend` module, exposing port 8080. " +
                "The frontend is built with Vite and served via Nginx on port 80. " +
                "PostgreSQL runs with persisted volume `pgdata`. " +
                "For production, the compose file can be deployed to Azure Container Instances " +
                "or Azure Kubernetes Service. Environment variables for Azure OpenAI credentials are injected " +
                "through a `.env` file or Azure Key Vault.
                ";

        // Return a simple JSON (in production use a proper DTO/mapper).
        return "{\"justification\": \"" + justification.replace("\"", "\\\"") + \", \"deploymentPlan\": \"" + deploymentPlan.replace("\"", "\\\"") + "\"}";
    }
}
