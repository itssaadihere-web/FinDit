'use client';

import React, { useState } from 'react';
import { AuditFinding } from '@/lib/agents/types';
import { X, Scale, FileText, AlertTriangle, CheckCircle, Copy, BookOpen, ShieldCheck, Check } from 'lucide-react';

interface FindingDetailModalProps {
  finding: AuditFinding | null;
  onClose: () => void;
}

export function FindingDetailModal({ finding, onClose }: FindingDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!finding) return null;

  const handleCopyCitation = () => {
    const citationText = `STATUTORY AUDIT DISCREPANCY CITATION
Finding ID: ${finding.id}
Audit Area: ${finding.auditArea}
Risk Level: ${finding.riskLevel}

DESCRIPTION:
${finding.description}

STATUTORY STANDARDS, LAWS & BYLAWS REFERENCES:
${finding.statutoryReferences?.map(s => `- [${s.governingBody}] ${s.standardId}: ${s.title}\n  Clause: "${s.officialClauseText}"`).join('\n\n')}

ROOT CAUSE ANALYSIS:
${finding.rootCauseAnalysis || 'N/A'}

MANDATORY STATUTORY REMEDIATION:
${finding.mandatoryRemediation || 'N/A'}

ISA 500 EVIDENCE RELIABILITY SCORE: ${finding.isa500EvidenceScore?.weightScore || '0.50'} / 1.00 (${finding.isa500EvidenceScore?.description || 'N/A'})
    `;

    navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-6 border border-slate-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-200 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                finding.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700'
              }`}>
                {finding.riskLevel} RISK DISCREPANCY
              </span>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {finding.auditArea}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mt-1">{finding.description}</h3>
            <p className="text-xs text-slate-500">
              Procedure Source: <strong className="text-slate-800">{finding.agentSource}</strong>
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Statutory Standards, Laws & Bylaws References */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Scale className="w-4 h-4 text-cyan-700" /> Statutory Standards, Laws & Bylaws Governance
          </h4>

          <div className="space-y-3">
            {finding.statutoryReferences?.map((ref, idx) => (
              <div key={idx} className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-cyan-800 bg-cyan-100 px-2.5 py-0.5 rounded">
                      {ref.standardId}
                    </span>
                    <span className="text-xs font-bold text-slate-900">{ref.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                    {ref.governingBody}
                  </span>
                </div>

                <div className="bg-white border-l-4 border-cyan-600 p-3 rounded-r-lg text-xs text-slate-700 italic">
                  &ldquo;{ref.officialClauseText}&rdquo;
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Root Cause Analysis */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-1.5">
          <h4 className="text-xs font-bold text-amber-950 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Discrepancy Root Cause Analysis
          </h4>
          <p className="text-xs text-amber-900 leading-relaxed">
            {finding.rootCauseAnalysis || 'Detailed root cause analysis performed across general ledger transactions and subledgers.'}
          </p>
        </div>

        {/* Section 3: Mandatory Statutory Remediation Procedure */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1.5">
          <h4 className="text-xs font-bold text-emerald-950 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> Mandatory Statutory Remediation Procedure
          </h4>
          <p className="text-xs text-emerald-900 leading-relaxed">
            {finding.mandatoryRemediation || 'Audit team must verify supporting vouchers and obtain management representation.'}
          </p>
        </div>

        {/* Section 4: ISA 500 Evidence Score & Action */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-200 pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
              ISA 500
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Evidence Reliability Score: <strong className="text-cyan-700">{finding.isa500EvidenceScore?.weightScore || '0.50'} / 1.00</strong>
              </p>
              <p className="text-[11px] text-slate-500">{finding.isa500EvidenceScore?.description || 'Internal document held by client.'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCitation}
              className="bg-slate-900 hover:bg-slate-950 text-white text-xs px-4 py-2 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Citation Copied!' : 'Copy Citation to Working Papers'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
