'use client';

import React, { useState, useEffect } from 'react';
import { DEFAULT_FIRM_SESSION, AuditFirmSession } from '@/lib/auth/context';
import { INITIAL_CLIENTS, ClientCompany, DocumentRecord } from '@/lib/store/clients';
import { OnboardingModal } from '@/components/OnboardingModal';
import { DocumentVault } from '@/components/DocumentVault';
import { executeFullAuditWorkflow, AuditExecutionResult } from '@/lib/agents/director';
import { parseTrialBalanceCSV, parseGeneralLedgerCSV, parseBankAccountsCSV } from '@/lib/intake/parser';
import { SAMPLE_TRIAL_BALANCE_CSV, SAMPLE_GENERAL_LEDGER_CSV, SAMPLE_BANK_ACCOUNTS_CSV, SAMPLE_DRAFT_NOTES } from '@/lib/intake/templates';
import { approveFinding, overrideFinding, signOffAuditReport } from '@/lib/review/actions';
import { getLLMLogs, LLMLogEntry } from '@/lib/llm/logger';
import { DEFAULT_ROUTES, APIKeysConfig } from '@/lib/llm/router';
import { exportWorkingPaperHTML, downloadFile } from '@/lib/export/exporter';
import { 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Cpu, 
  Lock, 
  Unlock, 
  AlertTriangle,
  FileSpreadsheet,
  UserCheck,
  Scale,
  Zap,
  BarChart3,
  Key,
  Download,
  Building2,
  Plus,
  Search,
  ArrowLeft,
  Briefcase
} from 'lucide-react';

// CA Terminology Mapping for Audit Trail Task Types
const PROCEDURE_TITLE_MAP: Record<string, { title: string; engine: string }> = {
  JUDGMENT_STANDARDS_RISK: {
    title: 'Standards & Risk Judgment (ISA 300 / 315 / 320)',
    engine: 'Professional Judgment & Risk Assessment Module'
  },
  BULK_NUMERIC_ANALYTICS: {
    title: 'Substantive & Analytical Analytics (ISA 520)',
    engine: 'Bulk Financial & Trend Analysis Module'
  },
  FAST_TRIAGE_CLASSIFICATION: {
    title: 'Document Triage & Record Verification',
    engine: 'PBC Document Classification Module'
  },
  FINAL_REPORT_SYNTHESIS: {
    title: 'Statutory Reporting & Synthesis (ISA 701)',
    engine: 'Final Opinion & Management Letter Module'
  }
};

