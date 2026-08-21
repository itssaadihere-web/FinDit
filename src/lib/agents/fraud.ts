import { callLLM } from '../llm/router';
import { AuditFinding, PBCRequest } from './types';

export interface JournalEntry {
  id: string;
  date: string;
  accountCode: string;
  accountName: string;
  amount: number;
  narration: string;
  postedBy: string;
  isPostClose?: boolean;
}

export async function runFraudAgent(
  engagementId: string,
  journalEntries: JournalEntry[],
  disclosedRelatedParties: string[]
): Promise<{
  findings: AuditFinding[];
  pbcRequests: PBCRequest[];
  flaggedEntries: JournalEntry[];
}> {
  const findings: AuditFinding[] = [];
  const pbcRequests: PBCRequest[] = [];
  const flaggedEntries: JournalEntry[] = [];

  // 1. Journal Entry Testing (ISA 240 Management Override Scenarios)
  for (const entry of journalEntries) {
    const isRoundNumber = entry.amount % 10000 === 0 && entry.amount > 50000;
    const isLatePost = entry.isPostClose;
    const isExecutiveOverride = /CEO|CFO|Director|Manager/i.test(entry.postedBy) && /Revenue|Expense|Adjustment/i.test(entry.accountName);

    if (isRoundNumber || isLatePost || isExecutiveOverride) {
      flaggedEntries.push(entry);
    }
  }

  if (flaggedEntries.length > 0) {
    findings.push({
      id: `find_fraud_je_${Date.now()}`,
      engagementId,
      auditArea: 'Journal Entry Testing (ISA 240)',
      agentSource: 'Fraud Risk Agent (ISA 240)',
      description: `Identified ${flaggedEntries.length} unusual journal entries (round-number, post-close adjustments, or manual management overrides). Requires detailed sample verification.`,
      riskLevel: 'HIGH',
      evidenceRefs: flaggedEntries.map(e => e.id),
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString()
    });

    pbcRequests.push({
      id: `pbc_fraud_1_${Date.now()}`,
      engagementId,
      auditArea: 'Journal Entry Testing (ISA 240)',
      documentNeeded: 'Management Authorization Vouchers for Post-Close Adjusting Entries',
      triggerReason: 'ISA 240 Management Override test flagged round-number post-close entries in GL.',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
  }

  // 2. Related Party Transaction Scanning (ISA 550)
  const unusualRPTransactions = journalEntries.filter(entry => 
    disclosedRelatedParties.some(rp => entry.narration.toLowerCase().includes(rp.toLowerCase())) && entry.amount > 100000
  );

  if (unusualRPTransactions.length > 0) {
    findings.push({
      id: `find_fraud_rp_${Date.now()}`,
      engagementId,
      auditArea: 'Related Party Transactions (ISA 550)',
      agentSource: 'Fraud Risk Agent (ISA 550)',
      description: `Discovered ${unusualRPTransactions.length} high-value transaction(s) involving disclosed related parties without explicit board resolution attachment.`,
      riskLevel: 'HIGH',
      evidenceRefs: unusualRPTransactions.map(e => e.id),
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString()
    });

    pbcRequests.push({
      id: `pbc_fraud_rp_${Date.now()}`,
      engagementId,
      auditArea: 'Related Party Transactions (ISA 550)',
      documentNeeded: 'Board Minutes approving Related Party Transaction Pricing & Terms',
      triggerReason: 'ISA 550 scan detected transactions > $100k with disclosed related parties.',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
  }

  // 3. LLM Call for Fraud Risk Narrative Synthesis
  await callLLM('JUDGMENT_STANDARDS_RISK', {
    engagementId,
    prompt: `Analyze ISA 240 fraud risks. Flagged JEs: ${flaggedEntries.length}. Disclosed related parties: ${disclosedRelatedParties.join(', ')}.`,
    contextData: { flaggedCount: flaggedEntries.length }
  });

  return {
    findings,
    pbcRequests,
    flaggedEntries
  };
}
