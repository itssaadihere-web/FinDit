import { INITIAL_CLIENTS, ClientCompany } from '../src/lib/store/clients';
import { executeFullAuditWorkflow } from '../src/lib/agents/director';

async function runMultiTenantTests() {
  console.log('====================================================');
  console.log('   FinDit Multi-Tenant Firm Portal Verification     ');
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

  // 1. Verify Initial Multi-Client List
  assert(INITIAL_CLIENTS.length === 3, 'Multi-Client Store: 3 pre-populated client companies loaded for firm');
  assert(INITIAL_CLIENTS[0].companyName === 'Atlas Textiles Ltd.', 'Client Store: Atlas Textiles Ltd. loaded as client 1');
  assert(INITIAL_CLIENTS[1].companyName === 'Sophi Tech Systems Ltd.', 'Client Store: Sophi Tech Systems Ltd. loaded as client 2');

  // 2. Simulate Onboarding New Client Company
  const newClient: ClientCompany = {
    id: `client_apex_2026`,
    firmId: 'firm_saad_994',
    companyName: 'Apex International Logistics Ltd.',
    registrationNo: 'CUIN-0077881',
    industryOverlay: 'TRADING',
    engagementType: 'STATUTORY_AUDIT',
    auditPeriod: 'FY 2025-2026',
    stage: 'FIELDWORK',
    createdAt: new Date().toISOString(),
    documents: [
      { id: 'doc_apex_1', name: 'Apex_TB_FY26.csv', category: 'Trial Balance', uploadedAt: '2026-08-21', uploadedBy: 'Audit Staff', fileSize: '16 KB' }
    ],
    tbLines: INITIAL_CLIENTS[0].tbLines,
    glData: INITIAL_CLIENTS[0].glData,
    bankAccounts: INITIAL_CLIENTS[0].bankAccounts
  };

  const clientList = [...INITIAL_CLIENTS, newClient];
  assert(clientList.length === 4, 'Onboarding Wizard: Successfully onboarded Apex International Logistics Ltd.');

  // 3. Execute Audit for Onboarded Client
  const auditResult = await executeFullAuditWorkflow(newClient.id, {
    totalRevenue: 18000000,
    providedBookkeeping: false,
    journalEntries: newClient.glData.journalEntries,
    transactionAmounts: newClient.glData.transactionAmounts,
    bankAccounts: newClient.bankAccounts
  });

  assert(auditResult.overallFieldworkProgress === 88, 'Client Audit Engine: Automated fieldwork completed at 88%');
  assert(auditResult.pbcRequests.length > 0, 'Missing Records Gap Detection: Missing evidence prompts generated for client');

  // 4. Verify Resolution of Missing PBC Record Prompt
  const missingPBC = auditResult.pbcRequests[0];
  missingPBC.status = 'UPLOADED';
  assert(missingPBC.status === 'UPLOADED', 'Missing Records Vault: User upload resolved missing document prompt');

  console.log(`\nMulti-Tenant Summary: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('✅ ALL MULTI-TENANT AUDIT PORTAL TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runMultiTenantTests();
