import { parseTrialBalanceCSV, parseGeneralLedgerCSV, parseBankAccountsCSV } from '../src/lib/intake/parser';
import { SAMPLE_TRIAL_BALANCE_CSV, SAMPLE_GENERAL_LEDGER_CSV, SAMPLE_BANK_ACCOUNTS_CSV } from '../src/lib/intake/templates';
import { runReconciliation } from '../src/lib/intake/reconciliation';
import { exportWorkingPaperHTML } from '../src/lib/export/exporter';

function runRealDataTests() {
  console.log('====================================================');
  console.log('    FinDit Real Data Parser & Engine Verification   ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string) {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
    }
  }

  // 1. Test Trial Balance CSV Parser
  const tb = parseTrialBalanceCSV(SAMPLE_TRIAL_BALANCE_CSV);
  assert(tb.length === 20, `Real Data CSV Parser: Parsed ${tb.length} / 20 Trial Balance lines correctly`);

  const revenueLine = tb.find(l => l.accountCode === '4010');
  assert(revenueLine !== undefined && revenueLine.credit === 12800000, 'Real Data CSV Parser: Revenue line credit balance parsed correctly ($12,800,000)');

  // 2. Test General Ledger CSV Parser
  const gl = parseGeneralLedgerCSV(SAMPLE_GENERAL_LEDGER_CSV);
  assert(gl.journalEntries.length === 14, `Real Data GL Parser: Parsed ${gl.journalEntries.length} / 14 General Ledger entries`);
  assert(gl.transactionAmounts.length === 14, `Real Data GL Parser: Extracted ${gl.transactionAmounts.length} numeric transaction amounts for Benford Law test`);

  // 3. Test Bank Schedule CSV Parser
  const banks = parseBankAccountsCSV(SAMPLE_BANK_ACCOUNTS_CSV);
  assert(banks.length === 3, `Real Data Bank Parser: Parsed ${banks.length} bank accounts`);
  assert(banks[0].confirmationReceived === true && banks[1].confirmationReceived === false, 'Real Data Bank Parser: Confirmation received flags parsed correctly');

  // 4. Test Reconciliation Engine on Real Parsed Data
  const recon = runReconciliation(tb);
  assert(recon.passed === true, 'Reconciliation Engine: Real Trial Balance strictly balances (Debits = Credits)');

  // 5. Test Working Paper HTML Exporter
  const mockAuditResult: any = {
    engagementId: 'eng_real_test',
    stage: 'FIELDWORK',
    materiality: { overallMateriality: 170000, performanceMateriality: 127500 },
    overallFieldworkProgress: 88,
    findings: [{ id: 'f1', auditArea: 'Cash', agentSource: 'Agent', riskLevel: 'HIGH', description: 'Test finding', status: 'PENDING_REVIEW' }],
    reportPack: {
      status: 'AI_DRAFT',
      mandatoryDisclaimer: 'AI draft pending CA review',
      keyAuditMatters: [{ title: 'KAM 1', auditArea: 'Cash', whyConsideredKAM: 'High risk', howAddressedInAudit: 'Substantive testing' }]
    }
  };

  const html = exportWorkingPaperHTML(mockAuditResult);
  assert(html.includes('FinDit Statutory Audit Working Paper Package') && html.includes('170,000'), 'Working Paper Exporter: HTML working paper package generated successfully');

  console.log(`\nReal Data Summary: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('✅ ALL REAL DATA ENGINE VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runRealDataTests();
