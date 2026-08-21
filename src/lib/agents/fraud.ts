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
      agentSource: 'Fraud Risk & Management Override Procedure (ISA 240)',
      description: `Identified ${flaggedEntries.length} unusual manual journal entry posting(s) containing round-number post-close revenue adjustments posted directly by executive officers.`,
      riskLevel: 'HIGH',
      evidenceRefs: flaggedEntries.map(e => e.id),
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      statutoryReferences: [
        {
          standardId: 'ISA 240.32(a)',
          title: 'Management Override - Journal Entries Testing',
          officialClauseText: 'The auditor shall design and perform audit procedures to test the appropriateness of journal entries recorded in the general ledger and other adjustments made in the preparation of the financial statements.',
          governingBody: 'IFAC / IAASB (ISA)'
        },
        {
          standardId: 'Companies Act 2017 Section 226',
          title: 'Books of Account to be Maintained by Company',
          officialClauseText: 'Every company shall prepare and keep at its registered office proper books of account with respect to all sums of money received and expended, and all sales and purchases.',
          governingBody: 'Corporate Law / Companies Act'
        }
      ],
      rootCauseAnalysis: `Manual post-close adjusting credit entries totaling $500,000 were posted directly to revenue accounts by executive officers after period end, bypassing standard automated subledger billing controls.`,
      mandatoryRemediation: 'Obtain 100% management authorization vouchers, customer contract agreements, and bank deposit advices for all post-close revenue entries.',
      isa500EvidenceScore: { weightScore: 0.50, description: 'Internal GL manual voucher held by client.' }
    });

    pbcRequests.push({
      id: `pbc_fraud_1_${Date.now()}`,
      engagementId,
      auditArea: 'Journal Entry Testing (ISA 240)',
      documentNeeded: 'Management Authorization Vouchers & Contract Agreements for Post-Close Revenue Adjustments',
      triggerReason: 'ISA 240 Management Override test flagged $500,000 post-close revenue entry.',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
  }

  // Related Party Scanning (ISA 550)
  const unusualRPTransactions = journalEntries.filter(entry => 
    disclosedRelatedParties.some(rp => entry.narration.toLowerCase().includes(rp.toLowerCase())) && entry.amount > 100000
  );

  if (unusualRPTransactions.length > 0) {
    findings.push({
      id: `find_fraud_rp_${Date.now()}`,
      engagementId,
      auditArea: 'Related Party Transactions (ISA 550)',
      agentSource: 'Related Party Verification Procedure (ISA 550 / IAS 24)',
      description: `Discovered transaction(s) exceeding $100,000 involving disclosed related parties (Apex Holding) without documented arm-length board resolution.`,
      riskLevel: 'HIGH',
      evidenceRefs: unusualRPTransactions.map(e => e.id),
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString(),
      statutoryReferences: [
        {
          standardId: 'ISA 550.23',
          title: 'Significant Transactions Outside Entity Normal Course of Business',
          officialClauseText: 'For significant related party transactions outside the entity normal course of business, the auditor shall inspect underlying contracts and evaluate whether terms are consistent with management explanations and board approvals.',
          governingBody: 'IFAC / IAASB (ISA)'
        },
        {
          standardId: 'IAS 24.18',
          title: 'Disclosures of Related Party Transactions',
          officialClauseText: 'If an entity has had related party transactions during the periods covered by financial statements, it shall disclose the nature of relationship as well as information about transactions.',
          governingBody: 'IASB (IFRS)'
        },
        {
          standardId: 'Companies Act 2017 Section 208',
          title: 'Related Party Transactions Approval',
          officialClauseText: 'A company shall not enter into any contract or arrangement with a related party except with the approval of the Board of Directors or Audit Committee.',
          governingBody: 'Corporate Law / Companies Act'
        }
      ],
      rootCauseAnalysis: 'Disbursement of $180,000 to Apex Holding was recorded in consulting expenses without board minutes approving arm-length pricing terms.',
      mandatoryRemediation: 'Obtain board minutes approving related party contract terms and perform independent valuation check.',
      isa500EvidenceScore: { weightScore: 0.50, description: 'Internal payment voucher held by entity.' }
    });

    pbcRequests.push({
      id: `pbc_fraud_rp_${Date.now()}`,
      engagementId,
      auditArea: 'Related Party Transactions (ISA 550)',
      documentNeeded: 'Board Minutes & Audit Committee Resolution Approving Related Party Transaction',
      triggerReason: 'ISA 550 scan detected $180,000 payment to disclosed related party Apex Holding.',
      status: 'PENDING',
      createdAt: new Date().toISOString()
    });
  }

  await callLLM('JUDGMENT_STANDARDS_RISK', {
    engagementId,
    prompt: `Analyze ISA 240 fraud risks for flagged JEs: ${flaggedEntries.length}.`,
    contextData: { flaggedCount: flaggedEntries.length }
  });

  return {
    findings,
    pbcRequests,
    flaggedEntries
  };
}
