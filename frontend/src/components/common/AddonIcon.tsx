import React from 'react';
import { ProviderIcon } from './ProviderIcon';
import { useLLMStore } from '../../stores/useLLMStore';

interface AddonIconProps {
  type: string;
  className?: string;
  size?: number;
}

export const AddonIcon: React.FC<AddonIconProps> = ({ type, className = '', size = 16 }) => {
  const normType = (type || '').toLowerCase();
  const currentProvider = useLLMStore.getState().provider;

  if (normType === 'llm' || normType.includes('reasoning') || normType.includes('model')) {
    return <ProviderIcon provider={currentProvider} size={size} className={className} />;
  }

  if (normType.includes('gmail') || normType.includes('mail')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <path
          d="M2 5.5V18.5C2 19.6 2.9 20.5 4 20.5H20C21.1 20.5 22 19.6 22 18.5V5.5L12 13L2 5.5Z"
          fill="#EA4335"
        />
        <path
          d="M20 3.5H4C2.9 3.5 2 4.4 2 5.5L12 13L22 5.5C22 4.4 21.1 3.5 20 3.5Z"
          fill="#DB4437"
        />
        <path
          d="M22 5.5V18.5C22 19.6 21.1 20.5 20 20.5H18V10.2L22 7.2V5.5Z"
          fill="#C5221F"
        />
        <path
          d="M2 5.5V7.2L6 10.2V20.5H4C2.9 20.5 2 19.6 2 18.5V5.5Z"
          fill="#C5221F"
        />
      </svg>
    );
  }

  if (normType.includes('whatsapp')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <circle cx="12" cy="12" r="11" fill="#25D366" />
        <path
          d="M17.5 14.3C17.2 14.1 15.7 13.4 15.4 13.3C15.1 13.2 14.9 13.1 14.7 13.4C14.5 13.7 14.0 14.3 13.8 14.5C13.6 14.7 13.4 14.7 13.1 14.5C12.8 14.4 11.8 14.1 10.7 13.1C9.8 12.3 9.2 11.3 9.0 11.0C8.8 10.7 9.0 10.5 9.1 10.4C9.3 10.2 9.5 10.0 9.6 9.8C9.7 9.6 9.8 9.5 9.9 9.3C10.0 9.1 9.9 8.9 9.9 8.8C9.8 8.7 9.2 7.3 9.0 6.7C8.7 6.1 8.5 6.2 8.3 6.2H7.8C7.6 6.2 7.2 6.3 6.9 6.6C6.6 6.9 5.8 7.7 5.8 9.2C5.8 10.7 6.9 12.1 7.1 12.3C7.2 12.5 9.3 15.7 12.4 17.1C13.2 17.4 13.8 17.6 14.3 17.8C15.0 18.0 15.7 18.0 16.3 17.9C16.9 17.8 18.2 17.1 18.5 16.3C18.8 15.5 18.8 14.8 18.7 14.7C18.6 14.5 18.4 14.4 18.1 14.3H17.5Z"
          fill="white"
        />
      </svg>
    );
  }

  if (normType.includes('database') || normType.includes('sql') || normType.includes('postgres') || normType.includes('mysql')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" fill="#3B82F6" />
        <path
          d="M3 5V12C3 13.66 7.03 15 12 15C16.97 15 21 13.66 21 12V5"
          stroke="#60A5FA"
          strokeWidth="1.5"
          fill="#1E40AF"
          fillOpacity="0.4"
        />
        <ellipse cx="12" cy="12" rx="9" ry="3" stroke="#60A5FA" strokeWidth="1.5" />
        <path
          d="M3 12V19C3 20.66 7.03 22 12 22C16.97 22 21 20.66 21 19V12"
          stroke="#93C5FD"
          strokeWidth="1.5"
          fill="#1E3A8A"
          fillOpacity="0.6"
        />
        <ellipse cx="12" cy="19" rx="9" ry="3" stroke="#93C5FD" strokeWidth="1.5" />
      </svg>
    );
  }

  // Telephony Inbound Trigger
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="10" fill="#18181B" stroke="#27272A" strokeWidth="1.5" />
      <path
        d="M15.05 13.5C14.55 13.5 14.07 13.42 13.62 13.27C13.48 13.22 13.32 13.26 13.21 13.37L12.3 14.52C10.38 13.54 8.78 11.96 7.78 10.02L8.93 8.87C9.04 8.76 9.08 8.6 9.03 8.46C8.88 8.01 8.8 7.53 8.8 7.03C8.8 6.69 8.53 6.42 8.19 6.42H6.55C6.21 6.42 5.92 6.7 5.95 7.04C6.2 10.54 9.03 13.37 12.53 13.62C12.87 13.65 13.15 13.36 13.15 13.02V11.38C13.15 11.04 12.88 10.77 12.54 10.77"
        fill="#10B981"
      />
      <path
        d="M15 7C16.66 7.5 17.5 8.34 18 10"
        stroke="#10B981"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
