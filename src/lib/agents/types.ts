export type AuditStatus = 'AI_DRAFT' | 'PENDING_REVIEW' | 'CA_APPROVED' | 'CA_OVERRIDDEN';

export type EngagementStage = 
  | 'SETUP'
  | 'PLANNING'
  | 'FIELDWORK'
  | 'REVIEW'
  | 'REPORTING'
  | 'CLOSED';

export interface AuditFinding {
  id: string;
  engagementId: string;
  auditArea: string;
  agentSource: string;
  description: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  evidenceRefs: string[];
  status: AuditStatus;
  overrideReason?: string;
  createdAt: string;
}

export interface ReviewItem {
  id: string;
  engagementId: string;
  findingId?: string;
  auditArea: string;
  escalationReason: string;
  suggestedAction: string;
  status: AuditStatus;
  decisionNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface PBCRequest {
  id: string;
  engagementId: string;
  auditArea: string;
  documentNeeded: string;
  triggerReason: string;
  status: 'PENDING' | 'UPLOADED' | 'WAIVED';
  createdAt: string;
}

export interface MaterialityCalculation {
  benchmarkType: 'REVENUE' | 'TOTAL_ASSETS' | 'PROFIT_BEFORE_TAX';
  benchmarkValue: number;
  overallPercentage: number;
  overallMateriality: number;
  performancePercentage: number;
  performanceMateriality: number;
  rationale: string;
}
