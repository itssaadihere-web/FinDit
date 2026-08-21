export type TaskType = 
  | 'JUDGMENT_STANDARDS_RISK'
  | 'BULK_NUMERIC_ANALYTICS'
  | 'FAST_TRIAGE_CLASSIFICATION'
  | 'FINAL_REPORT_SYNTHESIS';

export interface LLMCallPayload {
  engagementId?: string;
  prompt: string;
  systemPrompt?: string;
  inputRefs?: string[]; // e.g. document IDs or GL transaction IDs
  contextData?: Record<string, any>;
  temperature?: number;
}

export interface LLMResponse {
  taskType: TaskType;
  modelUsed: string;
  content: string;
  json?: any;
  confidenceScore: number;
  inputRefs: string[];
  timestamp: string;
}

export interface RouteConfig {
  taskType: TaskType;
  primaryModel: string;
  fallbackModel: string;
  description: string;
}
