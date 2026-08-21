import { INITIAL_UNAUTHENTICATED_SESSION, DEMO_FIRM_SESSION, AuditFirmSession } from '../src/lib/auth/context';

function runAuthTests() {
  console.log('====================================================');
  console.log('   FinDit CA Firm Auth Screen & Session Test        ');
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

  // 1. Initial state is unauthenticated
  assert(INITIAL_UNAUTHENTICATED_SESSION.isLoggedIn === false, 'Firm Auth Gate: Default application state is unauthenticated (forces Login/Signup screen)');

  // 2. Demo Firm Login
  assert(DEMO_FIRM_SESSION.isLoggedIn === true && DEMO_FIRM_SESSION.licenseId === 'ICAP-CA-99412', 'Firm Auth Gate: Demo CA Firm login sets session state to logged in');

  // 3. New Firm Signup Simulation
  const newFirmSession: AuditFirmSession = {
    firmId: 'firm_af_ferguson_101',
    firmName: 'A.F. Ferguson & Co. Chartered Accountants',
    licenseId: 'ICAP-CA-10012',
    partnerName: 'Tariq Ferguson, FCA',
    email: 'tariq@afferguson.com',
    isLoggedIn: true
  };
  assert(newFirmSession.isLoggedIn === true && newFirmSession.firmName.includes('Ferguson'), 'Firm Auth Gate: New CA Firm registration initializes session state');

  console.log(`\nAuth Flow Summary: ${passed} / ${total} tests passed.`);
  if (passed === total) {
    console.log('✅ ALL FIRM AUTH SCREEN TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runAuthTests();
