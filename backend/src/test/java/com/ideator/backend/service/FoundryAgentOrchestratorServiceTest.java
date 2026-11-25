package com.ideator.backend.service;

import com.azure.security.keyvault.secrets.SecretClient;
import com.azure.security.keyvault.secrets.models.KeyVaultSecret;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ideator.backend.config.AzureFoundryProperties;
import com.ideator.backend.config.AzureOpenAIProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestTemplate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FoundryAgentOrchestratorServiceTest {

    @Mock
    private SecretClient secretClient;

    @Mock
    private RestTemplate restTemplate;

    private AzureFoundryProperties properties;
    private AzureOpenAIProperties openAIProperties;
    private ObjectMapper objectMapper;
    private FoundryAgentOrchestratorService service;

    @BeforeEach
    void setUp() {
        properties = new AzureFoundryProperties();
        properties.setProjectEndpoint("https://ideator-colque-resource.services.ai.azure.com/api/projects/ideator-colque");
        properties.setApiVersion("2025-05-15-preview");

        AzureFoundryProperties.Agents agents = new AzureFoundryProperties.Agents();
        agents.setContext("ideator-context-agent");
        agents.setDb("ideator-db-agent");
        agents.setApi("ideator-api-agent");
        agents.setUi("ideator-ui-agent");
        agents.setSecurity("ideator-sec-agent");
        agents.setQa("ideator-qa-agent");
        agents.setArchitecture("ideator-arch-agent");
        agents.setFinops("ideator-finops-agent");
        properties.setAgents(agents);

        openAIProperties = new AzureOpenAIProperties("https://test.openai.azure.com", "fallback-key", "gpt-4o");
        objectMapper = new ObjectMapper();

        service = new FoundryAgentOrchestratorService(properties, secretClient, openAIProperties, restTemplate, objectMapper);
    }

    @Test
    void buildEndpointUrl_ShouldConstructDynamicUrlForAllPhases() {
        assertEquals(
                "https://ideator-colque-resource.services.ai.azure.com/api/projects/ideator-colque/agents/ideator-context-agent/endpoint/protocols/openai/responses?api-version=2025-05-15-preview",
                service.buildEndpointUrl(AgentPhase.CONTEXT)
        );
        assertEquals(
                "https://ideator-colque-resource.services.ai.azure.com/api/projects/ideator-colque/agents/ideator-db-agent/endpoint/protocols/openai/responses?api-version=2025-05-15-preview",
                service.buildEndpointUrl(AgentPhase.DB)
        );
        assertEquals(
                "https://ideator-colque-resource.services.ai.azure.com/api/projects/ideator-colque/agents/ideator-api-agent/endpoint/protocols/openai/responses?api-version=2025-05-15-preview",
                service.buildEndpointUrl(AgentPhase.API)
        );
        assertEquals(
                "https://ideator-colque-resource.services.ai.azure.com/api/projects/ideator-colque/agents/ideator-ui-agent/endpoint/protocols/openai/responses?api-version=2025-05-15-preview",
                service.buildEndpointUrl(AgentPhase.UI)
        );
        assertEquals(
                "https://ideator-colque-resource.services.ai.azure.com/api/projects/ideator-colque/agents/ideator-sec-agent/endpoint/protocols/openai/responses?api-version=2025-05-15-preview",
                service.buildEndpointUrl(AgentPhase.SECURITY)
        );
        assertEquals(
                "https://ideator-colque-resource.services.ai.azure.com/api/projects/ideator-colque/agents/ideator-qa-agent/endpoint/protocols/openai/responses?api-version=2025-05-15-preview",
                service.buildEndpointUrl(AgentPhase.QA)
        );
        assertEquals(
                "https://ideator-colque-resource.services.ai.azure.com/api/projects/ideator-colque/agents/ideator-arch-agent/endpoint/protocols/openai/responses?api-version=2025-05-15-preview",
                service.buildEndpointUrl(AgentPhase.ARCHITECTURE)
        );
        assertEquals(
                "https://ideator-colque-resource.services.ai.azure.com/api/projects/ideator-colque/agents/ideator-finops-agent/endpoint/protocols/openai/responses?api-version=2025-05-15-preview",
                service.buildEndpointUrl(AgentPhase.FINOPS)
        );
    }

    @Test
    void resolveApiKey_ShouldFetchSecretFromKeyVault() {
        KeyVaultSecret mockSecret = mock(KeyVaultSecret.class);
        when(mockSecret.getValue()).thenReturn("vault-secret-token-xyz");
        when(secretClient.getSecret("AzureOpenAiKey")).thenReturn(mockSecret);

        String key = service.resolveApiKey();

        assertEquals("vault-secret-token-xyz", key);
        verify(secretClient, times(1)).getSecret("AzureOpenAiKey");
    }

    @Test
    void callAgent_ShouldAuthenticateWithApiKeyAndBearerAndExtractResponsesApiOutput() {
        KeyVaultSecret mockSecret = mock(KeyVaultSecret.class);
        when(mockSecret.getValue()).thenReturn("test-secret-key");
        when(secretClient.getSecret("AzureOpenAiKey")).thenReturn(mockSecret);

        String responsesApiJson = """
            {
              "id": "resp-12345",
              "output": [
                {
                  "type": "message",
                  "content": [
                    {
                      "type": "output_text",
                      "text": "{\\"analisisInterno\\": \\"OK\\", \\"estado\\": \\"LISTO_FASE_B\\"}"
                    }
                  ]
                }
              ]
            }
            """;

        when(restTemplate.exchange(anyString(), eq(HttpMethod.POST), any(HttpEntity.class), eq(String.class)))
                .thenReturn(new ResponseEntity<>(responsesApiJson, HttpStatus.OK));

        String result = service.callAgent(AgentPhase.CONTEXT, "Quiero crear un MVP de ecommerce");

        assertEquals("{\"analisisInterno\": \"OK\", \"estado\": \"LISTO_FASE_B\"}", result);

        ArgumentCaptor<HttpEntity<String>> entityCaptor = ArgumentCaptor.forClass(HttpEntity.class);
        verify(restTemplate, times(1)).exchange(
                eq("https://ideator-colque-resource.services.ai.azure.com/api/projects/ideator-colque/agents/ideator-context-agent/endpoint/protocols/openai/responses?api-version=2025-05-15-preview"),
                eq(HttpMethod.POST),
                entityCaptor.capture(),
                eq(String.class)
        );

        HttpEntity<String> capturedEntity = entityCaptor.getValue();
        assertEquals("test-secret-key", capturedEntity.getHeaders().getFirst("api-key"));
        assertEquals("Bearer test-secret-key", capturedEntity.getHeaders().getFirst("Authorization"));
    }

    @Test
    void extractGeneratedContent_ShouldSupportChatCompletionsFormat() {
        String chatCompletionsJson = """
            {
              "choices": [
                {
                  "message": {
                    "content": "Contenido generado por modelo legacy"
                  }
                }
              ]
            }
            """;

        String extracted = service.extractGeneratedContent(chatCompletionsJson);
        assertEquals("Contenido generado por modelo legacy", extracted);
    }
}
