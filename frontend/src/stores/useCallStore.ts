import { create } from 'zustand';
import { CallRecord, CallStats, CallTurn, ToolCallEvent } from '../types/call';
import { addonService } from '../services/api';

interface CallState {
  calls: CallRecord[];
  stats: CallStats | null;
  activeSessionId: string | null;
  isCallLive: boolean;
  isAiSpeaking: boolean;
  isMicActive: boolean;
  micVolume: number;
  liveTranscript: CallTurn[];
  liveToolCalls: ToolCallEvent[];
  latencyMs: number;
  ws: WebSocket | null;
  mediaStream: MediaStream | null;
  audioContext: AudioContext | null;
  processor: ScriptProcessorNode | null;

  fetchCallsAndStats: () => Promise<void>;
  startBrowserCall: () => Promise<void>;
  endBrowserCall: () => void;
  sendTextMessage: (text: string) => void;
}

export const useCallStore = create<CallState>((set, get) => ({
  calls: [],
  stats: null,
  activeSessionId: null,
  isCallLive: false,
  isAiSpeaking: false,
  isMicActive: false,
  micVolume: 0,
  liveTranscript: [],
  liveToolCalls: [],
  latencyMs: 0,
  ws: null,
  mediaStream: null,
  audioContext: null,
  processor: null,

  fetchCallsAndStats: async () => {
    try {
      const [calls, stats] = await Promise.all([
        addonService.getCalls(),
        addonService.getCallStats(),
      ]);
      set({ calls, stats });
    } catch (e) {
      console.error('Failed fetching calls', e);
    }
  },

  startBrowserCall: async () => {
    // Resolve backend WebSocket URL
    const apiBase = import.meta.env.VITE_API_BASE_URL || window.location.origin;
    let wsUrl: string;
    if (apiBase.startsWith('http')) {
      const url = new URL(apiBase);
      const wsProtocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${url.host}/ws/browser`;
    } else {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${wsProtocol}//${window.location.host}/ws/browser`;
    }

    const ws = new WebSocket(wsUrl);

    set({
      isCallLive: true,
      liveTranscript: [],
      liveToolCalls: [],
      ws,
    });

    ws.onmessage = async (event) => {
      if (typeof event.data === 'string') {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'greeting') {
            set((s) => ({
              liveTranscript: [...s.liveTranscript, { timestamp: new Date().toLocaleTimeString(), agent: msg.text }],
            }));
          } else if (msg.type === 'transcript') {
            set((s) => ({
              liveTranscript: [
                ...s.liveTranscript,
                msg.speaker === 'ai'
                  ? { timestamp: new Date().toLocaleTimeString(), agent: msg.text }
                  : { timestamp: new Date().toLocaleTimeString(), customer: msg.text },
              ],
            }));
          } else if (msg.type === 'tool_call') {
            set((s) => ({
              liveToolCalls: [
                ...s.liveToolCalls,
                {
                  timestamp: new Date().toLocaleTimeString(),
                  tool: msg.tool,
                  arguments: msg.arguments,
                  result: msg.result,
                },
              ],
            }));
          }
        } catch (e) {
          // ignore
        }
      } else if (event.data instanceof Blob) {
        // Play received raw audio response
        set({ isAiSpeaking: true });
        try {
          const arrayBuffer = await event.data.arrayBuffer();
          const playCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          const pcm16 = new Int16Array(arrayBuffer);
          const float32 = new Float32Array(pcm16.length);
          for (let i = 0; i < pcm16.length; i++) {
            float32[i] = pcm16[i] / 32768.0;
          }
          const audioBuffer = playCtx.createBuffer(1, float32.length, 16000);
          audioBuffer.getChannelData(0).set(float32);
          const source = playCtx.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(playCtx.destination);
          source.onended = () => {
            set({ isAiSpeaking: false });
            playCtx.close();
          };
          source.start();
        } catch (err) {
          console.error('Error playing AI audio:', err);
          set({ isAiSpeaking: false });
        }
      }
    };

    ws.onopen = async () => {
      // Initialize System Microphone Stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 16000,
          },
        });

        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const source = audioCtx.createMediaStreamSource(stream);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
          const { ws: activeWs, isAiSpeaking } = get();
          if (!activeWs || activeWs.readyState !== WebSocket.OPEN) return;

          // Compute input volume level for visualizer
          const inputData = e.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < inputData.length; i++) {
            sum += inputData[i] * inputData[i];
          }
          const rms = Math.sqrt(sum / inputData.length);
          set({ micVolume: Math.min(100, Math.round(rms * 400)) });

          // Convert Float32 to 16-bit PCM Linear
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
          }

          // Send audio frame to backend STT engine
          activeWs.send(pcm16.buffer);
        };

        set({
          mediaStream: stream,
          audioContext: audioCtx,
          processor,
          isMicActive: true,
        });
      } catch (micErr) {
        console.warn('System microphone permission denied or unavailable:', micErr);
      }
    };

    ws.onclose = () => {
      get().endBrowserCall();
      get().fetchCallsAndStats();
    };
  },

  endBrowserCall: () => {
    const { ws, mediaStream, audioContext, processor } = get();

    if (mediaStream) {
      mediaStream.getTracks().forEach((track) => track.stop());
    }
    if (processor) {
      processor.disconnect();
    }
    if (audioContext) {
      audioContext.close();
    }
    if (ws) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'end' }));
        } catch (e) {
          // ignore
        }
      }
      ws.close();
    }

    set({
      isCallLive: false,
      isAiSpeaking: false,
      isMicActive: false,
      micVolume: 0,
      ws: null,
      mediaStream: null,
      audioContext: null,
      processor: null,
    });
  },

  sendTextMessage: (text: string) => {
    const { ws } = get();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'text_message', message: text }));
      set((s) => ({
        liveTranscript: [...s.liveTranscript, { timestamp: new Date().toLocaleTimeString(), customer: text }],
      }));
    }
  },
}));
