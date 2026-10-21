package com.ideator.backend.config;

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.OpenAIClientBuilder;
import com.azure.core.credential.AzureKeyCredential;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;

@Configuration
@EnableConfigurationProperties(AzureOpenAIProperties.class)
@Slf4j
public class AzureAIConfig {

    @Bean
    @Conditional(AzureOpenAIConfiguredCondition.class)
    public OpenAIClient openAIClient(AzureOpenAIProperties properties) {
        log.info("Azure OpenAI configurado para el endpoint {} (deployment: {})",
                properties.endpoint(), properties.deployment());

        return new OpenAIClientBuilder()
                .endpoint(properties.endpoint())
                .credential(new AzureKeyCredential(properties.apiKey()))
                .buildClient();
    }

    static class AzureOpenAIConfiguredCondition implements Condition {
        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            String endpoint = context.getEnvironment().getProperty("azure.openai.endpoint");
            String apiKey = context.getEnvironment().getProperty("azure.openai.api-key");
            return StringUtils.hasText(endpoint) && StringUtils.hasText(apiKey);
        }
    }
}
