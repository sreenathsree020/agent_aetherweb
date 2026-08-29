import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { addonService } from '../../../services/api';
import { useWorkflowStore } from '../../../stores/useWorkflowStore';

interface Props {
  nodeId: string;
  initialData: any;
}

export const WhatsAppConfigForm: React.FC<Props> = ({ nodeId, initialData }) => {
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const closeDrawer = useWorkflowStore((s) => s.closeDrawer);

  const existing = initialData.config || {};
  const [phoneNumberId, setPhoneNumberId] = useState(existing.phone_number_id || '');
  const [accessToken, setAccessToken] = useState(existing.access_token || '');
  const [testRecipient, setTestRecipient] = useState('+14155552671');
  const [testMessage, setTestMessage] = useState('Your order #9821 has shipped via FedEx tracking: 123456789');

  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const handleSendTest = async () => {
    setSending(true);
    setSendResult(null);
    try {
      const res = await addonService.testWhatsApp({
        phone_number_id: phoneNumberId || 'demo_phone_id',
        access_token: accessToken || 'demo_token',
        recipient_phone: testRecipient,
        message: testMessage,
      });
      setSendResult(JSON.stringify(res.result, null, 2));
    } catch (e: any) {
      setSendResult(`Error: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleSave = async () => {
    const config = { phone_number_id: phoneNumberId, access_token: accessToken };
    try {
      await addonService.saveAddon('whatsapp', initialData.label || 'WhatsApp Messenger', config);
    } catch (e) {
      console.warn('Saved locally', e);
    }
    updateNodeData(nodeId, {
      status: phoneNumberId ? 'connected' : 'unconfigured',
      configSummary: `WhatsApp ID: ${phoneNumberId || 'Simulated Mode'}`,
      config,
    });
    closeDrawer();
  };

  return (
    <div className="space-y-4 text-xs">
      <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
        <div className="flex items-center gap-2 font-semibold">
          <MessageSquare size={16} />
          <span>Meta WhatsApp Business Cloud API</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">
          Allows the AI Voice Agent to dispatch text receipts, links, or follow-ups to caller WhatsApp mid-call.
        </p>
      </div>

      <div>
        <label className="text-slate-400 font-medium">Meta Phone Number ID</label>
        <input
          type="text"
          value={phoneNumberId}
          onChange={(e) => setPhoneNumberId(e.target.value)}
          placeholder="109283746592019"
          className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
        />
      </div>

      <div>
        <label className="text-slate-400 font-medium">Permanent System User Access Token</label>
        <input
          type="password"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="EAAG..."
          className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
        />
      </div>

      <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
        <span className="text-[11px] font-semibold text-slate-300">Dispatch Test Message</span>
        <div>
          <label className="text-slate-500 text-[10px]">Recipient Phone</label>
          <input
            type="text"
            value={testRecipient}
            onChange={(e) => setTestRecipient(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300"
          />
        </div>
        <div>
          <label className="text-slate-500 text-[10px]">Message Content</label>
          <textarea
            rows={2}
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-xs text-slate-300"
          />
        </div>
        <button
          type="button"
          onClick={handleSendTest}
          disabled={sending}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium disabled:opacity-50"
        >
          <Send size={12} />
          <span>{sending ? 'Dispatching...' : 'Send Test WhatsApp'}</span>
        </button>

        {sendResult && (
          <pre className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-emerald-400 overflow-x-auto">
            {sendResult}
          </pre>
        )}
      </div>

      <div className="flex gap-2 pt-2 border-t border-slate-800">
        <button
          type="button"
          onClick={closeDrawer}
          className="w-1/2 py-2 rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 font-medium"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="w-1/2 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-600/20"
        >
          Save Addon
        </button>
      </div>
    </div>
  );
};
