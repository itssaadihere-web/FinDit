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
    // 1. Evidence Hierarchy Scoring (ISA 500 & ISA 505)
    let evType: ISA500EvidenceScore['evidenceType'] = 'INTERNAL_DOCUMENT';
    if (acc.confirmationReceived && acc.confirmationBalance !== undefined) {
      evType = 'EXTERNAL_DIRECT_CONFIRMATION';
    } else if (acc.bankStatementBalance) {
      evType = 'EXTERNAL_DOCUMENT_HELD_BY_CLIENT';
    }

    const score = evaluateISA500Hierarchy(evType);
    evidenceHierarchyScores[acc.accountNumber] = score;

    // 2. Bank Confirmation Check (ISA 505)
    if (!acc.confirmationReceived) {
      findings.push({
        id: `find_cb_conf_${acc.accountNumber}_${Date.now()}`,
        engagementId,
        auditArea: 'Cash & Bank (ISA 505)',
        agentSource: 'Cash & Bank Substantive Agent',
        description: `Direct bank confirmation missing for account ${acc.bankName} (${acc.accountNumber}) with GL balance $${acc.glBalance.toLocaleString()}. ISA 500 score: ${score.weightScore} (${evType}).`,
        riskLevel: 'HIGH',
        evidenceRefs: [acc.accountNumber],
        status: 'PENDING_REVIEW',
        createdAt: new Date().toISOString()
      });

      pbcRequests.push({
        id: `pbc_cb_${acc.accountNumber}_${Date.now()}`,
        engagementId,
        auditArea: 'Cash & Bank (ISA 505)',
        documentNeeded: `Direct Bank Confirmation Response for ${acc.bankName} Account ${acc.accountNumber}`,
        triggerReason: 'ISA 505 direct bank confirmation requirement for material cash balance.',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      });
    } else if (acc.confirmationBalance !== undefined) {
      const diff = Math.abs(acc.confirmationBalance - (acc.glBalance + acc.reconcilingItemsTotal));
      if (diff > 100) {
        findings.push({
          id: `find_cb_break_${acc.accountNumber}_${Date.now()}`,
          engagementId,
          auditArea: 'Cash & Bank',
          agentSource: 'Cash & Bank Substantive Agent',
          description: `Discrepancy of $${diff.toLocaleString()} identified between direct bank confirmation ($${acc.confirmationBalance.toLocaleString()}) and GL balance + valid reconciling items for account ${acc.accountNumber}.`,
          riskLevel: 'HIGH',
          evidenceRefs: [acc.accountNumber],
          status: 'PENDING_REVIEW',
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  return {
    findings,
    pbcRequests,
    evidenceHierarchyScores
  };
}
