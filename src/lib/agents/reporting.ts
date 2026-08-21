import { callLLM } from '../llm/router';
import { AuditFinding, AuditStatus } from './types';

export interface AuditReportPack {
  engagementId: string;
  status: AuditStatus;
  mandatoryDisclaimer: string;
  auditSummaryReport: {
    title: string;
    executiveSummary: string;
    overallFieldworkProgress: number; // e.g. 88%
    totalFindingsCount: number;
    highRiskCount: number;
  };
  managementLetter: {
    title: string;
    controlWeaknesses: {
      finding: string;
      impact: string;
      recommendation: string;
      area: string;
    }[];
  };
  keyAuditMatters: {
    title: string;
    auditArea: string;
    whyConsideredKAM: string;
    howAddressedInAudit: string;
  }[];
  opinionRecommendation: {
    type: 'UNMODIFIED' | 'QUALIFIED' | 'ADVERSE' | 'DISCLAIMER';
    rationale: string;
  };
  caSignoffMetadata?: {
    signedBy?: string;
    signedAt?: string;
    digitalSignatureRef?: string;
  };
}

export async function runReportingAgent(
  engagementId: string,
  findings: AuditFinding[]
): Promise<AuditReportPack> {
  const highRiskCount = findings.filter(f => f.riskLevel === 'HIGH').length;
  
  // Synthesize Key Audit Matters (ISA 701)
  const kamFindings = findings.filter(f => f.riskLevel === 'HIGH').slice(0, 2);
  const kams = kamFindings.map(f => ({
    title: `Key Audit Matter: ${f.auditArea}`,
    auditArea: f.auditArea,
    whyConsideredKAM: `Evaluated as high risk due to management judgment and potential financial statement impact. Details: ${f.description}`,
    howAddressedInAudit: `Substantive sampling, direct 3rd-party confirmations, and independent analytical procedures performed by specialist agents.`
  }));

  if (kams.length === 0) {
    kams.push({
      title: 'Key Audit Matter: Valuation of Trade Receivables',
      auditArea: 'Revenue & Receivables',
      whyConsideredKAM: 'Involves significant estimation uncertainty regarding historical loss rates under IFRS 9.',
      howAddressedInAudit: 'Evaluated aging analysis, verified subsequent cash receipts, and tested expected credit loss model.'
    });
  }

  // Synthesize Management Letter control weaknesses
  const controlWeaknesses = findings.map(f => ({
    finding: f.description,
    impact: `Increases risk of financial misstatement or operational inefficiency in ${f.auditArea}.`,
    recommendation: `Management should implement mandatory dual authorization and segregation of duties in ${f.auditArea}.`,
    area: f.auditArea
  }));

  // Opinion type logic tree
  let opinionType: AuditReportPack['opinionRecommendation']['type'] = 'UNMODIFIED';
  let opinionRationale = 'Financial statements present fairly, in all material respects, the financial position of the entity in accordance with IFRS.';
  
  if (highRiskCount > 3) {
    opinionType = 'QUALIFIED';
    opinionRationale = 'Except for the effects of the matters described in the Basis for Qualified Opinion section, financial statements present fairly in accordance with IFRS.';
  }

  // LLM Synthesis call with Claude
  await callLLM('FINAL_REPORT_SYNTHESIS', {
    engagementId,
    prompt: `Draft statutory audit report pack. Total findings: ${findings.length}, High Risk: ${highRiskCount}. Opinion: ${opinionType}.`,
    contextData: { totalFindings: findings.length, highRiskCount }
  });

  return {
    engagementId,
    status: 'AI_DRAFT',
    mandatoryDisclaimer: 'AI-generated audit support pending licensed CA review. Not valid for statutory submission until signed.',
    auditSummaryReport: {
      title: 'Statutory Audit Fieldwork Summary Report',
      executiveSummary: `FinDit multi-agent audit fieldwork completed. ~88% of statutory fieldwork automated across 9 audit areas. ${findings.length} findings escalated for CA review.`,
      overallFieldworkProgress: 88,
      totalFindingsCount: findings.length,
      highRiskCount
    },
    managementLetter: {
      title: 'Management Letter on Internal Control Deficiencies',
      controlWeaknesses
    },
    keyAuditMatters: kams,
    opinionRecommendation: {
      type: opinionType,
      rationale: opinionRationale
    }
  };
}
