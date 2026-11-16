import React from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { usePortal } from '../context/PortalContext';

export const Footer: React.FC = () => {
  const { data, setRoute, currentUserRole, currentUsername, logoutAdmin } = usePortal();

  return (
    <footer className="mt-14 border-t border-stone-200 bg-white/80 pb-24 pt-8 dark:border-stone-800 dark:bg-[#14171D]/80 md:pb-10">
      <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-4 sm:flex-row sm:items-center md:px-6">
        <div>
          <p className="font-display text-sm font-bold text-[#7F1D1D] dark:text-amber-400">
            {data.profile.name}
          </p>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            {data.profile.synod} · {data.profile.klasis}
          </p>
          <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
            {data.profile.address}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setRoute('tentang')}
            className="text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer"
          >
            Tentang Aplikasi
          </button>
          <button
            type="button"
            onClick={() => setRoute('profil')}
            className="text-xs font-medium text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer"
          >
            Profil & Kontak
          </button>
          {currentUserRole !== 'jemaat' && currentUserRole !== null && (
            <button
              type="button"
              onClick={() => setRoute('dashboard')}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-amber-500 hover:text-[#7F1D1D] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:text-amber-400 cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Dashboard Admin</span>
            </button>
          )}
          {currentUsername && (
            <button
              type="button"
              onClick={logoutAdmin}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Keluar ({currentUsername})</span>
            </button>
          )}
        </div>
      </div>
    </footer>
  );
};
