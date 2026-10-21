package com.ideator.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.util.StringUtils;

@ConfigurationProperties(prefix = "azure.openai")
public record AzureOpenAIProperties(
        String endpoint,
        String apiKey,
        String deployment
) {
    public boolean isConfigured() {
        return StringUtils.hasText(endpoint)
                && StringUtils.hasText(apiKey)
                && StringUtils.hasText(deployment);
    }
}
