import React, { useState } from 'react';
import { GlassCard } from '../components/common/GlassCard';
import { MessageSquare, Key, Phone, Send, CheckCircle2, Eye, EyeOff, ShieldCheck, Sparkles, RefreshCw } from 'lucide-react';
import { addonService } from '../services/api';

export const WhatsAppIntegration: React.FC = () => {
  const [phoneNumberId, setPhoneNumberId] = useState('1098234857219');
  const [token, setToken] = useState('EAAG...meta_permanent_system_user_token');
  const [showToken, setShowToken] = useState(false);
  const [recipient, setRecipient] = useState('+1-800-555-0199');
  const [messageText, setMessageText] = useState('Hello! Your order #9821 has been shipped via FedEx.');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await addonService.testWhatsApp({
        recipient_phone: recipient,
        message_body: messageText,
        access_token: token,
        phone_number_id: phoneNumberId,
      });
      setSendResult(res.result || res);
    } catch (e: any) {
      setSendResult({ error: e.message || 'Failed dispatching WhatsApp message' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
          <MessageSquare className="text-emerald-400" />
          <span>WhatsApp Business Cloud API</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure Meta Cloud API credentials to allow the AI voice agent to send real-time SMS/WhatsApp follow-ups during or after calls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Credentials Form */}
        <div className="lg:col-span-5 space-y-6">
          <GlassCard className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-glow-emerald">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">API Credentials</h3>
                  <span className="text-[11px] text-slate-400">Meta for Developers Portal</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                Encrypted AES-256
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  WhatsApp Phone Number ID
                </label>
                <input
                  type="text"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="e.g. 1098234857219"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Permanent System User Access Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <p>
                  Tokens are saved with hardware AES-GCM encryption in the database and injected only during live tool calls.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Test Dispatch Form */}
        <div className="lg:col-span-7">
          <GlassCard className="p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send size={15} className="text-emerald-400" />
                <span>Test WhatsApp Message Sender</span>
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Sandbox Verification</span>
            </div>

            <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Recipient Mobile Number (with country code)
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="+1-800-555-0199"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Message Content / Dynamic Prompt Summary
                </label>
                <textarea
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00B894] to-emerald-600 text-white text-xs font-semibold shadow-glow-emerald hover:opacity-90 transition flex items-center gap-2"
              >
                {sending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                <span>Send WhatsApp Test</span>
              </button>
            </form>

            {sendResult && (
              <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-white/15 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                  <span>Meta Cloud API Response:</span>
                  <span className="font-mono text-emerald-400 text-[10px]">Delivered</span>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 p-2.5 rounded-lg bg-black/50 overflow-x-auto max-h-48">
                  {JSON.stringify(sendResult, null, 2)}
                </pre>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
