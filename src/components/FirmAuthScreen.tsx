'use client';

import React, { useState } from 'react';
import { AuditFirmSession } from '@/lib/auth/context';
import { Lock, ArrowRight, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface FirmAuthScreenProps {
  onLoginSuccess: (session: AuditFirmSession) => void;
}

export function FirmAuthScreen({ onLoginSuccess }: FirmAuthScreenProps) {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');

  // Login inputs
  const [loginEmail, setLoginEmail] = useState('partner@saadco-ca.com');
  const [loginLicense, setLoginLicense] = useState('ICAP-CA-99412');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Signup inputs
  const [signupFirmName, setSignupFirmName] = useState('');
  const [signupLicenseId, setSignupLicenseId] = useState('');
  const [signupPartnerName, setSignupPartnerName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail) return alert('Please enter your Firm Email');

    const session: AuditFirmSession = {
      firmId: `firm_${Date.now()}`,
      firmName: loginEmail.includes('saad') ? 'Saad & Co. Chartered Accountants' : 'Chartered Accountancy Firm & Co.',
      licenseId: loginLicense || 'ICAP-CA-99412',
      partnerName: 'Saad Ahmad, FCA',
      email: loginEmail,
      isLoggedIn: true
    };
    onLoginSuccess(session);
  };

  const handleDemoLogin = () => {
    const session: AuditFirmSession = {
      firmId: 'firm_saad_994',
      firmName: 'Saad & Co. Chartered Accountants',
      licenseId: 'ICAP-CA-99412',
      partnerName: 'Saad Ahmad, FCA',
      email: 'partner@saadco-ca.com',
      isLoggedIn: true
    };
    onLoginSuccess(session);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupFirmName || !signupPartnerName || !signupEmail) {
      return alert('Please complete all required fields for firm registration.');
    }

    const session: AuditFirmSession = {
      firmId: `firm_${Date.now()}`,
      firmName: signupFirmName,
      licenseId: signupLicenseId || `ICAP-CA-${Math.floor(10000 + Math.random() * 90000)}`,
      partnerName: signupPartnerName,
      email: signupEmail,
      isLoggedIn: true
    };
    onLoginSuccess(session);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 px-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-3">
          <div className="bg-white p-3 rounded-2xl shadow-xl border border-cyan-500/20 max-w-[240px] mx-auto">
            <img 
              src="/logo.jpg" 
              alt="FinDit AI-Based Financial Audit Software" 
              className="w-full h-auto rounded-lg"
            />
          </div>
          <p className="text-xs text-slate-600 font-semibold tracking-wide">
            Statutory Audit & Decision-Support System • Licensed CA Sign-Off Authority
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xl space-y-6">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
            <button
              onClick={() => setAuthMode('LOGIN')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                authMode === 'LOGIN' ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md' : 'hover:text-slate-900'
              }`}
            >
              Firm Sign In
            </button>
            <button
              onClick={() => setAuthMode('SIGNUP')}
              className={`flex-1 py-2 rounded-lg transition-all ${
                authMode === 'SIGNUP' ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-md' : 'hover:text-slate-900'
              }`}
            >
              Register New CA Firm
            </button>
          </div>

          {/* LOGIN FORM */}
          {authMode === 'LOGIN' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Firm Email Address</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                  placeholder="partner@firm-ca.com"
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ICAP / ICAEW CA License ID</label>
                <input
                  type="text"
                  value={loginLicense}
                  onChange={e => setLoginLicense(e.target.value)}
                  required
                  placeholder="ICAP-CA-99412"
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-600 via-sky-700 to-blue-800 hover:from-cyan-700 hover:to-blue-900 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-cyan-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Lock className="w-4 h-4" /> Sign In to Audit Firm Workspace <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-cyan-600" /> Demo Login as Saad & Co. CA Firm
                </button>
              </div>
            </form>
          )}

          {/* SIGNUP FORM */}
          {authMode === 'SIGNUP' && (
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chartered Accountancy Firm Name *</label>
                <input
                  type="text"
                  value={signupFirmName}
                  onChange={e => setSignupFirmName(e.target.value)}
                  required
                  placeholder="e.g. A.F. Ferguson & Co. Chartered Accountants"
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Managing Partner Name (FCA / ACA) *</label>
                <input
                  type="text"
                  value={signupPartnerName}
                  onChange={e => setSignupPartnerName(e.target.value)}
                  required
                  placeholder="e.g. Saad Ahmad, FCA"
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">ICAP License ID</label>
                  <input
                    type="text"
                    value={signupLicenseId}
                    onChange={e => setSignupLicenseId(e.target.value)}
                    placeholder="ICAP-CA-88120"
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Firm Email Address *</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={e => setSignupEmail(e.target.value)}
                    required
                    placeholder="partner@firm.com"
                    className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={e => setSignupPassword(e.target.value)}
                  required
                  placeholder="Create password..."
                  className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
              >
                <Award className="w-4 h-4" /> Register Firm & Enter Dashboard <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* Regulatory Badge */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-3 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-600" />
          <span>Compliant with ISA, IFRS & ICAP Statutory Audit Fieldwork Standards</span>
        </div>
      </div>
    </div>
  );
}
