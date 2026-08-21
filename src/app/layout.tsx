import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinDit | AI-Based Financial Audit Software',
  description: 'Multi-tenant statutory audit decision-support software with mandatory CA sign-off authority.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-50 text-slate-900">
        <header className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white border-b border-cyan-900/40 sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.jpg" 
                alt="FinDit Logo" 
                className="h-10 w-auto rounded-lg bg-white p-0.5 shadow-md border border-cyan-500/20"
              />
              <div>
                <h1 className="font-extrabold text-lg leading-tight flex items-center gap-2 text-white">
                  FinDit <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-2 py-0.5 rounded-full border border-cyan-400/30 uppercase tracking-wider">AI Audit Platform</span>
                </h1>
                <p className="text-[11px] text-cyan-200/70 font-medium">AI-Based Financial Audit Software • Licensed CA Sign-Off</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-cyan-800/40 text-xs shadow-inner">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400"></span>
                <span className="text-slate-200 font-semibold">CA Sign-Off Authority</span>
                <span className="text-slate-600">|</span>
                <span className="text-cyan-400 font-bold">ID: CA-99412</span>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 py-6 mt-16 text-center text-xs">
          <div className="max-w-7xl mx-auto px-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <img src="/logo.jpg" alt="FinDit Logo" className="h-6 w-auto rounded bg-white p-0.5" />
              <span className="font-bold text-white text-sm">FinDit</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyan-400 font-medium">AI-Based Financial Audit Software</span>
            </div>
            <p className="font-medium text-amber-400/90 max-w-3xl mx-auto">
              ⚠️ STATUTORY REGULATORY NOTICE: FinDit is an audit decision-support and fieldwork automation software. All working paper outputs carry <span className="underline">AI_DRAFT</span> status until formally reviewed, approved, and digitally signed in-system by a licensed Chartered Accountant.
            </p>
            <p className="text-slate-500 text-[11px]">
              Compliant with ISA 300, ISA 315, ISA 320, ISA 240, ISA 500, ISA 505, ISA 520, ISA 570, ISA 701 & IFRS Standards.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
