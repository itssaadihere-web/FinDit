import { AuditExecutionResult } from '../agents/director';
import { TrialBalanceLine } from '../intake/types';
import { JournalEntry } from '../agents/fraud';
import { BankAccount } from '../agents/substantive/cash_bank';
import { SAMPLE_TRIAL_BALANCE_CSV, SAMPLE_GENERAL_LEDGER_CSV, SAMPLE_BANK_ACCOUNTS_CSV } from '../intake/templates';
import { parseTrialBalanceCSV, parseGeneralLedgerCSV, parseBankAccountsCSV } from '../intake/parser';

export interface DocumentRecord {
  id: string;
  name: string;
  category: 'Trial Balance' | 'General Ledger' | 'Bank Statement' | 'Board Minutes' | 'Notes' | 'Other';
  uploadedAt: string;
  uploadedBy: string;
  fileSize: string;
}

export interface ClientCompany {
  id: string;
  firmId: string;
  companyName: string;
  registrationNo: string;
  industryOverlay: 'MANUFACTURING' | 'TRADING' | 'SERVICES';
  engagementType: 'STATUTORY_AUDIT' | 'LIMITED_REVIEW' | 'AGREED_UPON_PROCEDURES';
  auditPeriod: string;
  stage: 'SETUP' | 'PLANNING' | 'FIELDWORK' | 'REVIEW' | 'REPORTING' | 'CLOSED';
  createdAt: string;
  documents: DocumentRecord[];
  tbLines: TrialBalanceLine[];
  glData: { journalEntries: JournalEntry[]; transactionAmounts: number[] };
  bankAccounts: BankAccount[];
  auditResult?: AuditExecutionResult;
}

// Initial pre-populated real client companies for demonstration
export const INITIAL_CLIENTS: ClientCompany[] = [
  {
    id: 'client_atlas_2026',
    firmId: 'firm_saad_994',
    companyName: 'Atlas Textiles Ltd.',
    registrationNo: 'CUIN-0091823',
    industryOverlay: 'MANUFACTURING',
    engagementType: 'STATUTORY_AUDIT',
    auditPeriod: 'FY 2025-2026',
    stage: 'FIELDWORK',
    createdAt: '2026-07-01T10:00:00Z',
    documents: [
      { id: 'doc_1', name: 'Atlas_Trial_Balance_FY26.csv', category: 'Trial Balance', uploadedAt: '2026-07-01', uploadedBy: 'Client CFO', fileSize: '14 KB' },
      { id: 'doc_2', name: 'Atlas_General_Ledger_Posting.csv', category: 'General Ledger', uploadedAt: '2026-07-01', uploadedBy: 'Client CFO', fileSize: '128 KB' },
      { id: 'doc_3', name: 'Bank_Statements_SCB_HBL.pdf', category: 'Bank Statement', uploadedAt: '2026-07-02', uploadedBy: 'Audit Staff', fileSize: '1.4 MB' },
      { id: 'doc_4', name: 'Draft_Notes_To_Financials.pdf', category: 'Notes', uploadedAt: '2026-07-03', uploadedBy: 'Client Controller', fileSize: '450 KB' }
    ],
    tbLines: parseTrialBalanceCSV(SAMPLE_TRIAL_BALANCE_CSV),
    glData: parseGeneralLedgerCSV(SAMPLE_GENERAL_LEDGER_CSV),
    bankAccounts: parseBankAccountsCSV(SAMPLE_BANK_ACCOUNTS_CSV)
  },
  {
    id: 'client_sophi_2026',
    firmId: 'firm_saad_994',
    companyName: 'Sophi Tech Systems Ltd.',
    registrationNo: 'CUIN-0044190',
    industryOverlay: 'SERVICES',
    engagementType: 'LIMITED_REVIEW',
    auditPeriod: 'FY 2025-2026',
    stage: 'PLANNING',
    createdAt: '2026-07-15T14:30:00Z',
    documents: [
      { id: 'doc_10', name: 'Sophi_TB_Q4.csv', category: 'Trial Balance', uploadedAt: '2026-07-15', uploadedBy: 'Finance Lead', fileSize: '18 KB' },
      { id: 'doc_11', name: 'Sophi_Bank_Confirmation.pdf', category: 'Bank Statement', uploadedAt: '2026-07-16', uploadedBy: 'Audit Staff', fileSize: '850 KB' }
    ],
    tbLines: parseTrialBalanceCSV(SAMPLE_TRIAL_BALANCE_CSV),
    glData: parseGeneralLedgerCSV(SAMPLE_GENERAL_LEDGER_CSV),
    bankAccounts: parseBankAccountsCSV(SAMPLE_BANK_ACCOUNTS_CSV)
  },
  {
    id: 'client_vision_2026',
    firmId: 'firm_saad_994',
    companyName: 'Vision Logistics & Trading Corp',
    registrationNo: 'CUIN-0081239',
    industryOverlay: 'TRADING',
    engagementType: 'STATUTORY_AUDIT',
    auditPeriod: 'FY 2025-2026',
    stage: 'REVIEW',
    createdAt: '2026-06-10T09:15:00Z',
    documents: [
      { id: 'doc_20', name: 'Vision_TB_Final.csv', category: 'Trial Balance', uploadedAt: '2026-06-10', uploadedBy: 'Controller', fileSize: '22 KB' },
      { id: 'doc_21', name: 'Vision_GL_Extract.csv', category: 'General Ledger', uploadedAt: '2026-06-11', uploadedBy: 'Controller', fileSize: '210 KB' }
    ],
    tbLines: parseTrialBalanceCSV(SAMPLE_TRIAL_BALANCE_CSV),
    glData: parseGeneralLedgerCSV(SAMPLE_GENERAL_LEDGER_CSV),
    bankAccounts: parseBankAccountsCSV(SAMPLE_BANK_ACCOUNTS_CSV)
  }
];
