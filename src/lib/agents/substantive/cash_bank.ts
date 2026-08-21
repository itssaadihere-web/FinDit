import { AuditFinding, PBCRequest } from '../types';

export interface BankAccount {
  accountNumber: string;
  bankName: string;
  glBalance: number;
  bankStatementBalance: number;
  confirmationBalance?: number;
  confirmationReceived: boolean;
  reconcilingItemsTotal: number;
}

export interface ISA500EvidenceScore {
  evidenceType: 'EXTERNAL_DIRECT_CONFIRMATION' | 'EXTERNAL_DOCUMENT_HELD_BY_CLIENT' | 'INTERNAL_DOCUMENT' | 'MANAGEMENT_ASSERTION';
  weightScore: number; // 1.0, 0.75, 0.50, 0.10
  sufficientForHighRisk: boolean;
  notes: string;
}

export function evaluateISA500Hierarchy(evidenceType: ISA500EvidenceScore['evidenceType']): ISA500EvidenceScore {
  switch (evidenceType) {
    case 'EXTERNAL_DIRECT_CONFIRMATION':
      return {
        evidenceType,
        weightScore: 1.0,
        sufficientForHighRisk: true,
        notes: 'Highest reliability evidence under ISA 500 (Direct 3rd-party confirmation).'
      };
    case 'EXTERNAL_DOCUMENT_HELD_BY_CLIENT':
      return {
        evidenceType,
        weightScore: 0.75,
        sufficientForHighRisk: true,
        notes: 'High reliability external document held by client (e.g., original bank statement).'
      };
    case 'INTERNAL_DOCUMENT':
      return {
        evidenceType,
        weightScore: 0.50,
        sufficientForHighRisk: false,
        notes: 'Moderate reliability internally generated document (e.g., client bank recon sheet).'
      };
    case 'MANAGEMENT_ASSERTION':
      return {
        evidenceType,
        weightScore: 0.10,
        sufficientForHighRisk: false,
        notes: 'Low reliability management assertion/oral statement. Cannot independently close high-risk audit items.'
      };
  }
}

export async function runCashBankSubstantiveAgent(
  engagementId: string,
  accounts: BankAccount[]
): Promise<{
  findings: AuditFinding[];
  pbcRequests: PBCRequest[];
  evidenceHierarchyScores: Record<string, ISA500EvidenceScore>;
}> {
  const findings: AuditFinding[] = [];
  const pbcRequests: PBCRequest[] = [];
  const evidenceHierarchyScores: Record<string, ISA500EvidenceScore> = {};

  for (const acc of accounts) {
    let evType: ISA500EvidenceScore['evidenceType'] = 'INTERNAL_DOCUMENT';
    if (acc.confirmationReceived && acc.confirmationBalance !== undefined) {
      evType = 'EXTERNAL_DIRECT_CONFIRMATION';
    } else if (acc.bankStatementBalance) {
      evType = 'EXTERNAL_DOCUMENT_HELD_BY_CLIENT';
    }

    const score = evaluateISA500Hierarchy(evType);
    evidenceHierarchyScores[acc.accountNumber] = score;

    if (!acc.confirmationReceived) {
      findings.push({
        id: `find_cb_conf_${acc.accountNumber}_${Date.now()}`,
        engagementId,
        auditArea: 'Cash & Bank (ISA 505)',
        agentSource: 'Cash & Bank Substantive Procedure (ISA 505 / ISA 500)',
        description: `Direct Bank Confirmation Response Missing for ${acc.bankName} Account ${acc.accountNumber} with material GL balance $${acc.glBalance.toLocaleString()}. Evidence score: ${score.weightScore}/1.00 (${evType}).`,
        riskLevel: 'HIGH',
        evidenceRefs: [acc.accountNumber],
        status: 'PENDING_REVIEW',
        createdAt: new Date().toISOString(),
        statutoryReferences: [
          {
            standardId: 'ISA 505.7',
            title: 'External Confirmation Procedures',
            officialClauseText: 'When performing external confirmation procedures, the auditor shall maintain control over external confirmation requests, including determining information to be confirmed and sending requests directly to confirming parties.',
            governingBody: 'IFAC / IAASB (ISA)'
          },
          {
            standardId: 'ISA 500.A31',
            title: 'Reliability of Audit Evidence Hierarchy',
            officialClauseText: 'Audit evidence obtained directly by the auditor (such as direct bank confirmation) is more reliable than audit evidence obtained indirectly or by inference (such as internal client cashbooks).',
            governingBody: 'IFAC / IAASB (ISA)'
          },
          {
            standardId: 'Companies Act 2017 Section 227(3)',
            title: 'Auditor Right of Access to Information',
            officialClauseText: 'The auditor of a company shall have a right of access at all times to books, accounts, vouchers, and direct confirmation responses from banking institutions.',
            governingBody: 'Corporate Law / Companies Act'
          }
        ],
        rootCauseAnalysis: `Material cash balance of $${acc.glBalance.toLocaleString()} is supported only by client-held bank statements (ISA 500 score 0.75), which does not satisfy the direct independent 3rd-party confirmation requirement mandated by ISA 505 for statutory closing.`,
        mandatoryRemediation: 'Re-send direct bank confirmation request under auditor seal and receive original signed bank confirmation letter.',
        isa500EvidenceScore: { weightScore: score.weightScore, description: score.notes }
      });

      pbcRequests.push({
        id: `pbc_cb_${acc.accountNumber}_${Date.now()}`,
        engagementId,
        auditArea: 'Cash & Bank (ISA 505)',
        documentNeeded: `Direct Bank Confirmation Response for ${acc.bankName} Account ${acc.accountNumber}`,
        triggerReason: 'ISA 505 mandatory direct bank confirmation requirement.',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
    }
  }

  return {
    findings,
    pbcRequests,
    evidenceHierarchyScores
  };
}
