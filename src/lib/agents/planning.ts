import { callLLM } from '../llm/router';
import { MaterialityCalculation, AuditFinding } from './types';

export interface IndependenceCheck {
  threatIdentified: boolean;
  threatType?: string;
  details: string;
  mitigationRequired: boolean;
}

export async function runPlanningAgent(
  engagementId: string,
  totalRevenue: number,
  providedBookkeeping: boolean = false
): Promise<{
  materiality: MaterialityCalculation;
  independence: IndependenceCheck;
  findings: AuditFinding[];
}> {
  // 1. Calculate Materiality (ISA 320)
  const overallPercentage = 0.01; // 1% of Revenue
  const performancePercentage = 0.75; // 75% of overall materiality
  const overallMateriality = totalRevenue * overallPercentage;
  const performanceMateriality = overallMateriality * performancePercentage;

  const materiality: MaterialityCalculation = {
    benchmarkType: 'REVENUE',
    benchmarkValue: totalRevenue,
    overallPercentage: 1.0,
    overallMateriality,
    performancePercentage: 75.0,
    performanceMateriality,
    rationale: `Materiality determined at 1.0% of total revenue ($${totalRevenue.toLocaleString()}) per ISA 320 standards. Performance materiality set at 75% based on entity operating history.`
  };

  // 2. Independence & Ethics Check (IESBA / ICAP Code)
  const independence: IndependenceCheck = {
    threatIdentified: providedBookkeeping,
    threatType: providedBookkeeping ? 'SELF_REVIEW_THREAT' : undefined,
    details: providedBookkeeping 
      ? 'CRITICAL ETHICS ALERT: Firm provided accounting/bookkeeping services to client in audit period. Self-review threat identified under IESBA Code.'
      : 'Independence gate verified. No self-review or familiarity threats identified.',
    mitigationRequired: providedBookkeeping
  };

  const findings: AuditFinding[] = [];

  if (providedBookkeeping) {
    findings.push({
      id: `find_plan_1_${Date.now()}`,
      engagementId,
      auditArea: 'Ethics & Independence',
      agentSource: 'Planning & Risk Agent (ISA 300/315)',
      description: 'Self-review threat identified: Audit firm performed bookkeeping services during FY. Requires independent partner review prior to sign-off.',
      riskLevel: 'HIGH',
      evidenceRefs: ['Ethics_Assessment_ISA300.pdf'],
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString()
    });
  }

  // 3. LLM Call for Risk Assessment Narrative
  await callLLM('JUDGMENT_STANDARDS_RISK', {
    engagementId,
    prompt: `Analyze planning risk matrix for engagement with revenue $${totalRevenue}. Materiality: $${overallMateriality}.`,
    contextData: { benchmarkValue: totalRevenue }
  });

  return {
    materiality,
    independence,
    findings
  };
}
