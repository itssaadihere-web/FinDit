import { callLLM } from '../llm/router';
import { AuditFinding } from './types';

export interface FinancialRatios {
  currentRatio: number;
  quickRatio: number;
  grossProfitMargin: number;
  debtToEquity: number;
  inventoryTurnover: number;
}

export interface BenfordResult {
  digit: number;
  actualFreq: number;
  expectedFreq: number;
  isAnomalous: boolean;
}

export interface DuplicatePayment {
  vendorName: string;
  amount: number;
  date1: string;
  date2: string;
  ref1: string;
  ref2: string;
}

export async function runAnalyticalProceduresAgent(
  engagementId: string,
  currentRatios: FinancialRatios,
  priorRatios: FinancialRatios,
  transactionAmounts: number[],
  samplePayments: { vendorName: string; amount: number; date: string; ref: string }[]
): Promise<{
  findings: AuditFinding[];
  benfordResults: BenfordResult[];
  duplicatePayments: DuplicatePayment[];
}> {
  const findings: AuditFinding[] = [];
  const duplicatePayments: DuplicatePayment[] = [];

  // 1. Ratio & Trend Analysis (ISA 520)
  const gpMarginDiff = (currentRatios.grossProfitMargin - priorRatios.grossProfitMargin) * 100;
  if (Math.abs(gpMarginDiff) > 5) {
    findings.push({
      id: `find_an_gp_${Date.now()}`,
      engagementId,
      auditArea: 'Analytical Procedures (ISA 520)',
      agentSource: 'Analytical Procedures Agent',
      description: `Significant Gross Margin fluctuation: Gross margin shifted by ${gpMarginDiff > 0 ? '+' : ''}${gpMarginDiff.toFixed(2)}% compared to prior period (${(priorRatios.grossProfitMargin * 100).toFixed(1)}% -> ${(currentRatios.grossProfitMargin * 100).toFixed(1)}%). Requires detailed revenue & COGS cut-off verification.`,
      riskLevel: 'HIGH',
      evidenceRefs: ['Financial_Statement_Ratios.json'],
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString()
    });
  }

  // 2. Benford's Law First-Digit Distribution Test
  const expectedBenford: Record<number, number> = {
    1: 0.301, 2: 0.176, 3: 0.125, 4: 0.097, 5: 0.079, 6: 0.067, 7: 0.058, 8: 0.051, 9: 0.046
  };

  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
  let validCount = 0;

  for (const amt of transactionAmounts) {
    if (amt > 0) {
      const firstDigit = parseInt(Math.abs(amt).toString().replace(/^0+/, '').charAt(0), 10);
      if (firstDigit >= 1 && firstDigit <= 9) {
        counts[firstDigit]++;
        validCount++;
      }
    }
  }

  const benfordResults: BenfordResult[] = [];
  let totalAnomalies = 0;

  for (let d = 1; d <= 9; d++) {
    const actualFreq = validCount > 0 ? counts[d] / validCount : 0;
    const expectedFreq = expectedBenford[d];
    const isAnomalous = Math.abs(actualFreq - expectedFreq) > 0.08;
    if (isAnomalous) totalAnomalies++;

    benfordResults.push({
      digit: d,
      actualFreq: parseFloat(actualFreq.toFixed(3)),
      expectedFreq,
      isAnomalous
    });
  }

  if (totalAnomalies >= 2) {
    findings.push({
      id: `find_an_benford_${Date.now()}`,
      engagementId,
      auditArea: 'Analytical Procedures (ISA 520)',
      agentSource: 'Analytical Procedures Agent',
      description: `Benford's Law First-Digit anomaly detected: ${totalAnomalies} digits showed significant deviation from natural mathematical distribution across ${validCount} journal transactions. Potential indicator of manual transaction splitting or artificial posting.`,
      riskLevel: 'MEDIUM',
      evidenceRefs: ['Benford_Digit_Distribution.json'],
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString()
    });
  }

  // 3. Duplicate Payment Detection
  const paymentMap = new Map<string, typeof samplePayments[0]>();
  for (const p of samplePayments) {
    const key = `${p.vendorName.toLowerCase()}_${p.amount}`;
    if (paymentMap.has(key)) {
      const prev = paymentMap.get(key)!;
      duplicatePayments.push({
        vendorName: p.vendorName,
        amount: p.amount,
        date1: prev.date,
        date2: p.date,
        ref1: prev.ref,
        ref2: p.ref
      });
    } else {
      paymentMap.set(key, p);
    }
  }

  if (duplicatePayments.length > 0) {
    findings.push({
      id: `find_an_dup_${Date.now()}`,
      engagementId,
      auditArea: 'Payables & Disbursements',
      agentSource: 'Analytical Procedures Agent',
      description: `Duplicate disbursement scan identified ${duplicatePayments.length} identical payment pair(s) with matching vendor name and exact amount. Total potential overpayment: $${duplicatePayments.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}.`,
      riskLevel: 'HIGH',
      evidenceRefs: duplicatePayments.map(d => `${d.ref1}_${d.ref2}`),
      status: 'PENDING_REVIEW',
      createdAt: new Date().toISOString()
    });
  }

  // 4. Gemini Bulk Numeric LLM Call
  await callLLM('BULK_NUMERIC_ANALYTICS', {
    engagementId,
    prompt: `Perform bulk numeric pass on ${transactionAmounts.length} GL lines. Benford anomalies: ${totalAnomalies}. Duplicate payments: ${duplicatePayments.length}.`,
    contextData: { transactionCount: transactionAmounts.length }
  });

  return {
    findings,
    benfordResults,
    duplicatePayments
  };
}
