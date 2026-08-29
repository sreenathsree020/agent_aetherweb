import { create } from 'zustand';

export type TelephonyProvider = 'exotel' | 'twilio';

interface TelephonyState {
  provider: TelephonyProvider;
  isSetupOpen: boolean;
  
  // Exotel Credentials
  exotelSid: string;
  exotelApiKey: string;
  exotelToken: string;
  exotelSubdomain: string;
  exotelCallerId: string;
  exotelAppId: string;

  // Twilio Credentials
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioPhoneNumber: string;
  twilioTwiMLAppSid: string;

  // Audio DSP & Stream Tuning
  audioCodec: 'PCMU' | 'PCM16';
  vadThreshold: number;
  silenceDuration: number;
  bargeInEnabled: boolean;
  recordCalls: boolean;

  // Actions
  setProvider: (provider: TelephonyProvider) => void;
  openSetup: (provider?: TelephonyProvider) => void;
  closeSetup: () => void;
  updateExotelConfig: (config: Partial<{
    exotelSid: string;
    exotelApiKey: string;
    exotelToken: string;
    exotelSubdomain: string;
    exotelCallerId: string;
    exotelAppId: string;
  }>) => void;
  updateTwilioConfig: (config: Partial<{
    twilioAccountSid: string;
    twilioAuthToken: string;
    twilioPhoneNumber: string;
    twilioTwiMLAppSid: string;
  }>) => void;
  updateDSPConfig: (config: Partial<{
    audioCodec: 'PCMU' | 'PCM16';
    vadThreshold: number;
    silenceDuration: number;
    bargeInEnabled: boolean;
    recordCalls: boolean;
  }>) => void;
}

export const useTelephonyStore = create<TelephonyState>((set) => ({
  provider: 'exotel',
  isSetupOpen: false,

  exotelSid: 'exotel_tenant_live_9481',
  exotelApiKey: 'ak_live_729480194817',
  exotelToken: 'tok_sec_••••••••••••••••',
  exotelSubdomain: 'api.exotel.com',
  exotelCallerId: '+91 80 4719 0000',
  exotelAppId: 'voice_bot_flow_v2',

  twilioAccountSid: 'AC_live_twilio_8492048102',
  twilioAuthToken: 'tw_sec_••••••••••••••••',
  twilioPhoneNumber: '+1 800 555 0199',
  twilioTwiMLAppSid: 'AP_live_stream_app_v1',

  audioCodec: 'PCMU',
  vadThreshold: 450,
  silenceDuration: 480,
  bargeInEnabled: true,
  recordCalls: true,

  setProvider: (provider) => set({ provider }),
  openSetup: (provider) => set((state) => ({ isSetupOpen: true, provider: provider || state.provider })),
  closeSetup: () => set({ isSetupOpen: false }),

  updateExotelConfig: (config) => set((state) => ({ ...state, ...config })),
  updateTwilioConfig: (config) => set((state) => ({ ...state, ...config })),
  updateDSPConfig: (config) => set((state) => ({ ...state, ...config })),
}));