export default function AuditFirmDashboard() {
  // Session & Clients State
  const [firmSession, setFirmSession] = useState<AuditFirmSession>(DEFAULT_FIRM_SESSION);
  const [clients, setClients] = useState<ClientCompany[]>(INITIAL_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Active Client Audit Workspace State
  const [activeTab, setActiveTab] = useState<'agents' | 'vault' | 'review' | 'reports' | 'llm'>('agents');
  const [auditData, setAuditData] = useState<AuditExecutionResult | null>(null);
  const [llmLogs, setLlmLogs] = useState<LLMLogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overrideModalFindingId, setOverrideModalFindingId] = useState<string | null>(null);
  const [overrideReasonInput, setOverrideReasonInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showKeyDrawer, setShowKeyDrawer] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState<APIKeysConfig>({
    anthropicApiKey: '',
    geminiApiKey: '',
    kimiApiKey: ''
  });

  const activeClient = clients.find(c => c.id === selectedClientId) || null;

  // Run audit engine for selected client
  const handleRunClientAudit = async (targetClient: ClientCompany) => {
    setIsRunning(true);
    setErrorMessage(null);
    try {
      const calculatedRevenue = targetClient.tbLines
        .filter(l => l.auditArea === 'Revenue & Receivables' && l.credit > 0)
        .reduce((sum, l) => sum + l.credit, 0) || 17000000;

      const res = await executeFullAuditWorkflow(targetClient.id, {
        totalRevenue: calculatedRevenue,
        providedBookkeeping: true,
        journalEntries: targetClient.glData.journalEntries,
        transactionAmounts: targetClient.glData.transactionAmounts,
        bankAccounts: targetClient.bankAccounts,
        draftNoteDisclosures: SAMPLE_DRAFT_NOTES
      });

      setAuditData(res);
      setLlmLogs(getLLMLogs(targetClient.id));

      // Update client stage in state
      setClients(prev => prev.map(c => c.id === targetClient.id ? { ...c, auditResult: res, stage: res.stage } : c));
    } catch (err: any) {
      setErrorMessage(err.message || 'Audit fieldwork execution failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleOpenClientWorkspace = (client: ClientCompany) => {
    setSelectedClientId(client.id);
    setActiveTab('agents');
    handleRunClientAudit(client);
  };

  const handleClientCreated = (newClient: ClientCompany) => {
    setClients(prev => [newClient, ...prev]);
    handleOpenClientWorkspace(newClient);
  };

  const handleApproveFinding = (findingId: string) => {
    if (!auditData) return;
    const finding = auditData.findings.find(f => f.id === findingId);
    const reviewItem = auditData.reviewQueue.find(r => r.findingId === findingId);
    if (!finding || !reviewItem) return;

    const { updatedFinding, updatedReview } = approveFinding(finding, reviewItem);

    setAuditData({
      ...auditData,
      findings: auditData.findings.map(f => f.id === findingId ? updatedFinding : f),
      reviewQueue: auditData.reviewQueue.map(r => r.findingId === findingId ? updatedReview : r)
    });
  };

  const handleConfirmOverride = () => {
    if (!auditData || !overrideModalFindingId) return;
    const finding = auditData.findings.find(f => f.id === overrideModalFindingId);
    const reviewItem = auditData.reviewQueue.find(r => r.findingId === overrideModalFindingId);
    if (!finding || !reviewItem) return;

    try {
      const { updatedFinding, updatedReview } = overrideFinding(finding, reviewItem, overrideReasonInput);
      setAuditData({
        ...auditData,
        findings: auditData.findings.map(f => f.id === overrideModalFindingId ? updatedFinding : f),
        reviewQueue: auditData.reviewQueue.map(r => r.findingId === overrideModalFindingId ? updatedReview : r)
      });
      setOverrideModalFindingId(null);
      setOverrideReasonInput('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCASignoff = () => {
    if (!auditData) return;
    try {
      const updatedReport = signOffAuditReport(auditData.reportPack, auditData.reviewQueue);
      setAuditData({
        ...auditData,
        reportPack: updatedReport
      });
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleExportHTML = () => {
    if (!auditData) return;
    const htmlContent = exportWorkingPaperHTML(auditData);
    downloadFile(htmlContent, `Statutory_Audit_Working_Papers_${auditData.engagementId}.html`, 'text/html');
  };

  const handleAddDocumentToClient = (newDoc: DocumentRecord) => {
    if (!activeClient) return;
    const updatedDocs = [...activeClient.documents, newDoc];
    setClients(prev => prev.map(c => c.id === activeClient.id ? { ...c, documents: updatedDocs } : c));
  };

  const handleResolvePBC = (pbcId: string) => {
    if (!auditData || !activeClient) return;
    const updatedPBCs = auditData.pbcRequests.map(p => p.id === pbcId ? { ...p, status: 'UPLOADED' as const } : p);
    setAuditData({
      ...auditData,
      pbcRequests: updatedPBCs
    });
    handleRunClientAudit(activeClient);
  };

  const filteredClients = clients.filter(c => 
    c.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.registrationNo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onClientCreated={handleClientCreated}
      />

      {/* VIEW 1: AUDIT FIRM MULTI-CLIENT DASHBOARD */}
      {!selectedClientId ? (
        <div className="space-y-6">
          {/* Audit Firm Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-black shadow-lg border border-blue-400/30">
                SC
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">{firmSession.firmName}</h2>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                  <span>Licensed Partner: <strong>{firmSession.partnerName}</strong></span>
                  <span>•</span>
                  <span>ICAP CA License ID: <strong className="text-blue-400">{firmSession.licenseId}</strong></span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowKeyDrawer(!showKeyDrawer)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Key className="w-4 h-4 text-amber-400" />
                Audit Model Credentials
              </button>

              <button
                onClick={() => setIsOnboardingOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
              >
                <Plus className="w-4 h-4" /> Onboard New Client Company
              </button>
            </div>
          </div>

          {/* API Key Configuration Drawer */}
          {showKeyDrawer && (
            <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2 text-amber-400">
                  <Key className="w-4 h-4" /> Standards Processing Credentials (Optional)
                </h3>
                <span className="text-xs text-slate-400">When omitted, FinDit executes built-in statutory ISA audit reasoning procedures.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Professional Judgment Module API Key</label>
                  <input
                    type="password"
                    value={apiKeys.anthropicApiKey}
                    onChange={e => setApiKeys({ ...apiKeys, anthropicApiKey: e.target.value })}
                    placeholder="Key..."
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Bulk Numeric Analytics API Key</label>
                  <input
                    type="password"
                    value={apiKeys.geminiApiKey}
                    onChange={e => setApiKeys({ ...apiKeys, geminiApiKey: e.target.value })}
                    placeholder="Key..."
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">PBC Document Classification API Key</label>
                  <input
                    type="password"
                    value={apiKeys.kimiApiKey}
                    onChange={e => setApiKeys({ ...apiKeys, kimiApiKey: e.target.value })}
                    placeholder="Key..."
                    className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Firm Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Audit Client Engagements</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{clients.length}</p>
                <p className="text-xs text-blue-600 font-medium mt-0.5">Statutory & Review Engagements</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Active Fieldwork Audits</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {clients.filter(c => c.stage === 'FIELDWORK' || c.stage === 'PLANNING').length}
                </p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">Statutory Fieldwork ~88%</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Pending CA Sign-Offs</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {clients.filter(c => c.auditResult?.reportPack.status !== 'CA_APPROVED').length}
                </p>
                <p className="text-xs text-amber-600 font-medium mt-0.5">Licensed CA Authority Active</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Firm CA License</p>
                <p className="text-sm font-bold text-slate-900 mt-1">{firmSession.licenseId}</p>
                <p className="text-xs text-slate-500 mt-0.5">ICAP Registered</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Client Companies Section Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Audit Client Engagements ({clients.length})</h3>
              <p className="text-xs text-slate-500">Select a client company workspace to inspect records, review findings, or execute formal CA sign-off.</p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search client name or CUIN..."
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Client Companies Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => (
              <div key={client.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900 leading-snug">{client.companyName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{client.registrationNo} • {client.auditPeriod}</p>
                    </div>
                    <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded">
                      {client.stage}
                    </span>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex justify-between">
                      <span>Engagement Type:</span>
                      <strong className="text-slate-800">{client.engagementType}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Industry Module:</span>
                      <strong className="text-slate-800">{client.industryOverlay}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Client Vault Documents:</span>
                      <strong className="text-blue-600 font-bold">{client.documents.length} Records</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleOpenClientWorkspace(client)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all"
                  >
                    Open Client Audit Workspace
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* VIEW 2: CLIENT AUDIT WORKSPACE FOR SELECTED CLIENT */
        <div className="space-y-6">
          {/* Back Button & Workspace Header */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <button
                onClick={() => setSelectedClientId(null)}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5 mb-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Audit Firm Dashboard
              </button>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900">{activeClient?.companyName}</h2>
                <span className="bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200">
                  {activeClient?.auditPeriod}
                </span>
                <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-200">
                  {activeClient?.engagementType}
                </span>
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Engagement Audit Stage: <span className="font-semibold text-blue-600">{auditData?.stage || 'FIELDWORK'}</span> • CUIN Registration: {activeClient?.registrationNo}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => activeClient && handleRunClientAudit(activeClient)}
                disabled={isRunning}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all"
              >
                <Zap className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? 'Executing Procedures...' : 'Execute Statutory Fieldwork'}
              </button>
            </div>
          </div>

          {/* Error Alert if any */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <strong className="font-semibold">Statutory Constraint Triggered: </strong> {errorMessage}
              </div>
            </div>
          )}

          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Fieldwork Automated</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{auditData?.overallFieldworkProgress || 88}%</p>
                <p className="text-xs text-emerald-600 font-medium mt-0.5">~85-90% statutory goal</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Cpu className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Overall Materiality (ISA 320)</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">${auditData?.materiality.overallMateriality.toLocaleString() || '170,000'}</p>
                <p className="text-xs text-slate-500 mt-0.5">Perf. Mat: ${auditData?.materiality.performanceMateriality.toLocaleString() || '127,500'}</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Scale className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Escalated Findings</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{auditData?.findings.length || 0}</p>
                <p className="text-xs text-red-600 font-medium mt-0.5">
                  {auditData?.findings.filter(f => f.riskLevel === 'HIGH').length || 0} High Risk Items
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <ShieldAlert className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500">Audit Working Paper Status</p>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    auditData?.reportPack.status === 'CA_APPROVED' 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {auditData?.reportPack.status === 'CA_APPROVED' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                    {auditData?.reportPack.status || 'AI_DRAFT'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">CA Sign-Off Required</p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <UserCheck className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Workspace Tabs Navigation */}
          <div className="border-b border-slate-200 flex space-x-6">
            <button
              onClick={() => setActiveTab('agents')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'agents' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Cpu className="w-4 h-4" /> Statutory Fieldwork & Risk Register ({auditData?.findings.length || 0})
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'vault' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" /> Document Vault & Missing Evidence Prompts ({auditData?.pbcRequests.filter(p=>p.status==='PENDING').length || 0})
            </button>

            <button
              onClick={() => setActiveTab('review')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'review' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" /> CA Review Queue ({auditData?.reviewQueue.filter(r => r.status === 'PENDING_REVIEW').length || 0})
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'reports' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" /> Report Drafts & Working Papers
            </button>

            <button
              onClick={() => setActiveTab('llm')}
              className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-all ${
                activeTab === 'llm' 
                  ? 'border-blue-600 text-blue-600' 
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Methodology & Standards Audit Trail ({llmLogs.length})
            </button>
          </div>

          {/* Tab 1: Agent Fieldwork */}
          {activeTab === 'agents' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" /> Statutory Fieldwork Findings & Risk Register
                </h3>

                <div className="space-y-4">
                  {auditData?.findings.map(finding => (
                    <div key={finding.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50/50 hover:bg-white transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                              finding.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {finding.riskLevel} RISK
                            </span>
                            <span className="text-xs font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded">
                              {finding.auditArea}
                            </span>
                            <span className="text-xs text-slate-400">
                              Audit Procedure: {finding.agentSource}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-slate-900 mt-2">{finding.description}</p>

                          <div className="flex items-center gap-4 text-xs text-slate-500 pt-2">
                            <span>Working Paper Refs: {finding.evidenceRefs.join(', ') || 'None'}</span>
                            <span>•</span>
                            <span>Status: <strong className="text-slate-700">{finding.status}</strong></span>
                          </div>

                          {finding.overrideReason && (
                            <div className="mt-2 text-xs bg-amber-50 border border-amber-200 text-amber-800 p-2 rounded">
                              <strong>CA Override Rationale:</strong> {finding.overrideReason}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {finding.status === 'PENDING_REVIEW' && (
                            <>
                              <button
                                onClick={() => handleApproveFinding(finding.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition-all flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                              </button>
                              <button
                                onClick={() => setOverrideModalFindingId(finding.id)}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition-all flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Override
                              </button>
                            </>
                          )}
                          {finding.status === 'CA_APPROVED' && (
                            <span className="text-emerald-600 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> CA Approved
                            </span>
                          )}
                          {finding.status === 'CA_OVERRIDDEN' && (
                            <span className="text-amber-600 text-xs font-bold flex items-center gap-1">
                              <XCircle className="w-4 h-4" /> CA Overridden
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Document Vault & Missing Records Prompts */}
          {activeTab === 'vault' && activeClient && (
            <DocumentVault
              client={activeClient}
              pbcRequests={auditData?.pbcRequests || []}
              onUploadRecord={handleAddDocumentToClient}
              onResolvePBC={handleResolvePBC}
            />
          )}

          {/* Tab 3: CA Review Queue */}
          {activeTab === 'review' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" /> Central Review & Escalation Queue
              </h3>
              <p className="text-xs text-slate-500">
                Every judgment call, high-risk flag, or evidence quality shortfall is routed here for human CA action.
              </p>

              <div className="space-y-3">
                {auditData?.reviewQueue.map(item => (
                  <div key={item.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">{item.auditArea}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                          item.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{item.escalationReason}</p>
                      <p className="text-xs text-slate-600"><strong>Suggested Action:</strong> {item.suggestedAction}</p>

                      {item.decisionNote && (
                        <p className="text-xs bg-slate-200 text-slate-800 p-2 rounded mt-1">
                          <strong>CA Decision Note:</strong> {item.decisionNote}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {item.status === 'PENDING_REVIEW' ? (
                        <>
                          <button
                            onClick={() => handleApproveFinding(item.findingId!)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition-all"
                          >
                            Approve Finding
                          </button>
                          <button
                            onClick={() => setOverrideModalFindingId(item.findingId!)}
                            className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1.5 rounded font-semibold transition-all"
                          >
                            Override Finding
                          </button>
                        </>
                      ) : (
                        <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Reviewed by {item.reviewedBy || 'CA'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Reports & Exports */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{auditData?.reportPack.auditSummaryReport.title}</h3>
                    <p className="text-xs text-slate-500">Statutory Report Pack • Opinion Recommendation: <strong className="text-blue-600">{auditData?.reportPack.opinionRecommendation.type}</strong></p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExportHTML}
                      className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Download className="w-4 h-4" /> Export Working Papers (.HTML)
                    </button>

                    <button
                      onClick={handleCASignoff}
                      disabled={auditData?.reportPack.status === 'CA_APPROVED'}
                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <UserCheck className="w-4 h-4" />
                      {auditData?.reportPack.status === 'CA_APPROVED' ? 'CA Sign-off Completed' : 'Formal CA Sign-Off & Release'}
                    </button>
                  </div>
                </div>

                {/* Mandatory Disclaimer Box */}
                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-xs font-semibold flex items-center justify-between">
                  <span>⚠️ {auditData?.reportPack.mandatoryDisclaimer}</span>
                  {auditData?.reportPack.caSignoffMetadata && (
                    <span className="text-emerald-700 font-mono">SigRef: {auditData.reportPack.caSignoffMetadata.digitalSignatureRef}</span>
                  )}
                </div>

                {/* Executive Summary */}
                <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                  <h4 className="text-sm font-bold text-slate-900 mb-1">Executive Summary</h4>
                  <p className="text-xs text-slate-700 leading-relaxed">{auditData?.reportPack.auditSummaryReport.executiveSummary}</p>
                </div>

                {/* Key Audit Matters */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Key Audit Matters (ISA 701)</h4>
                  <div className="space-y-3">
                    {auditData?.reportPack.keyAuditMatters.map((kam, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <p className="text-xs font-bold text-slate-900">{kam.title}</p>
                        <p className="text-xs text-slate-600 mt-1"><strong>Why KAM:</strong> {kam.whyConsideredKAM}</p>
                        <p className="text-xs text-slate-600 mt-1"><strong>How Addressed:</strong> {kam.howAddressedInAudit}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Management Letter Deficiencies */}
                <div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2">Management Letter Control Deficiencies</h4>
                  <div className="space-y-2">
                    {auditData?.reportPack.managementLetter.controlWeaknesses.map((cw, idx) => (
                      <div key={idx} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <p className="text-xs font-bold text-slate-800">{cw.area}: {cw.finding}</p>
                        <p className="text-xs text-slate-600 mt-1"><strong>Recommendation:</strong> {cw.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Audit Standards & Methodology Log */}
          {activeTab === 'llm' && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" /> Methodology & Standards Audit Trail
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {Object.entries(DEFAULT_ROUTES).map(([key, route]) => {
                  const mapped = PROCEDURE_TITLE_MAP[key] || { title: key, engine: route.description };
                  return (
                    <div key={key} className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs">
                      <span className="font-bold text-slate-800 block">{mapped.title}</span>
                      <span className="text-slate-600 block mt-0.5">Procedure Engine: <strong className="text-blue-600">{mapped.engine}</strong></span>
                      <span className="text-slate-400 block mt-0.5">{route.description}</span>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 font-mono text-xs">
                {llmLogs.map(log => (
                  <div key={log.id} className="border border-slate-200 rounded p-2.5 bg-slate-900 text-slate-200">
                    <div className="flex items-center justify-between text-blue-400">
                      <span>[{log.createdAt.substring(11, 19)}] Procedure: {PROCEDURE_TITLE_MAP[log.taskType]?.title || log.taskType}</span>
                      <span className="text-emerald-400">Engine: Active Standards Module</span>
                    </div>
                    <p className="text-slate-300 mt-1">{log.outputSummary}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Override Reason Modal */}
          {overrideModalFindingId && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl space-y-4">
                <h3 className="text-lg font-bold text-slate-900">CA Override Documentation</h3>
                <p className="text-xs text-slate-500">
                  Provide documented professional rationale for overriding this AI finding. Required for audit trail defensibility under statutory standards.
                </p>

                <textarea
                  value={overrideReasonInput}
                  onChange={e => setOverrideReasonInput(e.target.value)}
                  placeholder="Enter detailed CA override rationale (minimum 10 characters)..."
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg p-3 text-xs focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setOverrideModalFindingId(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmOverride}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 text-xs font-bold rounded-lg"
                  >
                    Save CA Override
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
