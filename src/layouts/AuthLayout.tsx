import React from 'react';
import { Outlet } from 'react-router-dom';
import { Logo } from '../components/ui/Logo';
import { ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const AuthLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient light orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Mark */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center mb-6 z-10">
        <Logo size="lg" showTagline={true} />
      </div>

      {/* Card Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-surface/90 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl border border-slate-700/80 rounded-3xl">
          <Outlet />
        </div>

        {/* Trust Badges Footer */}
        <div className="mt-8 flex items-center justify-center gap-6 text-slate-400 text-xs">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> End-to-End Encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-brand-400" /> WebRTC Ultra-Low Latency
          </span>
        </div>
      </div>
    </div>
  );
};
