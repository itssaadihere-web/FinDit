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
    rationale: `Materiality determined at 1.0% of total revenue ($${totalRevenue.toLocaleString()}) per ISA 320 guidelines.`
  };

  // 2. Ethics Check (IESBA / ICAP Code)
  const independence: IndependenceCheck = {
    threatIdentified: providedBookkeeping,
    threatType: providedBookkeeping ? 'SELF_REVIEW_THREAT' : undefined,
    details: providedBookkeeping 
      ? 'ETHICS ALERT: Audit firm provided accounting/bookkeeping services during FY. Self-review threat identified.'
      : 'Independence gate verified.',
    mitigationRequired: providedBookkeeping
  };

  const findings: AuditFinding[] = [];

  if (providedBookkeeping) {
    findings.push({
      id: `find_plan_1_${Date.now()}`,
      engagementId,
      auditArea: 'Ethics & Independence',
      agentSource: 'Planning & Ethics Procedure (ISA 300 / IESBA)',
      description: 'Self-Review Threat Identified: Audit firm prepared accounting/bookkeeping records during the audited period. Requires independent quality partner review.',
      riskLevel: 'HIGH',
      evidenceRefs: ['Ethics_Assessment_ISA300.pdf'],
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      statutoryReferences: [
        {
          standardId: 'ICAP Code of Ethics Section 290.13',
          title: 'Self-Review Threat in Bookkeeping Services',
          officialClauseText: 'A firm shall not prepare accounting records or financial statements for an audit client that is a public interest entity or material audit engagement, as doing so creates an unacceptable self-review threat under Section 290.',
          governingBody: 'ICAP Code of Ethics'
        },
        {
          standardId: 'ISA 300.A14',
          title: 'Planning Considerations - Ethical Requirements',
          officialClauseText: 'The engagement partner shall form a conclusion on compliance with independence requirements that apply to the audit engagement.',
          governingBody: 'IFAC / IAASB (ISA)'
        },
        {
          standardId: 'Companies Act 2017 Section 246',
          title: 'Disqualification of Auditors',
          officialClauseText: 'A person who is an officer, employee, or partner responsible for preparing accounts of the company is disqualified from appointment as statutory auditor.',
          governingBody: 'Corporate Law / Companies Act'
        }
      ],
      rootCauseAnalysis: 'The audit firm performed dual roles of compiling journal entries/financial statement draft lines and conducting statutory audit fieldwork, creating a structural self-review threat where auditors evaluate their own work.',
      mandatoryRemediation: 'Appoint an independent EQCR (Engagement Quality Control Reviewer) partner who was not involved in bookkeeping to challenge and approve working papers.',
      isa500EvidenceScore: { weightScore: 0.10, description: 'Internal firm self-assessment declaration.' }
    });
  }

  await callLLM('JUDGMENT_STANDARDS_RISK', {
    engagementId,
    prompt: `Analyze planning risk matrix for engagement with revenue $${totalRevenue}.`,
    contextData: { benchmarkValue: totalRevenue }
  });

  return {
    materiality,
    independence,
    findings
  };
}
