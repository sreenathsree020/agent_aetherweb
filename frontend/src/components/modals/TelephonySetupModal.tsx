import React, { useState, useEffect } from 'react';
import { useTelephonyStore } from '../../stores/useTelephonyStore';
import { X, Save, CheckCircle2, Copy, Check, ChevronDown } from 'lucide-react';
import { TelephonyIcon } from '../common/TelephonyIcon';

export const TelephonySetupModal: React.FC = () => {
  const {
    provider,
    isSetupOpen,
    closeSetup,
    exotelSid,
    exotelApiKey,
    exotelToken,
    exotelSubdomain,
    exotelCallerId,
    exotelAppId,
    twilioAccountSid,
    twilioAuthToken,
    twilioPhoneNumber,
    twilioTwiMLAppSid,
    audioCodec,
    vadThreshold,
    silenceDuration,
    bargeInEnabled,
    recordCalls,
    updateExotelConfig,
    updateTwilioConfig,
    updateDSPConfig,
  } = useTelephonyStore();

  // Form local state
  const [eSid, setESid] = useState(exotelSid);
  const [eKey, setEKey] = useState(exotelApiKey);
  const [eToken, setEToken] = useState(exotelToken);
  const [eSubdomain, setESubdomain] = useState(exotelSubdomain);
  const [eCallerId, setECallerId] = useState(exotelCallerId);
  const [eAppId, setEAppId] = useState(exotelAppId);

  const [tSid, setTSid] = useState(twilioAccountSid);
  const [tToken, setTToken] = useState(twilioAuthToken);
  const [tPhone, setTPhone] = useState(twilioPhoneNumber);
  const [tAppSid, setTAppSid] = useState(twilioTwiMLAppSid);

  const [codec, setCodec] = useState<'PCMU' | 'PCM16'>(audioCodec);
  const [vad, setVad] = useState(vadThreshold);
  const [silence, setSilence] = useState(silenceDuration);
  const [bargeIn, setBargeIn] = useState(bargeInEnabled);
  const [record, setRecord] = useState(recordCalls);

  const [copiedWs, setCopiedWs] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [saved, setSaved] = useState(false);

  // Exotel Applet / Flow Options
  const exotelAppletOptions = [
    { id: 'voice_bot_flow_v2', name: 'AI Voice Bot Live Stream (voice_bot_flow_v2)', desc: 'Realtime Bi-directional WebSocket Media Stream' },
    { id: 'inbound_passthru_v1', name: 'Inbound Passthru Applet (inbound_passthru_v1)', desc: 'HTTP Passthru Webhook Routing' },
    { id: 'order_support_ivr', name: 'Customer Support IVR (order_support_ivr)', desc: 'Order Tracking & Relational Query Flow' },
    { id: 'lead_qualification_bot', name: 'Lead Qualification Bot (lead_qualification_bot)', desc: 'Sales Intake & CRM Logging' },
    { id: 'custom_flow_v1', name: 'Custom Flow ID (custom_flow_v1)', desc: 'User-defined custom applet workflow' },
  ];

  // Twilio TwiML App Options
  const twilioAppOptions = [
    { id: 'AP_live_stream_app_v1', name: 'AI Voice Media Stream (AP_live_stream_app_v1)', desc: 'TwiML <Connect><Stream> Gateway' },
    { id: 'AP_voice_bot_ivr', name: 'Inbound Voice Bot (AP_voice_bot_ivr)', desc: 'Standard TwiML Inbound Voice Webhook' },
    { id: 'AP_lead_flow_v1', name: 'Lead Intake Flow (AP_lead_flow_v1)', desc: 'Lead qualification & routing' },
  ];

  useEffect(() => {
    if (isSetupOpen) {
      setESid(exotelSid);
      setEKey(exotelApiKey);
      setEToken(exotelToken);
      setESubdomain(exotelSubdomain);
      setECallerId(exotelCallerId);
      setEAppId(exotelAppId || 'voice_bot_flow_v2');
      setTSid(twilioAccountSid);
      setTToken(twilioAuthToken);
      setTPhone(twilioPhoneNumber);
      setTAppSid(twilioTwiMLAppSid || 'AP_live_stream_app_v1');
      setCodec(audioCodec);
      setVad(vadThreshold);
      setSilence(silenceDuration);
      setBargeIn(bargeInEnabled);
      setRecord(recordCalls);
    }
  }, [isSetupOpen, exotelSid, exotelApiKey, exotelToken, exotelSubdomain, exotelCallerId, exotelAppId, twilioAccountSid, twilioAuthToken, twilioPhoneNumber, twilioTwiMLAppSid, audioCodec, vadThreshold, silenceDuration, bargeInEnabled, recordCalls]);

  if (!isSetupOpen) return null;

  const isExotel = provider === 'exotel';
  const providerName = isExotel ? 'Exotel Telephony' : 'Twilio Voice';

  const hostOrigin = window.location.origin.replace(/^http/, 'ws');
  const wsUrl = isExotel ? `${hostOrigin}/ws/exotel-stream` : `${hostOrigin}/ws/twilio-stream`;
  const webhookUrl = isExotel
    ? `${window.location.origin}/api/v1/telephony/exotel/passthru`
    : `${window.location.origin}/api/v1/telephony/twilio/voice`;

  const copyToClipboard = (text: string, setFn: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setFn(true);
    setTimeout(() => setFn(false), 2000);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (isExotel) {
      updateExotelConfig({
        exotelSid: eSid,
        exotelApiKey: eKey,
        exotelToken: eToken,
        exotelSubdomain: eSubdomain,
        exotelCallerId: eCallerId,
        exotelAppId: eAppId,
      });
    } else {
      updateTwilioConfig({
        twilioAccountSid: tSid,
        twilioAuthToken: tToken,
        twilioPhoneNumber: tPhone,
        twilioTwiMLAppSid: tAppSid,
      });
    }
    updateDSPConfig({
      audioCodec: codec,
      vadThreshold: vad,
      silenceDuration: silence,
      bargeInEnabled: bargeIn,
      recordCalls: record,
    });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      closeSetup();
    }, 700);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-2xl overflow-hidden font-sans text-[var(--text-main)] max-h-[90vh] flex flex-col">
        {/* Header tailored to Selected Provider */}
        <div className="p-4 bg-[var(--bg-input)] border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center shrink-0">
              <TelephonyIcon provider={provider} size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-[var(--text-main)] tracking-tight">
                  {providerName} Configuration
                </h3>
                <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[8px] font-mono font-semibold">
                  Selected
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)]">
                {isExotel
                  ? 'Configure Exotel SIP trunk credentials & Webhook passthru'
                  : 'Configure Twilio Account SID, Auth Token & TwiML App'}
              </p>
            </div>
          </div>

          <button
            onClick={closeSetup}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body showing ONLY selected provider's settings */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs overflow-y-auto flex-1 bg-[var(--bg-surface)]">
          {/* Webhook & Stream URLs */}
          <div className="p-3 bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-2">
            <div className="flex items-center justify-between pb-1 border-b border-[var(--border-subtle)]">
              <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">
                {isExotel ? 'Exotel Applet URLs' : 'Twilio TwiML Stream URLs'}
              </span>
              <span className="text-[9px] text-emerald-500 font-mono">● Live</span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] block">Media Stream WebSocket URL:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={wsUrl}
                  className="flex-1 px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-main)]"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(wsUrl, setCopiedWs)}
                  className="p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-panel)]"
                  title="Copy"
                >
                  {copiedWs ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-[var(--text-muted)] block">
                {isExotel ? 'Passthru Webhook URL:' : 'TwiML Voice Webhook URL:'}
              </span>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className="flex-1 px-2 py-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-main)]"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(webhookUrl, setCopiedWebhook)}
                  className="p-1 bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-main)] hover:bg-[var(--bg-panel)]"
                  title="Copy"
                >
                  {copiedWebhook ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
              </div>
            </div>
          </div>

          {/* Provider Credentials Form */}
          {isExotel ? (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-main)]">Account SID</label>
                  <input
                    type="text"
                    value={eSid}
                    onChange={(e) => setESid(e.target.value)}
                    placeholder="exotel_tenant_live_..."
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-main)]">API Key</label>
                  <input
                    type="text"
                    value={eKey}
                    onChange={(e) => setEKey(e.target.value)}
                    placeholder="ak_live_..."
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-main)]">API Token</label>
                  <input
                    type="password"
                    value={eToken}
                    onChange={(e) => setEToken(e.target.value)}
                    placeholder="tok_sec_..."
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-main)]">Cluster Subdomain</label>
                  <input
                    type="text"
                    value={eSubdomain}
                    onChange={(e) => setESubdomain(e.target.value)}
                    placeholder="api.exotel.com"
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-main)]">Virtual Caller ID (ExoPhone)</label>
                  <input
                    type="text"
                    value={eCallerId}
                    onChange={(e) => setECallerId(e.target.value)}
                    placeholder="+91 80 ..."
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-mono"
                  />
                </div>

                {/* APPLET / FLOW ID AS DROPDOWN */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-main)]">Applet / Flow ID</label>
                  <div className="relative">
                    <select
                      value={eAppId}
                      onChange={(e) => setEAppId(e.target.value)}
                      className="w-full appearance-none px-2.5 py-1.5 pr-7 bg-[var(--bg-input)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs text-[var(--text-main)] font-mono focus:outline-none cursor-pointer"
                    >
                      {exotelAppletOptions.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                          {opt.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-main)]">Twilio Account SID</label>
                  <input
                    type="text"
                    value={tSid}
                    onChange={(e) => setTSid(e.target.value)}
                    placeholder="AC..."
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-main)]">Auth Token</label>
                  <input
                    type="password"
                    value={tToken}
                    onChange={(e) => setTToken(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-main)]">Twilio Phone Number</label>
                  <input
                    type="text"
                    value={tPhone}
                    onChange={(e) => setTPhone(e.target.value)}
                    placeholder="+1 800 ..."
                    className="w-full px-2.5 py-1.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-mono"
                  />
                </div>

                {/* TWILIO TWIML APP AS DROPDOWN */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-[var(--text-main)]">TwiML App SID</label>
                  <div className="relative">
                    <select
                      value={tAppSid}
                      onChange={(e) => setTAppSid(e.target.value)}
                      className="w-full appearance-none px-2.5 py-1.5 pr-7 bg-[var(--bg-input)] border border-[var(--border-subtle)] hover:border-[var(--border-strong)] text-xs text-[var(--text-main)] font-mono focus:outline-none cursor-pointer"
                    >
                      {twilioAppOptions.map((opt) => (
                        <option key={opt.id} value={opt.id} className="bg-[var(--bg-surface)] text-[var(--text-main)]">
                          {opt.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audio Codec & DSP */}
          <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[var(--text-main)]">Audio Codec</span>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setCodec('PCMU')}
                  className={`px-2 py-0.5 text-[10px] font-mono border ${
                    codec === 'PCMU'
                      ? 'bg-[var(--bg-panel)] border-[var(--border-strong)] text-[var(--text-main)] font-bold'
                      : 'bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  PCMU (8k)
                </button>
                <button
                  type="button"
                  onClick={() => setCodec('PCM16')}
                  className={`px-2 py-0.5 text-[10px] font-mono border ${
                    codec === 'PCM16'
                      ? 'bg-[var(--bg-panel)] border-[var(--border-strong)] text-[var(--text-main)] font-bold'
                      : 'bg-[var(--bg-input)] border-[var(--border-subtle)] text-[var(--text-muted)]'
                  }`}
                >
                  PCM16 (16k)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                  <span>VAD Energy Threshold</span>
                  <span className="font-mono text-[var(--text-main)]">{vad}</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="1000"
                  step="25"
                  value={vad}
                  onChange={(e) => setVad(Number(e.target.value))}
                  className="w-full accent-black dark:accent-white bg-[var(--bg-input)] h-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                  <span>Silence Timeout</span>
                  <span className="font-mono text-[var(--text-main)]">{silence}ms</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="1200"
                  step="20"
                  value={silence}
                  onChange={(e) => setSilence(Number(e.target.value))}
                  className="w-full accent-black dark:accent-white bg-[var(--bg-input)] h-1"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-[10px] text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={bargeIn}
                  onChange={(e) => setBargeIn(e.target.checked)}
                  className="accent-black dark:accent-white"
                />
                <span>Voice Barge-in</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[10px] text-[var(--text-main)]">
                <input
                  type="checkbox"
                  checked={record}
                  onChange={(e) => setRecord(e.target.checked)}
                  className="accent-black dark:accent-white"
                />
                <span>Call Recording</span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
            <button
              type="button"
              onClick={closeSetup}
              className="px-3 py-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-main)] transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-4 py-1.5 bg-[var(--text-main)] text-[var(--bg-app)] hover:opacity-90 text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
            >
              {saved ? <CheckCircle2 size={13} className="text-emerald-500" /> : <Save size={13} />}
              <span>{saved ? 'Saved!' : `Save ${providerName}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
