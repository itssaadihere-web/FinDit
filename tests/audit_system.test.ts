import { runReconciliation } from '../src/lib/intake/reconciliation';
import { evaluateISA500Hierarchy } from '../src/lib/agents/substantive/cash_bank';
import { signOffAuditReport } from '../src/lib/review/actions';
import { AuditReportPack } from '../src/lib/agents/reporting';
import { ReviewItem } from '../src/lib/agents/types';

function runTests() {
  console.log('====================================================');
  console.log('   FinDit AI Financial Audit System Verification    ');
  console.log('====================================================\n');

  let passedCount = 0;
  let totalCount = 0;

  function assert(condition: boolean, testName: string) {
    totalCount++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedCount++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Test Reconciliation Engine
  const balancedTB = [
    { accountCode: '100', accountName: 'Cash', auditArea: 'Cash', debit: 5000, credit: 0 },
    { accountCode: '200', accountName: 'Equity', auditArea: 'Equity', debit: 0, credit: 5000 }
  ];
  const reconPass = runReconciliation(balancedTB);
  assert(reconPass.passed === true, 'Reconciliation Engine: Balanced Trial Balance passes');

  const unbalancedTB = [
    { accountCode: '100', accountName: 'Cash', auditArea: 'Cash', debit: 5000, credit: 0 },
    { accountCode: '200', accountName: 'Equity', auditArea: 'Equity', debit: 0, credit: 4000 }
  ];
  const reconFail = runReconciliation(unbalancedTB);
  assert(reconFail.passed === false, 'Reconciliation Engine: Unbalanced Trial Balance fails');

  // 2. Test ISA 500 Evidence Hierarchy Scoring
  const extConfScore = evaluateISA500Hierarchy('EXTERNAL_DIRECT_CONFIRMATION');
  assert(extConfScore.weightScore === 1.0 && extConfScore.sufficientForHighRisk === true, 'ISA 500 Hierarchy: Direct Bank Confirmation gets 1.0 weight');

  const mgmtAssertionScore = evaluateISA500Hierarchy('MANAGEMENT_ASSERTION');
  assert(mgmtAssertionScore.weightScore === 0.10 && mgmtAssertionScore.sufficientForHighRisk === false, 'ISA 500 Hierarchy: Management Oral Assertion score is 0.10 and insufficient for high risk');

  // 3. Test CA Sign-Off Hard Gate Constraint
  const dummyReport: AuditReportPack = {
    engagementId: 'eng_test',
    status: 'AI_DRAFT',
    mandatoryDisclaimer: 'AI draft pending review',
    auditSummaryReport: { title: 'Test Report', executiveSummary: 'Test', overallFieldworkProgress: 88, totalFindingsCount: 1, highRiskCount: 1 },
    managementLetter: { title: 'Letter', controlWeaknesses: [] },
    keyAuditMatters: [],
    opinionRecommendation: { type: 'UNMODIFIED', rationale: 'Test' }
  };

  const pendingItems: ReviewItem[] = [
    { id: 'rev_1', engagementId: 'eng_test', auditArea: 'Cash', escalationReason: 'Test high risk', suggestedAction: 'Review', status: 'PENDING_REVIEW', createdAt: '' }
  ];

  let gateTriggered = false;
  try {
    signOffAuditReport(dummyReport, pendingItems);
  } catch (err: any) {
    gateTriggered = err.message.includes('SIGN-OFF BLOCKED BY SYSTEM GATE');
  }
  assert(gateTriggered === true, 'CA Sign-off Gate: Blocks export when pending items exist');

  // Now resolve pending item and re-test sign-off
  const resolvedItems: ReviewItem[] = [
    { id: 'rev_1', engagementId: 'eng_test', auditArea: 'Cash', escalationReason: 'Test high risk', suggestedAction: 'Review', status: 'CA_APPROVED', createdAt: '' }
  ];
  const approvedReport = signOffAuditReport(dummyReport, resolvedItems);
  assert(approvedReport.status === 'CA_APPROVED' && approvedReport.caSignoffMetadata !== undefined, 'CA Sign-off Gate: Unlocks and sets status to CA_APPROVED when all items resolved');

  console.log(`\nVerification Summary: ${passedCount} / ${totalCount} tests passed.`);
  if (passedCount === totalCount) {
    console.log('✅ ALL VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTests();
