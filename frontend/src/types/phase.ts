export interface AiAnalysisResponse {
  analisisInterno: string;
  estado: 'PREGUNTANDO' | 'BLOQUEO' | 'LISTO_FASE_B' | string;
  respuestaAlUsuario: string;
  preguntasBloqueantes: string[];
}

export interface ColumnSpec {
  name: string;
  type: string;
  nullable: boolean;
  primaryKey?: boolean;
  foreignKey?: string;
}

export interface TableSpec {
  name: string;
  columns: ColumnSpec[];
}

export interface DbSpec {
  tables: TableSpec[];
  erdSvg?: string;
  mermaidDiagram?: string;
}

export interface EndpointSpec {
  id?: string;
  projectId?: number;
  httpMethod: string;
  path: string;
  requestBody?: string | null;
  responseBody?: string | null;
  statusCodes: string;
}

export interface ScreenSpec {
  name: string;
  route?: string;
  description?: string;
  components: string[];
  mockupUrl?: string;
  wireframeHtml?: string;
  consumedEndpoints?: string[];
  validations?: string[];
}

export interface UiMap {
  screens: ScreenSpec[];
  wireframeHtml?: string;
}

export interface ArchitectureSpec {
  justification: string;
  deploymentPlan: string;
  mermaidDiagram?: string;
  architectureSvg?: string;
}

export interface OwaspControl {
  id: string;
  title: string;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  mitigation: string;
}

export interface SecuritySpec {
  owaspTop10: OwaspControl[];
  keyVaultStrategy: string;
  dataProtection: string;
  generatedBy?: string;
}

export interface TestCase {
  id: string;
  name: string;
  type: 'UNIT' | 'INTEGRATION' | 'E2E' | string;
  expectedResult: string;
}

export interface QaSpec {
  testingPyramid: string;
  testCases: TestCase[];
  coverageTarget: string;
  generatedBy?: string;
}

export interface CostItem {
  service: string;
  tier: string;
  monthlyCostUsd: number;
  description: string;
}

export interface FinopsSpec {
  monthlyBudgetTotalUsd: number;
  costBreakdown: CostItem[];
  recommendations: string[];
  generatedBy?: string;
}

export interface AzureHealthResponse {
  status: 'UP' | 'CONFIGURED' | 'NOT_CONFIGURED' | 'DOWN' | 'ERROR' | string;
  detail?: string;
  deployment?: string;
  latencyMs?: number;
  checkedAt?: string;
  error?: string;
  model?: string;
  deploymentName?: string;
  hasEndpoint?: boolean;
  hasApiKey?: boolean;
  message?: string;
}

export interface ChatMessageItem {
  id: string;
  sender: 'USER' | 'AI';
  content: string;
  status?: string;
  timestamp: string;
  analysis?: string;
  blockingQuestions?: string[];
}
