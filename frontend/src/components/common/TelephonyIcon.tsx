import React from 'react';
import { TelephonyProvider } from '../../stores/useTelephonyStore';

interface TelephonyIconProps {
  provider: TelephonyProvider | string;
  className?: string;
  size?: number;
}

export const TelephonyIcon: React.FC<TelephonyIconProps> = ({
  provider,
  className = '',
  size = 14,
}) => {
  const norm = (provider || '').toLowerCase();

  if (norm.includes('twilio')) {
    // Official Twilio Red Badge
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`shrink-0 ${className}`}
      >
        <circle cx="12" cy="12" r="11" fill="#F22F46" />
        <circle cx="8" cy="8" r="2" fill="white" />
        <circle cx="16" cy="8" r="2" fill="white" />
        <circle cx="8" cy="16" r="2" fill="white" />
        <circle cx="16" cy="16" r="2" fill="white" />
      </svg>
    );
  }

  // Official Exotel Icon
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
    >
      <circle cx="12" cy="12" r="11" fill="#0D9488" />
      <path
        d="M15.5 14C15 14 14.5 13.9 14.1 13.7C13.9 13.6 13.8 13.7 13.7 13.8L12.8 14.9C11.1 14 9.8 12.6 8.9 10.9L10 10C10.1 9.9 10.2 9.7 10.1 9.5C9.9 9.1 9.8 8.6 9.8 8.1C9.8 7.8 9.5 7.5 9.2 7.5H7.6C7.3 7.5 7 7.8 7 8.1C7 12.8 10.8 16.6 15.5 16.6C15.8 16.6 16.1 16.3 16.1 16V14.4C16.1 14.1 15.8 14 15.5 14Z"
        fill="white"
      />
      <path
        d="M14.5 7.5C16.2 7.9 17.5 9.2 17.9 10.9"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
