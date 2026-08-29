import React, { useState } from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { Bot, Mail, Lock, Sparkles, X, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('dev@enterprise.ai');
  const [password, setPassword] = useState('••••••••••••');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-md p-8 relative shadow-2xl border-white/20">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
        >
          <X size={16} />
        </button>

        {/* Logo & Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6C5CE7] to-[#00B894] mx-auto flex items-center justify-center text-white shadow-glow-primary mb-3">
            <Bot size={26} />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isSignUp ? 'Create Workspace Account' : 'VoiceAgent Studio Login'}
          </h2>
          <p className="text-xs text-slate-400">
            {isSignUp
              ? 'Get started with real-time telephony workflows and AI voice assistants.'
              : 'Sign in to access your tenant dashboard and addon credentials.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Work Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Password</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-[#6C5CE7]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#a29bfe] text-white text-xs font-bold shadow-glow-primary hover:opacity-90 transition flex items-center justify-center gap-2 mt-2"
          >
            <span>{isSignUp ? 'Create Tenant Workspace' : 'Sign In to Workspace'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>{isSignUp ? 'Already have an account?' : 'Need a new tenant?'}</span>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[#a29bfe] font-semibold hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Register New Tenant'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};
