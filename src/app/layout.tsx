import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinDit | AI-Powered Financial Audit System',
  description: 'Multi-agent financial audit decision-support engine with mandatory CA sign-off gating.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-xl tracking-wider shadow-md">
                FD
              </div>
              <div>
                <h1 className="font-bold text-lg leading-tight flex items-center gap-2">
                  FinDit <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-400/30">v1.0 Statutory Audit</span>
                </h1>
                <p className="text-xs text-slate-400">AI Fieldwork Engine • Human CA Sign-Off Mandatory</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-slate-300 font-medium">CA Authority Active</span>
                <span className="text-slate-500">|</span>
                <span className="text-blue-400">ID: CA-99412</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 py-4 mt-12 text-center text-xs">
          <div className="max-w-7xl mx-auto px-4">
            <p className="font-medium text-amber-400/90">
              ⚠️ MANDATORY REGULATORY NOTICE: FinDit is an AI decision-support and fieldwork automation engine. All generated reports carry <span className="underline">AI_DRAFT</span> status until formally approved and signed in-system by a licensed Chartered Accountant.
            </p>
            <p className="mt-1 text-slate-500">
              Compliant with ISA 300, ISA 315, ISA 320, ISA 240, ISA 500, ISA 505, ISA 520, ISA 570, ISA 701 & IFRS Standards.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
