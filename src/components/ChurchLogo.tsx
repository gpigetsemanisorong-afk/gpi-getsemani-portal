import React, { useState } from 'react';
import { usePortal } from '../context/PortalContext';

export const ChurchLogo: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const { data } = usePortal();
  const [imgError, setImgError] = useState(false);

  const dims =
    size === 'sm'
      ? 'h-9 w-9'
      : size === 'lg'
      ? 'h-16 w-16'
      : 'h-11 w-11';

  const logoSrc = data.profile.logoUrl || '/icon.svg';

  if (imgError) {
    return (
      <div
        className={`${dims} flex shrink-0 items-center justify-center rounded-xl bg-[#7F1D1D] text-amber-300 ring-1 ring-amber-500/40`}
        aria-label="Logo GPI Getsemani Sorong"
      >
        <svg viewBox="0 0 64 64" className="h-3/4 w-3/4" fill="none">
          <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="2.5" />
          <path d="M32 14v32M21 24h22" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M16 44c5-4 11-4 16 0s11 4 16 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={logoSrc}
      alt="Logo GPI Getsemani Sorong"
      referrerPolicy="no-referrer"
      onError={() => setImgError(true)}
      className={`${dims} shrink-0 rounded-xl object-cover ring-1 ring-amber-500/30 bg-[#7F1D1D]`}
    />
  );
};
