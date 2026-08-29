import React from 'react';
import { LLMProvider } from '../../stores/useLLMStore';

interface ProviderIconProps {
  provider: LLMProvider | string;
  className?: string;
  size?: number;
}

export const ProviderIcon: React.FC<ProviderIconProps> = ({ provider, className = '', size = 15 }) => {
  const norm = (provider || '').toLowerCase();

  // OpenAI
  if (norm.includes('openai')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`shrink-0 text-white ${className}`}
      >
        <path d="M22.28 9.2a9.63 9.63 0 0 0-.7-2.6 5.8 5.8 0 0 0-3.3-3.3 9.6 9.6 0 0 0-5.7-.3 5.76 5.76 0 0 0-4.3 3.1 9.77 9.77 0 0 0-2.3 2 5.8 5.8 0 0 0-.8 4.6 9.6 9.6 0 0 0 .7 2.6 5.8 5.8 0 0 0 3.3 3.3 9.6 9.6 0 0 0 5.7.3 5.76 5.76 0 0 0 4.3-3.1 9.77 9.77 0 0 0 2.3-2 5.8 5.8 0 0 0 .8-4.6zm-10.2 9.8a3.8 3.8 0 0 1-2.2-.7l.1-.1 3.7-2.1a1 1 0 0 0 .5-.9V9.9l1.6.9v4.4a3.8 3.8 0 0 1-3.7 3.8zm-6.2-4.1a3.8 3.8 0 0 1-.5-2.3l.1.1 3.7 2.1a1 1 0 0 0 1 0l4.6-2.6v1.9l-3.8 2.2a3.8 3.8 0 0 1-5.1-1.4zm-.8-7.5a3.8 3.8 0 0 1 1.7-1.6V8l3.7 2.1a1 1 0 0 0 1 0L17 7.4V5.5l-3.8-2.2a3.8 3.8 0 0 1-5.1 1.4zm12.3 3.4L13.7 8.2a1 1 0 0 0-1 0L8.1 10.8V8.9l3.8-2.2a3.8 3.8 0 0 1 5.4 3.9zm1.4 4.5l-3.7-2.1a1 1 0 0 0-1 0l-4.6 2.6V13l3.8-2.2a3.8 3.8 0 0 1 5.5 3.9zm-4.7-1.8L12 12.3 9.8 11l2.2-1.3 2.2 1.3z" />
      </svg>
    );
  }

  // Anthropic Claude
  if (norm.includes('anthropic') || norm.includes('claude')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={`shrink-0 text-[#D97706] ${className}`}
      >
        <path d="M13.8 3.2L12 7.1 10.2 3.2C9.8 2.3 8.7 1.8 7.7 2.2 6.8 2.6 6.3 3.7 6.7 4.7L9 9.6H4.2C3.1 9.6 2.2 10.5 2.2 11.6c0 1.1.9 2 2 2H9l-2.3 4.9c-.4 1 .1 2.1 1 2.5.3.1.7.2 1 .2.7 0 1.4-.4 1.7-1.1L12 16.2l1.8 3.9c.4 1 1.5 1.5 2.5 1.1.9-.4 1.4-1.5 1-2.5L15 13.6h4.8c1.1 0 2-.9 2-2s-.9-2-2-2H15l2.3-4.9c.4-1-.1-2.1-1-2.5-.9-.4-2.1.1-2.5 1z" />
      </svg>
    );
  }

  // Google Gemini
  if (norm.includes('gemini') || norm.includes('google')) {
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
          d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z"
          fill="url(#gemini_grad)"
        />
        <defs>
          <linearGradient id="gemini_grad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#93C5FD" />
            <stop offset="0.5" stopColor="#A855F7" />
            <stop offset="1" stopColor="#EC4899" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // Groq LPU
  if (norm.includes('groq')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <rect width="24" height="24" rx="6" fill="#18181B" stroke="#F97316" strokeWidth="1.5" />
        <path
          d="M13.5 4.5L6.5 13H12L10.5 19.5L17.5 11H12L13.5 4.5Z"
          fill="#F97316"
        />
      </svg>
    );
  }

  // OpenRouter (Default Multi-Gateway)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <rect width="24" height="24" rx="6" fill="#18181B" stroke="#6366F1" strokeWidth="1.5" />
      <path
        d="M6 12H18M12 6V18M7.75 7.75L16.25 16.25M16.25 7.75L7.75 16.25"
        stroke="#818CF8"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
