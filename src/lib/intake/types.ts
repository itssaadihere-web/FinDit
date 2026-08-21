export interface DocumentItem {
  id: string;
  engagementId: string;
  fileName: string;
  fileType: 'PDF' | 'XLSX' | 'CSV' | 'SCAN';
  auditArea: string;
  fileUrl: string;
  extractionStatus: 'PENDING' | 'CLASSIFIED' | 'EXTRACTED' | 'FAILED';
  extractedSummary?: string;
  createdAt: string;
}

export interface ReconciliationResult {
  passed: boolean;
  checkedAt: string;
  checks: {
    name: string;
    description: string;
    passed: boolean;
    difference: number;
    details: string;
  }[];
}

export interface TrialBalanceLine {
  accountCode: string;
  accountName: string;
  auditArea: string;
  debit: number;
  credit: number;
}
