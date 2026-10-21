package com.ideator.backend.web;

import com.ideator.backend.dto.health.AzureHealthResponse;
import com.ideator.backend.dto.health.HealthResponse;
import com.ideator.backend.service.AzureAIService;
import com.ideator.backend.service.HealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthController {

    private final HealthService healthService;
    private final AzureAIService azureAIService;

    @GetMapping
    public HealthResponse health() {
        return healthService.check();
    }

    @GetMapping("/azure")
    public AzureHealthResponse azureHealth() {
        return azureAIService.checkConnectivity();
    }
}
