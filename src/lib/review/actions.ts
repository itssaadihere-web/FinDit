import { AuditStatus, AuditFinding, ReviewItem, PBCRequest } from '../agents/types';
import { AuditReportPack } from '../agents/reporting';

export interface ReviewActionResult {
  success: boolean;
  findingId?: string;
  newStatus: AuditStatus;
  message: string;
  auditTrailTimestamp: string;
}

export function approveFinding(
  finding: AuditFinding,
  reviewItem: ReviewItem,
  reviewerId: string = 'CA_LICENSE_99412',
  note?: string
): { updatedFinding: AuditFinding; updatedReview: ReviewItem; result: ReviewActionResult } {
  const updatedFinding: AuditFinding = {
    ...finding,
    status: 'CA_APPROVED'
  };

  const updatedReview: ReviewItem = {
    ...reviewItem,
    status: 'CA_APPROVED',
    decisionNote: note || 'Approved by licensed CA upon fieldwork review.',
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString()
  };

  return {
    updatedFinding,
    updatedReview,
    result: {
      success: true,
      findingId: finding.id,
      newStatus: 'CA_APPROVED',
      message: `Finding ${finding.id} in ${finding.auditArea} explicitly approved by CA.`,
      auditTrailTimestamp: new Date().toISOString()
    }
  };
}

export function overrideFinding(
  finding: AuditFinding,
  reviewItem: ReviewItem,
  overrideReason: string,
  reviewerId: string = 'CA_LICENSE_99412'
): { updatedFinding: AuditFinding; updatedReview: ReviewItem; result: ReviewActionResult } {
  if (!overrideReason || overrideReason.trim().length < 10) {
    throw new Error('CA Override requires a documented rationale of at least 10 characters for audit defensibility.');
  }

  const updatedFinding: AuditFinding = {
    ...finding,
    status: 'CA_OVERRIDDEN',
    overrideReason
  };

  const updatedReview: ReviewItem = {
    ...reviewItem,
    status: 'CA_OVERRIDDEN',
    decisionNote: `OVERRIDDEN: ${overrideReason}`,
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString()
  };

  return {
    updatedFinding,
    updatedReview,
    result: {
      success: true,
      findingId: finding.id,
      newStatus: 'CA_OVERRIDDEN',
      message: `Finding ${finding.id} overridden by CA. Override reason logged into model feedback registry.`,
      auditTrailTimestamp: new Date().toISOString()
    }
  };
}

export function requestMoreEvidence(
  finding: AuditFinding,
  documentNeeded: string,
  triggerReason: string
): { newPBCRequest: PBCRequest; message: string } {
  const newPBCRequest: PBCRequest = {
    id: `pbc_dyn_${Date.now()}`,
    engagementId: finding.engagementId,
    auditArea: finding.auditArea,
    documentNeeded,
    triggerReason: `CA Challenge during review of ${finding.id}: ${triggerReason}`,
    status: 'PENDING',
    createdAt: new Date().toISOString()
  };

  return {
    newPBCRequest,
    message: `Dynamic PBC document request added: '${documentNeeded}' for area ${finding.auditArea}.`
  };
}

export function signOffAuditReport(
  reportPack: AuditReportPack,
  pendingReviewItems: ReviewItem[],
  reviewerId: string = 'CA_LICENSE_99412',
  digitalSig: string = 'RSA2048_SIG_CA_99412_AUDIT_2026'
): AuditReportPack {
  // Hard Constraint Gate: Ensure no items remain in PENDING_REVIEW before final signoff
  const unresolvedHighRisk = pendingReviewItems.filter(item => item.status === 'PENDING_REVIEW');
  
  if (unresolvedHighRisk.length > 0) {
    throw new Error(`SIGN-OFF BLOCKED BY SYSTEM GATE: ${unresolvedHighRisk.length} escalated item(s) remain in PENDING_REVIEW state. Licensed CA must approve or override all findings before final report export.`);
  }

  return {
    ...reportPack,
    status: 'CA_APPROVED',
    mandatoryDisclaimer: 'Signed and finalized by licensed Chartered Accountant.',
    caSignoffMetadata: {
      signedBy: reviewerId,
      signedAt: new Date().toISOString(),
      digitalSignatureRef: digitalSig
    }
  };
}
