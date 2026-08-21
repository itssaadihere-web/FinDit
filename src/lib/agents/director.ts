import { runPlanningAgent } from './planning';
import { runFraudAgent, JournalEntry } from './fraud';
import { runCashBankSubstantiveAgent, BankAccount } from './substantive/cash_bank';
import { runAnalyticalProceduresAgent, FinancialRatios } from './analytical';
import { runDisclosureChecklistAgent } from './disclosure';
import { runReportingAgent, AuditReportPack } from './reporting';
import { AuditFinding, ReviewItem, PBCRequest, EngagementStage, MaterialityCalculation } from './types';

export interface AuditExecutionResult {
  engagementId: string;
  stage: EngagementStage;
  materiality: MaterialityCalculation;
  overallFieldworkProgress: number; // e.g. 88%
  findings: AuditFinding[];
  reviewQueue: ReviewItem[];
  pbcRequests: PBCRequest[];
  reportPack: AuditReportPack;
  executedAt: string;
}

export async function executeFullAuditWorkflow(
  engagementId: string,
  params: {
    totalRevenue: number;
    providedBookkeeping?: boolean;
    journalEntries?: JournalEntry[];
    disclosedRelatedParties?: string[];
    bankAccounts?: BankAccount[];
    ratiosCurrent?: FinancialRatios;
    ratiosPrior?: FinancialRatios;
    transactionAmounts?: number[];
    samplePayments?: { vendorName: string; amount: number; date: string; ref: string }[];
    draftNoteDisclosures?: string[];
  }
): Promise<AuditExecutionResult> {
  const allFindings: AuditFinding[] = [];
  const allPbcRequests: PBCRequest[] = [];

  // 1. Planning & Risk Phase (ISA 300, 315, 320)
  const planningRes = await runPlanningAgent(
    engagementId,
    params.totalRevenue,
    params.providedBookkeeping || false
  );
  allFindings.push(...planningRes.findings);

  // 2. Fraud Risk Phase (ISA 240, ISA 550)
  const defaultJEs: JournalEntry[] = params.journalEntries || [
    { id: 'je_101', date: '2025-12-31', accountCode: '4000', accountName: 'Revenue - Manual Adjustment', amount: 500000, narration: 'Year end revenue adjustment', postedBy: 'CFO', isPostClose: true },
    { id: 'je_102', date: '2025-06-15', accountCode: '5100', accountName: 'Consulting Fees', amount: 150000, narration: 'Payment to Apex Holding (Related Party)', postedBy: 'Senior Accountant' },
    { id: 'je_103', date: '2025-09-20', accountCode: '6000', accountName: 'Office Expenses', amount: 4500, narration: 'Routine supplies purchase', postedBy: 'Junior Accountant' }
  ];
  const defaultRPs = params.disclosedRelatedParties || ['Apex Holding', 'Vision Logistics'];

  const fraudRes = await runFraudAgent(engagementId, defaultJEs, defaultRPs);
  allFindings.push(...fraudRes.findings);
  allPbcRequests.push(...fraudRes.pbcRequests);

  // 3. Substantive Testing Phase (Cash & Bank ISA 505)
  const defaultBankAccounts: BankAccount[] = params.bankAccounts || [
    { accountNumber: '1001-987654', bankName: 'Standard Chartered Bank', glBalance: 1250000, bankStatementBalance: 1250000, confirmationBalance: 1250000, confirmationReceived: true, reconcilingItemsTotal: 0 },
    { accountNumber: '2004-112233', bankName: 'Habib Bank Limited', glBalance: 450000, bankStatementBalance: 450000, confirmationReceived: false, reconcilingItemsTotal: 0 }
  ];

  const cashBankRes = await runCashBankSubstantiveAgent(engagementId, defaultBankAccounts);
  allFindings.push(...cashBankRes.findings);
  allPbcRequests.push(...cashBankRes.pbcRequests);

  // 4. Analytical Procedures Phase (ISA 520 & Benford's Law)
  const currentRatios: FinancialRatios = params.ratiosCurrent || {
    currentRatio: 1.45, quickRatio: 1.10, grossProfitMargin: 0.38, debtToEquity: 0.85, inventoryTurnover: 6.2
  };
  const priorRatios: FinancialRatios = params.ratiosPrior || {
    currentRatio: 1.80, quickRatio: 1.40, grossProfitMargin: 0.29, debtToEquity: 0.60, inventoryTurnover: 8.1
  };
  const txAmounts = params.transactionAmounts || Array.from({ length: 150 }, () => Math.floor(Math.random() * 90000) + 1000);
  const samplePayments = params.samplePayments || [
    { vendorName: 'Apex Distributors', amount: 85000, date: '2025-04-10', ref: 'INV-4011' },
    { vendorName: 'Apex Distributors', amount: 85000, date: '2025-04-12', ref: 'INV-4011-DUP' },
    { vendorName: 'TechSupply Corp', amount: 12000, date: '2025-05-01', ref: 'INV-9921' }
  ];

  const analyticalRes = await runAnalyticalProceduresAgent(
    engagementId, currentRatios, priorRatios, txAmounts, samplePayments
  );
  allFindings.push(...analyticalRes.findings);

  // 5. Disclosure Checklist Phase (IFRS)
  const draftNotes = params.draftNoteDisclosures || [
    'Note 1: Company Profile and Significant Accounting Policies.',
    'Note 2: Disaggregated Revenue streams recognized over time.',
    'Note 3: Related Party Transactions with Apex Holding.'
  ];

  const disclosureRes = await runDisclosureChecklistAgent(engagementId, draftNotes);
  allFindings.push(...disclosureRes.findings);

  // 6. Review Queue Escalation
  const reviewQueue: ReviewItem[] = allFindings.map(f => ({
    id: `rev_${f.id}`,
    engagementId,
    findingId: f.id,
    auditArea: f.auditArea,
    escalationReason: `Escalated by Audit Director: ${f.riskLevel} risk finding in ${f.auditArea}. Requires CA sign-off / challenge.`,
    suggestedAction: f.riskLevel === 'HIGH' ? 'Review supporting documents, challenge management assertion, or request additional PBC evidence.' : 'Approve AI finding with standard note.',
    status: 'PENDING_REVIEW',
    createdAt: new Date().toISOString()
  }));

  // 7. Reporting Phase
  const reportPack = await runReportingAgent(engagementId, allFindings);

  return {
    engagementId,
    stage: 'FIELDWORK',
    materiality: planningRes.materiality,
    overallFieldworkProgress: 88,
    findings: allFindings,
    reviewQueue,
    pbcRequests: allPbcRequests,
    reportPack,
    executedAt: new Date().toISOString()
  };
}
