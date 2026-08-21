'use client';

import React, { useState } from 'react';
import { ClientCompany, DocumentRecord } from '@/lib/store/clients';
import { PBCRequest } from '@/lib/agents/types';
import { UploadCloud, FileText, AlertCircle, CheckCircle2, FileSpreadsheet, Plus, ArrowUpRight } from 'lucide-react';

interface DocumentVaultProps {
  client: ClientCompany;
  pbcRequests: PBCRequest[];
  onUploadRecord: (newDoc: DocumentRecord) => void;
  onResolvePBC: (pbcId: string) => void;
}

export function DocumentVault({ client, pbcRequests, onUploadRecord, onResolvePBC }: DocumentVaultProps) {
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState<DocumentRecord['category']>('Board Minutes');

  const pendingPBCs = pbcRequests.filter(p => p.status === 'PENDING');

  const handleCreateDocument = () => {
    if (!newDocName) return;
    const newDoc: DocumentRecord = {
      id: `doc_supp_${Date.now()}`,
      name: newDocName,
      category: newDocCategory,
      uploadedAt: new Date().toISOString().split('T')[0],
      uploadedBy: 'Audit Staff',
      fileSize: '420 KB'
    };
    onUploadRecord(newDoc);
    setNewDocName('');
    setShowAddRecordModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Missing Records & Gap Alerts Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-950">AI Audit Missing Records & Evidence Prompts</h3>
              <p className="text-xs text-amber-800">
                The AI specialist agents detected <strong className="text-amber-950">{pendingPBCs.length} missing document(s)</strong> required to close high-risk audit items.
              </p>
            </div>
          </div>
          <span className="bg-amber-200 text-amber-900 text-xs font-extrabold px-3 py-1 rounded-full">
            {pendingPBCs.length} Action Needed
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingPBCs.map(pbc => (
            <div key={pbc.id} className="bg-white border border-amber-200 rounded-lg p-3 shadow-xs space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                  {pbc.auditArea}
                </span>
                <span className="text-xs font-bold text-amber-700">PENDING</span>
              </div>
              <p className="text-xs font-bold text-slate-900">{pbc.documentNeeded}</p>
              <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
                <strong>Trigger Reason:</strong> {pbc.triggerReason}
              </p>
              <button
                onClick={() => onResolvePBC(pbc.id)}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-1.5 rounded flex items-center justify-center gap-1.5 transition-all"
              >
                <UploadCloud className="w-3.5 h-3.5" /> Upload Requested Record & Re-Run Agent
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Document Vault Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" /> Client Document & Records Vault ({client.documents.length})
            </h3>
            <p className="text-xs text-slate-500">
              All financial statements, trial balances, ledger extracts, bank statements, and minutes provided during onboarding or added later.
            </p>
          </div>

          <button
            onClick={() => setShowAddRecordModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Further Record
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-700">
            <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Document Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Uploaded Date</th>
                <th className="p-3">Uploaded By</th>
                <th className="p-3">File Size</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {client.documents.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" /> {doc.name}
                  </td>
                  <td className="p-3">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {doc.category}
                    </span>
                  </td>
                  <td className="p-3">{doc.uploadedAt}</td>
                  <td className="p-3">{doc.uploadedBy}</td>
                  <td className="p-3 text-slate-500">{doc.fileSize}</td>
                  <td className="p-3 text-right">
                    <button className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 ml-auto">
                      View Record <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Record Modal */}
      {showAddRecordModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Further Financial Record</h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Title / File Name</label>
              <input
                type="text"
                value={newDocName}
                onChange={e => setNewDocName(e.target.value)}
                placeholder="e.g. Board_Minutes_Q4_Approved.pdf"
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Document Category</label>
              <select
                value={newDocCategory}
                onChange={e => setNewDocCategory(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-2 focus:ring-blue-500"
              >
                <option value="Trial Balance">Trial Balance</option>
                <option value="General Ledger">General Ledger</option>
                <option value="Bank Statement">Bank Statement</option>
                <option value="Board Minutes">Board Minutes</option>
                <option value="Notes">Notes to Financials</option>
                <option value="Other">Other Audit Evidence</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowAddRecordModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDocument}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-xs font-bold rounded-lg"
              >
                Upload Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
