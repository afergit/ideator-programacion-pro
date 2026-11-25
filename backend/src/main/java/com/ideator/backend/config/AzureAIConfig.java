package com.ideator.backend.config;

import com.azure.ai.openai.OpenAIClient;
import com.azure.ai.openai.OpenAIClientBuilder;
import com.azure.core.credential.AzureKeyCredential;
import com.azure.identity.DefaultAzureCredentialBuilder;
import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.SecretClientBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

@Configuration
@EnableConfigurationProperties({AzureOpenAIProperties.class, AzureFoundryProperties.class})
@Slf4j
public class AzureAIConfig {

    @Value("${azure.keyvault.uri:}")
    private String keyVaultUri;

    @Bean
    @ConditionalOnMissingBean
    public RestTemplate restTemplate() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(30000);
        factory.setReadTimeout(90000);
        return new RestTemplate(factory);
    }

    @Bean
    @ConditionalOnMissingBean
    public SecretClient secretClient() {
        if (StringUtils.hasText(keyVaultUri)) {
            try {
                return new SecretClientBuilder()
                        .vaultUrl(keyVaultUri)
                        .credential(new DefaultAzureCredentialBuilder().build())
                        .buildClient();
            } catch (Exception e) {
                log.warn("No se pudo inicializar SecretClient para Key Vault en {}: {}", keyVaultUri, e.getMessage());
            }
        }
        return null;
    }

    @Bean
    @Conditional(AzureOpenAIConfiguredCondition.class)
    public OpenAIClient openAIClient(AzureOpenAIProperties properties,
                                     @Autowired(required = false) SecretClient secretClient) {
        String apiKey = properties.apiKey();
        if ((!StringUtils.hasText(apiKey)) && secretClient != null) {
            try {
                apiKey = secretClient.getSecret("AzureOpenAiKey").getValue();
                log.info("Clave AzureOpenAiKey obtenida exitosamente desde Azure Key Vault");
            } catch (Exception e) {
                log.warn("No se pudo obtener el secreto 'AzureOpenAiKey' de Azure Key Vault: {}", e.getMessage());
            }
        }

        if (!StringUtils.hasText(apiKey)) {
            log.warn("Azure OpenAI no inicializado: no se configuró 'azure.openai.api-key' ni se pudo obtener desde Key Vault.");
            return null;
        }

        String endpoint = properties.endpoint();
        if (endpoint != null && endpoint.endsWith("/openai/v1")) {
            endpoint = endpoint.substring(0, endpoint.length() - "/openai/v1".length());
        } else if (endpoint != null && endpoint.endsWith("/openai/v1/")) {
            endpoint = endpoint.substring(0, endpoint.length() - "/openai/v1/".length());
        }

        log.info("Azure OpenAI configurado para el endpoint {} (deployment: {})",
                endpoint, properties.deployment());

        return new OpenAIClientBuilder()
                .endpoint(endpoint)
                .credential(new AzureKeyCredential(apiKey))
                .buildClient();
    }

    static class AzureOpenAIConfiguredCondition implements Condition {
        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            String endpoint = context.getEnvironment().getProperty("azure.openai.endpoint");
            String apiKey = context.getEnvironment().getProperty("azure.openai.api-key");
            String keyVaultUri = context.getEnvironment().getProperty("azure.keyvault.uri");
            return StringUtils.hasText(endpoint) && (StringUtils.hasText(apiKey) || StringUtils.hasText(keyVaultUri));
        }
    }
}
