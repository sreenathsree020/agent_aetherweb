import { create } from 'zustand';

export type LLMProvider = 'openrouter' | 'openai' | 'anthropic' | 'groq' | 'gemini';

export interface ProviderInfo {
  id: LLMProvider;
  name: string;
  badge: string;
  description: string;
  defaultModel: string;
  models: { id: string; name: string; speed: string }[];
}

export const PROVIDERS_DATA: Record<LLMProvider, ProviderInfo> = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: 'Free Tier Available',
    description: 'Unified gateway for Llama 3.3, DeepSeek, and Mistral.',
    defaultModel: 'openrouter/free',
    models: [
      { id: 'openrouter/free', name: 'OpenRouter Free Tier (Llama / Mistral)', speed: '~280ms' },
      { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', speed: '~320ms' },
      { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1 (Reasoning)', speed: '~420ms' },
      { id: 'mistralai/mistral-large-2411', name: 'Mistral Large 2411', speed: '~390ms' },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    badge: 'Official API',
    description: 'High intelligence and ultra-fast mini models.',
    defaultModel: 'gpt-4o-mini',
    models: [
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini (Fast & Cost Effective)', speed: '~220ms' },
      { id: 'gpt-4o', name: 'GPT-4o (Omni Reasoning)', speed: '~360ms' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', speed: '~400ms' },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic Claude',
    badge: 'Claude 3.5',
    description: 'Natural spoken dialogue and nuanced conversational logic.',
    defaultModel: 'claude-3-5-sonnet-20241022',
    models: [
      { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Ultra Fast)', speed: '~200ms' },
      { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (State-of-the-Art)', speed: '~380ms' },
      { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', speed: '~600ms' },
    ],
  },
  groq: {
    id: 'groq',
    name: 'Groq LPU',
    badge: '<120ms Latency',
    description: 'Inference on custom LPU chips designed for voice agents.',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile', speed: '~110ms' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant', speed: '~80ms' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B MoE', speed: '~130ms' },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: '1M Context',
    description: 'Massive context memory for long multi-turn call transcripts.',
    defaultModel: 'gemini-1.5-flash',
    models: [
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Voice Tuned)', speed: '~230ms' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', speed: '~400ms' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash (Experimental)', speed: '~190ms' },
    ],
  },
};

interface LLMState {
  provider: LLMProvider;
  selectedModels: Record<LLMProvider, string>;
  apiKeys: Record<LLMProvider, string>;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  isSetupOpen: boolean;

  openSetup: (provider?: LLMProvider) => void;
  closeSetup: () => void;
  setProvider: (provider: LLMProvider) => void;
  setModelForProvider: (provider: LLMProvider, modelId: string) => void;
  setApiKey: (provider: LLMProvider, key: string) => void;
  updateTuning: (temperature: number, maxTokens: number, systemPrompt: string) => void;
}

export const useLLMStore = create<LLMState>((set) => ({
  provider: 'openrouter',
  selectedModels: {
    openrouter: 'openrouter/free',
    openai: 'gpt-4o-mini',
    anthropic: 'claude-3-5-sonnet-20241022',
    groq: 'llama-3.3-70b-versatile',
    gemini: 'gemini-1.5-flash',
  },
  apiKeys: {
    openrouter: 'sk-or-v1-••••••••••••••••••••••••',
    openai: '',
    anthropic: '',
    groq: '',
    gemini: '',
  },
  temperature: 0.6,
  maxTokens: 150,
  systemPrompt: 'You are a helpful, concise AI voice agent. Reply in short, natural spoken sentences suited for phone calls.',
  isSetupOpen: false,

  openSetup: (targetProvider?: LLMProvider) =>
    set((state) => ({
      isSetupOpen: true,
      provider: targetProvider || state.provider,
    })),
  closeSetup: () => set({ isSetupOpen: false }),
  setProvider: (provider: LLMProvider) => set({ provider }),
  setModelForProvider: (provider: LLMProvider, modelId: string) =>
    set((state) => ({
      selectedModels: { ...state.selectedModels, [provider]: modelId },
    })),
  setApiKey: (provider: LLMProvider, key: string) =>
    set((state) => ({
      apiKeys: { ...state.apiKeys, [provider]: key },
    })),
  updateTuning: (temperature: number, maxTokens: number, systemPrompt: string) =>
    set({ temperature, maxTokens, systemPrompt }),
}));
