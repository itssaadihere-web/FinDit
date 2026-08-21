import { LLMResponse } from './types';

export interface LLMLogEntry {
  id: string;
  engagementId?: string;
  taskType: string;
  modelUsed: string;
  inputRefs: string[];
  outputSummary: string;
  confidenceScore: number;
  createdAt: string;
}

const memoryLogs: LLMLogEntry[] = [];

export async function logLLMCall(
  engagementId: string | undefined,
  response: LLMResponse
): Promise<LLMLogEntry> {
  const entry: LLMLogEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    engagementId: engagementId || 'global',
    taskType: response.taskType,
    modelUsed: response.modelUsed,
    inputRefs: response.inputRefs || [],
    outputSummary: response.content.substring(0, 300) + (response.content.length > 300 ? '...' : ''),
    confidenceScore: response.confidenceScore,
    createdAt: response.timestamp || new Date().toISOString(),
  };

  memoryLogs.push(entry);
  console.log(`[LLM_LOG] ${entry.modelUsed} executed task ${entry.taskType} (Confidence: ${entry.confidenceScore})`);
  
  return entry;
}

export function getLLMLogs(engagementId?: string): LLMLogEntry[] {
  if (!engagementId) return [...memoryLogs];
  return memoryLogs.filter(log => log.engagementId === engagementId);
}
