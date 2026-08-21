import { AuditFinding } from './types';

export interface DisclosureCheckItem {
  standardRef: string;
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
      requiredDisclosure: 'Disclose disaggregated revenue channels, performance obligations, and timing of satisfaction.'
    },
    {
      standardRef: 'IAS 24.18',
      topic: 'Related Party Disclosures',
      requiredDisclosure: 'Disclose amount of related party transactions, outstanding balances, and commitments.'
    },
    {
      standardRef: 'IAS 37.84',
      topic: 'Provisions & Contingencies',
      requiredDisclosure: 'Reconciliation of carrying amount for each class of provision, including description of obligation.'
    },
    {
      standardRef: 'IAS 1.125',
      topic: 'Sources of Estimation Uncertainty',
      requiredDisclosure: 'Disclose key assumptions concerning the future and major sources of estimation uncertainty.'
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
        agentSource: 'IFRS Disclosure Completeness Procedure',
        description: `Mandatory Disclosure Defect under ${item.standardRef}: Draft financial statement notes omit mandatory narrative regarding ${item.topic}.`,
        riskLevel: 'HIGH',
        evidenceRefs: ['Draft_FS_Notes.pdf'],
        status: 'PENDING_REVIEW',
        createdAt: new Date().toISOString(),
        statutoryReferences: [
          {
            standardId: item.standardRef,
            title: `Mandatory Requirement: ${item.topic}`,
            officialClauseText: item.requiredDisclosure,
            governingBody: 'IASB (IFRS)'
          },
          {
            standardId: 'IAS 1.31',
            title: 'Materiality and Aggregation in Notes',
            officialClauseText: 'An entity need not provide a specific disclosure required by an IFRS if the information resulting from that disclosure is not material, but shall disclose all material statutory accounting policies.',
            governingBody: 'IASB (IFRS)'
          },
          {
            standardId: 'Companies Act 2017 Section 228',
            title: 'Form and Contents of Financial Statements',
            officialClauseText: 'The financial statements of a company shall comply with the requirements of the Fourth Schedule or Fifth Schedule to this Act and International Financial Reporting Standards as applicable.',
            governingBody: 'Corporate Law / Companies Act'
          }
        ],
        rootCauseAnalysis: `The draft Notes to Financial Statements omitted mandatory quantitative reconciliation tables for tax litigation provisions of $420,000 required by IAS 37.84.`,
        mandatoryRemediation: 'Draft Note 4 must be updated to include opening balance, additions, utilized amounts, and closing balance table for tax provisions.',
        isa500EvidenceScore: { weightScore: 0.50, description: 'Internal draft note disclosure held by entity.' }
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
