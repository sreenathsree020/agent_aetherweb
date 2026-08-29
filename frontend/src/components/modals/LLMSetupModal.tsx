import React, { useState, useEffect } from 'react';
import { useLLMStore, PROVIDERS_DATA } from '../../stores/useLLMStore';
import { Bot, X, Save, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export const LLMSetupModal: React.FC = () => {
  const {
    provider,
    selectedModels,
    apiKeys,
    temperature,
    maxTokens,
    systemPrompt,
    isSetupOpen,
    closeSetup,
    setProvider,
    setModelForProvider,
    setApiKey,
    updateTuning,
  } = useLLMStore();

  const [currentModel, setCurrentModel] = useState<string>('');
  const [currentKey, setCurrentKey] = useState<string>('');
  const [currentTemp, setCurrentTemp] = useState<number>(0.6);
  const [currentTokens, setCurrentTokens] = useState<number>(150);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  const providerData = PROVIDERS_DATA[provider] || PROVIDERS_DATA.openrouter;

  // Sync state on open or provider change
  useEffect(() => {
    if (isSetupOpen) {
      setCurrentModel(selectedModels[provider] || providerData.defaultModel);
      setCurrentKey(apiKeys[provider] || '');
      setCurrentTemp(temperature);
      setCurrentTokens(maxTokens);
      setCurrentPrompt(systemPrompt);
    }
  }, [isSetupOpen, provider, selectedModels, apiKeys, temperature, maxTokens, systemPrompt, providerData.defaultModel]);

  if (!isSetupOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProvider(provider);
    setModelForProvider(provider, currentModel);
    setApiKey(provider, currentKey);
    updateTuning(currentTemp, currentTokens, currentPrompt);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      closeSetup();
    }, 700);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-strong)] shadow-2xl overflow-hidden font-sans text-[var(--text-main)]">
        {/* Modal Header */}
        <div className="p-4 bg-[var(--bg-input)] border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)]">
              <Bot size={15} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[var(--text-main)] tracking-tight">
                {providerData.name} Setup
              </h3>
              <p className="text-[10px] text-[var(--text-muted)]">
                Select model and enter {providerData.name} credentials
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

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs bg-[var(--bg-surface)]">
          {/* Model Selection Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-main)] mb-1">
              Select {providerData.name} Model
            </label>
            <select
              value={currentModel}
              onChange={(e) => setCurrentModel(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-mono focus:outline-none focus:border-[var(--border-strong)]"
            >
              {providerData.models.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.speed})
                </option>
              ))}
            </select>
            <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
              {providerData.description}
            </span>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-main)] mb-1">
              {providerData.name} API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={currentKey}
                onChange={(e) => setCurrentKey(e.target.value)}
                placeholder={`Enter your ${providerData.name} API key...`}
                className="w-full pl-3 pr-8 py-2 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] font-mono placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)]"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                {showKey ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
              Encrypted locally in environment memory.
            </span>
          </div>

          {/* System Instructions / Persona */}
          <div>
            <label className="block text-[11px] font-semibold text-[var(--text-main)] mb-1">
              System Personality &amp; Voice Instructions
            </label>
            <textarea
              rows={2}
              value={currentPrompt}
              onChange={(e) => setCurrentPrompt(e.target.value)}
              className="w-full p-2.5 bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-main)] focus:outline-none focus:border-[var(--border-strong)] leading-relaxed"
            />
          </div>

          {/* Sliders */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                <span>Temperature</span>
                <span className="font-mono text-[var(--text-main)]">{currentTemp}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={currentTemp}
                onChange={(e) => setCurrentTemp(parseFloat(e.target.value))}
                className="w-full accent-black dark:accent-white bg-[var(--bg-input)] h-1 rounded appearance-none cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
                <span>Max Tokens</span>
                <span className="font-mono text-[var(--text-main)]">{currentTokens}</span>
              </div>
              <input
                type="range"
                min="50"
                max="350"
                step="10"
                value={currentTokens}
                onChange={(e) => setCurrentTokens(parseInt(e.target.value))}
                className="w-full accent-black dark:accent-white bg-[var(--bg-input)] h-1 rounded appearance-none cursor-pointer"
              />
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
              <span>{saved ? 'Applied!' : 'Apply Model'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
