import { callLLM } from '../llm/router';
import { DocumentItem } from './types';

export const AUDIT_AREAS = [
  'Cash & Bank',
  'Revenue & Receivables',
  'Payables & Accruals',
  'Fixed Assets (PPE)',
  'Inventory',
  'Payroll',
  'Provisions & Contingencies',
  'Related Party Transactions',
  'Going Concern & Planning'
] as const;

export async function classifyDocument(
  fileName: string,
  engagementId: string
): Promise<{ auditArea: string; summary: string }> {
  const llmRes = await callLLM('FAST_TRIAGE_CLASSIFICATION', {
    engagementId,
    prompt: fileName,
    systemPrompt: 'Classify document into statutory audit area buckets.'
  });

  try {
    const parsed = JSON.parse(llmRes.content);
    return {
      auditArea: parsed.classifiedArea || 'Cash & Bank',
      summary: parsed.extractedSummary || `Classified ${fileName}`
    };
  } catch {
    return {
      auditArea: 'Cash & Bank',
      summary: `Auto-assigned based on file extension and pattern match.`
    };
  }
}
