export const SAMPLE_TRIAL_BALANCE_CSV = `AccountCode,AccountName,Debit,Credit,AuditArea
1010,"Standard Chartered Bank - Main A/C",1750000.00,0.00,"Cash & Bank"
1020,"Habib Bank Limited - Operational A/C",450000.00,0.00,"Cash & Bank"
1050,"Petty Cash Fund",25000.00,0.00,"Cash & Bank"
1100,"Trade Receivables (AR Control)",2850000.00,0.00,"Revenue & Receivables"
1200,"Raw Material Stock (Cotton & Yarns)",1400000.00,0.00,"Inventory"
1250,"Finished Goods Stock (Fabric Rolls)",950000.00,0.00,"Inventory"
1510,"Plant & Textile Machinery (Cost)",4200000.00,0.00,"Fixed Assets (PPE)"
1520,"Accumulated Depreciation - Machinery",0.00,1100000.00,"Fixed Assets (PPE)"
2010,"Trade Payables (AP Control)",0.00,2150000.00,"Payables & Accruals"
2050,"Accrued Operating Expenses",0.00,180000.00,"Payables & Accruals"
2500,"Provision for Taxation",0.00,420000.00,"Provisions & Contingencies"
3010,"Paid-up Share Capital",0.00,4000000.00,"Equity & Reserves"
3050,"Retained Earnings",0.00,1825000.00,"Equity & Reserves"
4010,"Export Sales Revenue",0.00,12800000.00,"Revenue & Receivables"
4020,"Domestic Sales Revenue",0.00,4200000.00,"Revenue & Receivables"
5010,"Cost of Goods Sold - Materials",8900000.00,0.00,"Cost of Sales"
5020,"Direct Labor & Mill Overhead",2400000.00,0.00,"Cost of Sales"
6010,"Salaries & Executive Compensation",1850000.00,0.00,"Payroll"
6020,"Utilities & Energy Expenses",1100000.00,0.00,"Operating Expenses"
6050,"Consulting & Related Party Fees",800000.00,0.00,"Operating Expenses"`;

export const SAMPLE_GENERAL_LEDGER_CSV = `VoucherID,Date,AccountCode,AccountName,Amount,Narration,PostedBy
JE-901,2025-12-31,4010,"Export Sales Revenue",500000,"Post-close manual revenue credit adjustment",CFO
JE-902,2025-06-15,6050,"Consulting Fees",180000,"Payment to Apex Holding (Disclosed Related Party)",Senior Accountant
JE-903,2025-04-10,2010,"Trade Payables",85000,"Payment for Cotton Invoice #INV-4011",Disbursement Officer
JE-904,2025-04-12,2010,"Trade Payables",85000,"Duplicate Payment for Cotton Invoice #INV-4011",Disbursement Officer
JE-905,2025-11-20,1010,"Standard Chartered Bank",1200000,"Transfer to Subsidiary Account",CFO
JE-906,2025-01-15,6010,"Salaries & Executive Compensation",150000,"Monthly Staff Salary Disbursement",HR Director
JE-907,2025-02-18,6020,"Utilities & Energy Expenses",92000,"Power Mill Utility Bill",Plant Manager
JE-908,2025-03-22,1200,"Raw Material Stock",340000,"Raw Yarn Purchase - Invoice #9912",Procurement Lead
JE-909,2025-05-19,1510,"Plant & Textile Machinery",750000,"Weaving Loom Machine Purchase",CFO
JE-910,2025-07-11,4020,"Domestic Sales Revenue",410000,"Textile Order #4401 Payment",Sales Lead
JE-911,2025-08-14,6050,"Consulting & Related Party Fees",250000,"Payment to Vision Logistics (Related Party)",CFO
JE-912,2025-09-30,2500,"Provision for Taxation",420000,"Tax Provision Adjustment",Tax Manager
JE-913,2025-10-05,6010,"Salaries & Executive Compensation",155000,"Staff Bonus Disbursement",HR Director
JE-914,2025-12-28,1020,"Habib Bank Limited",300000,"Year End Cash Movement",Controller`;

export const SAMPLE_BANK_ACCOUNTS_CSV = `AccountNumber,BankName,GLBalance,BankStatementBalance,ConfirmationReceived,ConfirmationBalance,ReconcilingItemsTotal
1010-987654,"Standard Chartered Bank",1750000.00,1750000.00,true,1750000.00,0.00
1020-112233,"Habib Bank Limited",450000.00,450000.00,false,0.00,0.00
1050-PETTY,"Petty Cash Fund",25000.00,25000.00,true,25000.00,0.00`;

export const SAMPLE_DRAFT_NOTES = [
  'Note 1: Company Profile and Significant Accounting Policies. The company operates in textile manufacturing.',
  'Note 2: Disaggregated Revenue streams recognized over time and at a point in time under IFRS 15.',
  'Note 3: Related Party Transactions with Apex Holding and Vision Logistics including management fees and raw material logistics.',
  'Note 4: Provisions and Contingencies under IAS 37. Includes tax litigation provision of $420,000.',
  'Note 5: Estimation Uncertainty under IAS 1.125 regarding useful economic lives of weaving machinery and expected credit loss on trade receivables.'
];
