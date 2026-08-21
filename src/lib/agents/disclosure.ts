import { AuditFinding } from './types';

export interface DisclosureCheckItem {
  standardRef: string; // e.g., "IFRS 15.110", "IAS 37.84", "IAS 24.18"
  topic: string;
  requiredDisclosure: string;
  isDisclosed: boolean;
  notes?: string;
}

export async function runDisclosureChecklistAgent(
  engagementId: string,
  draftNoteDisclosures: string[]
): Promise<{
  findings: AuditFinding[];
  checklistResults: DisclosureCheckItem[];
  completenessScore: number;
}> {
  const mandatoryItems: Omit<DisclosureCheckItem, 'isDisclosed' | 'notes'>[] = [
    {
      standardRef: 'IFRS 15.110',
      topic: 'Revenue Recognition Accounting Policy',
      requiredDisclosure: 'Disclose disaggregated revenue channels, performance obligations, and timing of satisfaction (point-in-time vs over-time).'
    },
    {
      standardRef: 'IAS 24.18',
      topic: 'Related Party Disclosures',
      requiredDisclosure: 'Disclose amount of related party transactions, outstanding balances, commitments, and key management compensation.'
    },
    {
      standardRef: 'IAS 37.84',
      topic: 'Provisions & Contingencies',
      requiredDisclosure: 'Reconciliation of carrying amount for each class of provision from beginning to end of period, including description of obligation.'
    },
    {
      standardRef: 'IAS 1.125',
      topic: 'Sources of Estimation Uncertainty',
      requiredDisclosure: 'Disclose key assumptions concerning the future and major sources of estimation uncertainty with significant risk of material adjustment.'
    }
  ];

  const fullText = draftNoteDisclosures.join(' ').toLowerCase();
  const checklistResults: DisclosureCheckItem[] = [];
  let disclosedCount = 0;
  const findings: AuditFinding[] = [];

  for (const item of mandatoryItems) {
    let isDisclosed = false;
    if (item.standardRef.includes('15') && /revenue|performance obligation|point in time/i.test(fullText)) {
      isDisclosed = true;
    } else if (item.standardRef.includes('24') && /related party|management compensation|key management/i.test(fullText)) {
      isDisclosed = true;
    } else if (item.standardRef.includes('37') && /provision|contingent|legal claim/i.test(fullText)) {
      isDisclosed = true;
    } else if (item.standardRef.includes('1') && /estimation|uncertainty|assumptions/i.test(fullText)) {
      isDisclosed = true;
    }

    if (isDisclosed) {
      disclosedCount++;
    } else {
      findings.push({
        id: `find_disc_${item.standardRef.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`,
        engagementId,
        auditArea: 'Financial Statement Disclosures',
        agentSource: 'Disclosure Checklist Agent (IFRS)',
        description: `Disclosure Gap under ${item.standardRef}: Missing mandatory disclosure regarding ${item.topic}. ${item.requiredDisclosure}`,
        riskLevel: 'HIGH',
        evidenceRefs: ['Draft_FS_Notes.pdf'],
        status: 'PENDING_REVIEW',
        createdAt: new Date().toISOString()
      });
    }

    checklistResults.push({
      ...item,
      isDisclosed,
      notes: isDisclosed ? 'Disclosure requirement satisfied in draft notes.' : 'MISSING: Disclosure gap identified.'
    });
  }

  const completenessScore = parseFloat(((disclosedCount / mandatoryItems.length) * 100).toFixed(1));

  return {
    findings,
    checklistResults,
    completenessScore
  };
}
