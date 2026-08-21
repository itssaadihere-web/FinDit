import { TrialBalanceLine } from './types';
import { JournalEntry } from '../agents/fraud';
import { BankAccount } from '../agents/substantive/cash_bank';

/**
 * Dynamically infers audit area based on account code or account name keywords.
 */
export function inferAuditArea(accountCode: string, accountName: string): string {
  const name = accountName.toLowerCase();
  const code = accountCode.trim();

  if (/cash|bank|petty|scb|hbl|mczb|ubl|chq/i.test(name) || /^10/i.test(code)) return 'Cash & Bank';
  if (/receivable|debtor|ar|customer|sales/i.test(name) || /^11/i.test(code)) return 'Revenue & Receivables';
  if (/inventory|stock|raw material|finished/i.test(name) || /^12/i.test(code)) return 'Inventory';
  if (/asset|equipment|machinery|building|vehicle|ppe|depreciation/i.test(name) || /^15/i.test(code)) return 'Fixed Assets (PPE)';
  if (/payable|creditor|ap|vendor|accrual/i.test(name) || /^20/i.test(code)) return 'Payables & Accruals';
  if (/provision|contingent|tax|taxation|legal/i.test(name) || /^25/i.test(code)) return 'Provisions & Contingencies';
  if (/capital|share|reserve|retained earnings|equity/i.test(name) || /^30/i.test(code)) return 'Equity & Reserves';
  if (/sales|revenue|income|turnover/i.test(name) || /^40/i.test(code)) return 'Revenue & Receivables';
  if (/cost of sales|cogs|purchase|direct labor/i.test(name) || /^50/i.test(code)) return 'Cost of Sales';
  if (/payroll|salary|wage|benefit|headcount/i.test(name) || /^61/i.test(code)) return 'Payroll';
  return 'Operating Expenses';
}

/**
 * Parses raw Trial Balance CSV text into structured TrialBalanceLine array.
 * Expected columns: AccountCode, AccountName, Debit, Credit, (optional: AuditArea)
 */
export function parseTrialBalanceCSV(csvText: string): TrialBalanceLine[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const codeIdx = headers.findIndex(h => h.includes('code') || h.includes('account'));
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('description') || h.includes('title'));
  const debitIdx = headers.findIndex(h => h.includes('debit') || h.includes('dr'));
  const creditIdx = headers.findIndex(h => h.includes('credit') || h.includes('cr'));
  const areaIdx = headers.findIndex(h => h.includes('area') || h.includes('category'));

  const result: TrialBalanceLine[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Simple CSV splitter handling quotes
    const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 2) continue;

    const accountCode = cols[codeIdx >= 0 ? codeIdx : 0] || `ACC_${i}`;
    const accountName = cols[nameIdx >= 0 ? nameIdx : 1] || `Account ${i}`;
    const debit = parseFloat((cols[debitIdx >= 0 ? debitIdx : 2] || '0').replace(/[^0-9.-]+/g, '')) || 0;
    const credit = parseFloat((cols[creditIdx >= 0 ? creditIdx : 3] || '0').replace(/[^0-9.-]+/g, '')) || 0;
    const auditArea = (areaIdx >= 0 && cols[areaIdx]) ? cols[areaIdx] : inferAuditArea(accountCode, accountName);

    result.push({
      accountCode,
      accountName,
      debit,
      credit,
      auditArea
    });
  }

  return result;
}

/**
 * Parses raw General Ledger CSV text into structured JournalEntry array.
 * Expected columns: ID/Ref, Date, AccountCode, AccountName, Amount, Narration, PostedBy
 */
export function parseGeneralLedgerCSV(csvText: string): { journalEntries: JournalEntry[]; transactionAmounts: number[] } {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return { journalEntries: [], transactionAmounts: [] };

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const idIdx = headers.findIndex(h => h.includes('id') || h.includes('ref') || h.includes('voucher'));
  const dateIdx = headers.findIndex(h => h.includes('date'));
  const codeIdx = headers.findIndex(h => h.includes('code') || h.includes('account'));
  const nameIdx = headers.findIndex(h => h.includes('name') || h.includes('accountname'));
  const amountIdx = headers.findIndex(h => h.includes('amount') || h.includes('debit') || h.includes('val'));
  const narrationIdx = headers.findIndex(h => h.includes('narration') || h.includes('description') || h.includes('memo'));
  const postedIdx = headers.findIndex(h => h.includes('posted') || h.includes('user') || h.includes('author'));

  const journalEntries: JournalEntry[] = [];
  const transactionAmounts: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 2) continue;

    const id = cols[idIdx >= 0 ? idIdx : 0] || `JE_${100 + i}`;
    const date = cols[dateIdx >= 0 ? dateIdx : 1] || '2025-12-31';
    const accountCode = cols[codeIdx >= 0 ? codeIdx : 2] || '4000';
    const accountName = cols[nameIdx >= 0 ? nameIdx : 3] || 'General Transaction';
    const rawAmt = (cols[amountIdx >= 0 ? amountIdx : 4] || '0').replace(/[^0-9.-]+/g, '');
    const amount = Math.abs(parseFloat(rawAmt) || 0);
    const narration = cols[narrationIdx >= 0 ? narrationIdx : 5] || 'GL Posting';
    const postedBy = cols[postedIdx >= 0 ? postedIdx : 6] || 'Staff Accountant';

    const isPostClose = /post-close|year-end adjustment|closing entry|dec 31/i.test(narration) || /12-31|12\/31/.test(date);

    journalEntries.push({
      id,
      date,
      accountCode,
      accountName,
      amount,
      narration,
      postedBy,
      isPostClose
    });

    if (amount > 0) {
      transactionAmounts.push(amount);
    }
  }

  return { journalEntries, transactionAmounts };
}

/**
 * Parses Bank Schedule CSV into structured BankAccount array.
 */
export function parseBankAccountsCSV(csvText: string): BankAccount[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length <= 1) return [];

  const result: BankAccount[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map(c => c.replace(/^"|"$/g, '').trim());
    if (cols.length < 3) continue;

    const accountNumber = cols[0] || `ACC_${i}`;
    const bankName = cols[1] || 'Commercial Bank';
    const glBalance = parseFloat(cols[2]?.replace(/[^0-9.-]+/g, '') || '0') || 0;
    const bankStatementBalance = parseFloat(cols[3]?.replace(/[^0-9.-]+/g, '') || '0') || glBalance;
    const confirmationReceived = cols[4]?.toLowerCase() === 'true' || cols[4]?.toLowerCase() === 'yes';
    const confirmationBalance = confirmationReceived ? (parseFloat(cols[5]?.replace(/[^0-9.-]+/g, '') || '0') || bankStatementBalance) : undefined;
    const reconcilingItemsTotal = parseFloat(cols[6]?.replace(/[^0-9.-]+/g, '') || '0') || 0;

    result.push({
      accountNumber,
      bankName,
      glBalance,
      bankStatementBalance,
      confirmationReceived,
      confirmationBalance,
      reconcilingItemsTotal
    });
  }

  return result;
}
