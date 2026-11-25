import { api } from '../lib/api';
import type {
  AiAnalysisResponse,
  AzureHealthResponse,
  ChatMessageItem,
  DbSpec,
  EndpointSpec,
  UiMap,
  ArchitectureSpec,
  SecuritySpec,
  QaSpec,
  FinopsSpec,
} from '../types/phase';

export const phaseService = {
  /**
   * Diagnóstico de conectividad con Microsoft Azure AI Foundry / Azure OpenAI.
   */
  async checkAzureHealth(): Promise<AzureHealthResponse> {
    const response = await api.get<AzureHealthResponse>('/health/azure');
    return response.data;
  },

  /**
   * Fase A: Obtener historial persistido de mensajes en el chat del proyecto.
   */
  async getChatMessages(projectId: string): Promise<ChatMessageItem[]> {
    try {
      const response = await api.get<any[]>(`/v1/projects/${projectId}/chat`);
      if (!Array.isArray(response.data)) return [];
      return response.data.map((msg) => ({
        id: msg.id ? String(msg.id) : String(Date.now()),
        sender: msg.sender === 'USER' ? 'USER' : 'AI',
        content: msg.content || '',
        status: msg.status || '',
        timestamp: msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString() : new Date().toLocaleTimeString(),
      }));
    } catch {
      return [];
    }
  },

  /**
   * Fase A: Conversación de contexto e ideación MVP con ideator-context-agent.
   */
  async sendChatMessage(projectId: string, content: string): Promise<AiAnalysisResponse> {
    const response = await api.post<AiAnalysisResponse>(`/v1/projects/${projectId}/chat`, {
      content,
    });
    return response.data;
  },

  /**
   * Fase B: Obtener o generar especificación física de Base de Datos.
   */
  async getDbSpec(projectId: string): Promise<DbSpec> {
    const response = await api.get<string | DbSpec>(`/v1/projects/${projectId}/db-spec`);
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  async generateDbSpec(projectId: string, prompt?: string): Promise<DbSpec> {
    const response = await api.post<string | DbSpec>(`/v1/projects/${projectId}/db-spec`, {
      prompt: prompt || 'Generar modelo relacional optimizado para la base de datos',
    });
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  /**
   * Fase C: Obtener o generar especificación de Endpoints REST API.
   */
  async getApiSpec(projectId: string): Promise<EndpointSpec[]> {
    const response = await api.get<EndpointSpec[]>(`/v1/projects/${projectId}/api-spec`);
    return response.data;
  },

  async generateApiSpec(projectId: string, prompt?: string): Promise<EndpointSpec[]> {
    if (prompt) {
      const response = await api.post<{ phase: string; result: any }>(
        `/v1/projects/${projectId}/phases/c`,
        { content: prompt }
      );
      if (Array.isArray(response.data.result)) {
        return response.data.result;
      }
    }
    const response = await api.post<EndpointSpec[]>(`/v1/projects/${projectId}/api-spec`, []);
    return response.data;
  },

  async saveApiSpec(projectId: string, specs: EndpointSpec[]): Promise<EndpointSpec[]> {
    const response = await api.post<EndpointSpec[]>(`/v1/projects/${projectId}/api-spec`, specs);
    return response.data;
  },

  /**
   * Fase D: Obtener o generar mapa de navegación UI y pantallas.
   */
  async getUiMap(projectId: string): Promise<UiMap> {
    const response = await api.get<string | UiMap>(`/v1/projects/${projectId}/ui-map`);
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  async generateUiMap(projectId: string, prompt?: string): Promise<UiMap> {
    const response = await api.post<string | UiMap>(`/v1/projects/${projectId}/ui-map`, {
      prompt: prompt || 'Generar mapa de pantallas y componentes de interfaz de usuario',
    });
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  /**
   * Fase E: Obtener o generar especificación de Ciberseguridad (AppSec).
   */
  async getSecuritySpec(projectId: string): Promise<SecuritySpec> {
    const response = await api.get<string | SecuritySpec>(`/v1/projects/${projectId}/security-spec`);
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  async generateSecuritySpec(projectId: string, prompt?: string): Promise<SecuritySpec> {
    const response = await api.post<string | SecuritySpec>(`/v1/projects/${projectId}/security-spec`, {
      prompt: prompt || 'Generar especificación de seguridad OWASP y Azure Key Vault',
    });
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  /**
   * Fase F: Obtener o generar especificación de QA & Testing.
   */
  async getQaSpec(projectId: string): Promise<QaSpec> {
    const response = await api.get<string | QaSpec>(`/v1/projects/${projectId}/qa-spec`);
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  async generateQaSpec(projectId: string, prompt?: string): Promise<QaSpec> {
    const response = await api.post<string | QaSpec>(`/v1/projects/${projectId}/qa-spec`, {
      prompt: prompt || 'Generar plan de pruebas automatizadas y objetivos de cobertura',
    });
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  /**
   * Fase G: Obtener o generar especificación de arquitectura y despliegue Docker.
   */
  async getArchitectureSpec(projectId: string): Promise<ArchitectureSpec> {
    const response = await api.get<string | ArchitectureSpec>(`/v1/projects/${projectId}/architecture`);
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  async generateArchitectureSpec(projectId: string, prompt?: string): Promise<ArchitectureSpec> {
    const response = await api.post<string | ArchitectureSpec>(`/v1/projects/${projectId}/architecture`, {
      prompt: prompt || 'Generar justificación técnica y estrategia de despliegue Docker',
    });
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  /**
   * Fase H: Obtener o generar presupuesto y estimación FinOps Cloud.
   */
  async getFinopsSpec(projectId: string): Promise<FinopsSpec> {
    const response = await api.get<string | FinopsSpec>(`/v1/projects/${projectId}/finops-spec`);
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  async generateFinopsSpec(projectId: string, prompt?: string): Promise<FinopsSpec> {
    const response = await api.post<string | FinopsSpec>(`/v1/projects/${projectId}/finops-spec`, {
      prompt: prompt || 'Generar estimación de presupuesto mensual en Azure y recomendaciones FinOps',
    });
    return typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
  },

  /**
   * Ejecución genérica de fase por ID (a, b, c, d, e, f, g, h).
   */
  async executePhase(projectId: string, phase: 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h', prompt?: string): Promise<any> {
    const response = await api.post(`/v1/projects/${projectId}/phases/${phase}`, {
      content: prompt || '',
    });
    return response.data;
  },
};
