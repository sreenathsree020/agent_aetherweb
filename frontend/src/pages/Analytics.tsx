import React, { useEffect, useState } from 'react';
import { Clock, Smile, Meh, Frown, Activity, BarChart3, TrendingUp, Sparkles, Filter } from 'lucide-react';
import { addonService } from '../services/api';

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await addonService.getAnalyticsSummary();
        setData(res);
      } catch (e) {
        console.error('Failed fetching analytics', e);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const latencyItems = data?.latency_waterfall || [
    { label: 'Deepgram STT (8kHz μ-law)', value: '184ms', share: '28%', color: 'bg-emerald-500' },
    { label: 'OpenRouter TTFT (LLM)', value: '312ms', share: '46%', color: 'bg-blue-500' },
    { label: 'Deepgram TTS (16kHz PCM)', value: '128ms', share: '19%', color: 'bg-purple-500' },
    { label: 'Telephony Stream Network', value: '45ms', share: '7%', color: 'bg-amber-500' },
  ];

  const sentiment = data?.sentiment || { positive: 74, neutral: 21, negative: 5, csat_score: 84 };
  const intents = data?.top_intents || [
    { intent: 'Order Status & Tracking', count: 18, pct: '42%' },
    { intent: 'Billing & Invoices', count: 12, pct: '28%' },
    { intent: 'Integration Support', count: 8, pct: '18%' },
    { intent: 'General Inquiries', count: 5, pct: '12%' },
  ];

  return (
    <div className="flex-1 overflow-y-auto no-scrollbar bg-zinc-50/50 dark:bg-black px-6 sm:px-8 py-5 sm:py-6 space-y-6 w-full font-sans transition-colors duration-150">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 tracking-tight flex items-center gap-2">
            <span>Advanced Telephony Analytics</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
              P95 Telemetry
            </span>
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time audio latency breakdown, LLM sentiment scoring, and intent distribution.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Real-time stream telemetry active</span>
        </div>
      </div>

      {/* Grid of Telemetry Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Latency Waterfall (Span 7) */}
        <div className="lg:col-span-7 p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                End-to-End Latency Waterfall
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
              Total P95: 669ms
            </span>
          </div>

          <div className="space-y-3.5 pt-1">
            {latencyItems.map((item: any) => (
              <div key={item.label} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-zinc-600 dark:text-zinc-400 text-[11px]">{item.label}</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className="text-zinc-900 dark:text-zinc-100 font-semibold">{item.value}</span>
                    <span className="text-zinc-400 text-[10px]">({item.share})</span>
                  </div>
                </div>
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <div className={`h-full rounded-full ${item.color}`} style={{ width: item.share }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentiment Analysis Distribution (Span 5) */}
        <div className="lg:col-span-5 p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Customer Sentiment Score
            </h3>
            <span className="text-xs font-mono text-emerald-500 font-bold">+{sentiment.csat_score} Net CSAT</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center py-2">
            <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/40 dark:border-emerald-800/40">
              <Smile size={18} className="mx-auto text-emerald-500 mb-1" />
              <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400">{sentiment.positive}%</span>
              <span className="text-[10px] block text-zinc-500 mt-0.5">Positive</span>
            </div>

            <div className="p-3 rounded-lg bg-zinc-50/60 dark:bg-zinc-800/40 border border-zinc-200/40 dark:border-zinc-700/40">
              <Meh size={18} className="mx-auto text-zinc-400 mb-1" />
              <span className="text-xl font-bold font-mono text-zinc-700 dark:text-zinc-300">{sentiment.neutral}%</span>
              <span className="text-[10px] block text-zinc-500 mt-0.5">Neutral</span>
            </div>

            <div className="p-3 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/40 dark:border-rose-800/40">
              <Frown size={18} className="mx-auto text-rose-500 mb-1" />
              <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400">{sentiment.negative}%</span>
              <span className="text-[10px] block text-zinc-500 mt-0.5">Negative</span>
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] text-zinc-500 font-mono text-center">
            Computed via zero-shot GPT-4o-mini classification
          </div>
        </div>
      </div>

      {/* Top Customer Intents & Classification */}
      <div className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800/70 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-purple-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              Primary Call Intent Categorization
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Automated routing breakdown</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {intents.map((item: any) => (
            <div
              key={item.intent}
              className="p-3.5 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/20 space-y-2"
            >
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block truncate">
                {item.intent}
              </span>
              <div className="flex items-baseline justify-between font-mono">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{item.count}</span>
                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">{item.pct}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
