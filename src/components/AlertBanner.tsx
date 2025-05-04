
import React from 'react';

interface AlertBannerProps {
  message: string;
}

const AlertBanner = ({ message }: AlertBannerProps) => {
  return (
    <div className="bg-amber-900/20 border border-amber-800 rounded-lg p-4 text-amber-100 flex items-start mb-6">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mr-2 mt-0.5 text-amber-400"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      <div>{message}</div>
    </div>
  );
};

export default AlertBanner;
