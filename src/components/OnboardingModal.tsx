'use client';

import React, { useState } from 'react';
import { ClientCompany, DocumentRecord } from '@/lib/store/clients';
import { parseTrialBalanceCSV, parseGeneralLedgerCSV, parseBankAccountsCSV } from '@/lib/intake/parser';
import { SAMPLE_TRIAL_BALANCE_CSV, SAMPLE_GENERAL_LEDGER_CSV, SAMPLE_BANK_ACCOUNTS_CSV } from '@/lib/intake/templates';
import { X, UploadCloud, CheckCircle, Building2, ShieldCheck, FileSpreadsheet } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientCreated: (newClient: ClientCompany) => void;
}

export function OnboardingModal({ isOpen, onClose, onClientCreated }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [companyName, setCompanyName] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [auditPeriod, setAuditPeriod] = useState('FY 2025-2026');
  const [industryOverlay, setIndustryOverlay] = useState<'MANUFACTURING' | 'TRADING' | 'SERVICES'>('MANUFACTURING');
  const [engagementType, setEngagementType] = useState<'STATUTORY_AUDIT' | 'LIMITED_REVIEW' | 'AGREED_UPON_PROCEDURES'>('STATUTORY_AUDIT');
  
  // File upload state
  const [tbFileText, setTbFileText] = useState(SAMPLE_TRIAL_BALANCE_CSV);
  const [glFileText, setGlFileText] = useState(SAMPLE_GENERAL_LEDGER_CSV);
  const [bankFileText, setBankFileText] = useState(SAMPLE_BANK_ACCOUNTS_CSV);

  const [selfReviewThreat, setSelfReviewThreat] = useState(true);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (text: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (text) setter(text);
    };
    reader.readAsText(file);
  };

  const handleFinishOnboarding = () => {
    if (!companyName) return alert('Please enter Company Name');

    const parsedTb = parseTrialBalanceCSV(tbFileText);
    const parsedGl = parseGeneralLedgerCSV(glFileText);
    const parsedBank = parseBankAccountsCSV(bankFileText);

    const initialDocs: DocumentRecord[] = [
      { id: `doc_${Date.now()}_1`, name: `${companyName.replace(/\s+/g, '_')}_Trial_Balance.csv`, category: 'Trial Balance', uploadedAt: new Date().toISOString().split('T')[0], uploadedBy: 'Audit Staff', fileSize: '18 KB' },
      { id: `doc_${Date.now()}_2`, name: `${companyName.replace(/\s+/g, '_')}_General_Ledger.csv`, category: 'General Ledger', uploadedAt: new Date().toISOString().split('T')[0], uploadedBy: 'Audit Staff', fileSize: '142 KB' },
      { id: `doc_${Date.now()}_3`, name: `${companyName.replace(/\s+/g, '_')}_Bank_Schedule.csv`, category: 'Bank Statement', uploadedAt: new Date().toISOString().split('T')[0], uploadedBy: 'Audit Staff', fileSize: '12 KB' }
    ];

    const newClient: ClientCompany = {
      id: `client_${Date.now()}`,
      firmId: 'firm_saad_994',
      companyName,
      registrationNo: registrationNo || `CUIN-${Math.floor(1000000 + Math.random() * 9000000)}`,
      industryOverlay,
      engagementType,
      auditPeriod,
      stage: 'FIELDWORK',
      createdAt: new Date().toISOString(),
      documents: initialDocs,
      tbLines: parsedTb,
      glData: parsedGl,
      bankAccounts: parsedBank
    };

    onClientCreated(newClient);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-6 border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Onboard New Client Company</h3>
              <p className="text-xs text-slate-500">Saad & Co. Chartered Accountants • Step {step} of 3</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-4 text-xs font-semibold text-slate-500">
          <span className={`pb-1 border-b-2 ${step === 1 ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent'}`}>
            1. Company Profile
          </span>
          <span className={`pb-1 border-b-2 ${step === 2 ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent'}`}>
            2. Initial Financial Records
          </span>
          <span className={`pb-1 border-b-2 ${step === 3 ? 'border-blue-600 text-blue-600 font-bold' : 'border-transparent'}`}>
            3. Ethics & Review Gate
          </span>
        </div>

        {/* Step 1: Company Details */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Company Name *</label>
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="e.g. Apex Logistics Ltd."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Registration No. / CUIN</label>
                <input
                  type="text"
                  value={registrationNo}
                  onChange={e => setRegistrationNo(e.target.value)}
                  placeholder="CUIN-0099412"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Audit Financial Year</label>
                <input
                  type="text"
                  value={auditPeriod}
                  onChange={e => setAuditPeriod(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Engagement Type</label>
                <select
                  value={engagementType}
                  onChange={e => setEngagementType(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="STATUTORY_AUDIT">Full Statutory Audit (ISA 300)</option>
                  <option value="LIMITED_REVIEW">Limited Review (ISRE 2400)</option>
                  <option value="AGREED_UPON_PROCEDURES">Agreed-Upon Procedures (ISRS 4400)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Industry Overlay Module</label>
                <select
                  value={industryOverlay}
                  onChange={e => setIndustryOverlay(e.target.value as any)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="MANUFACTURING">Manufacturing / Textile Pack</option>
                  <option value="TRADING">Trading / Distribution Pack</option>
                  <option value="SERVICES">Services / Software Pack</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Upload Financial Documents */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Upload initial financial files for <strong className="text-slate-800">{companyName}</strong>. You can upload custom CSV files or use pre-populated sample templates.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                <FileSpreadsheet className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-800">Trial Balance CSV</p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={e => handleFileUpload(e, setTbFileText)}
                  className="mt-2 text-xs text-slate-500 w-full"
                />
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-800">General Ledger CSV</p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={e => handleFileUpload(e, setGlFileText)}
                  className="mt-2 text-xs text-slate-500 w-full"
                />
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-center">
                <FileSpreadsheet className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                <p className="text-xs font-bold text-slate-800">Bank Schedule CSV</p>
                <input
                  type="file"
                  accept=".csv,.txt"
                  onChange={e => handleFileUpload(e, setBankFileText)}
                  className="mt-2 text-xs text-slate-500 w-full"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Ethics & Review Gate */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-900">
                <strong className="font-bold text-sm block mb-1">IESBA / ICAP Code Ethics Declaration</strong>
                Did your firm provide accounting or bookkeeping services to {companyName} during this financial year?
              </div>
            </div>

            <div className="flex items-center space-x-4 px-2">
              <label className="flex items-center space-x-2 text-xs font-medium text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="threat"
                  checked={selfReviewThreat}
                  onChange={() => setSelfReviewThreat(true)}
                  className="text-blue-600"
                />
                <span>Yes - Bookkeeping provided (Triggers Self-Review Threat Flag)</span>
              </label>

              <label className="flex items-center space-x-2 text-xs font-medium text-slate-800 cursor-pointer">
                <input
                  type="radio"
                  name="threat"
                  checked={!selfReviewThreat}
                  onChange={() => setSelfReviewThreat(false)}
                  className="text-blue-600"
                />
                <span>No - Pure External Statutory Audit</span>
              </label>
            </div>
          </div>
        )}

        {/* Modal Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          {step > 1 ? (
            <button
              onClick={() => setStep((step - 1) as any)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Back
            </button>
          ) : <div />}

          {step < 3 ? (
            <button
              onClick={() => setStep((step + 1) as any)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold rounded-lg transition-all"
            >
              Continue to Step {step + 1}
            </button>
          ) : (
            <button
              onClick={handleFinishOnboarding}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm transition-all"
            >
              <CheckCircle className="w-4 h-4" /> Onboard & Initialize Client Audit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
