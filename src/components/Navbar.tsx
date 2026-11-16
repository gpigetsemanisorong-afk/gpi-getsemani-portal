import React from 'react';
import {
  BookOpen,
  Church,
  Home,
  LogOut,
  Moon,
  Music,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { PageRoute } from '../types/church';
import { ChurchLogo } from './ChurchLogo';
import { PWAInstallButton } from './PWAComponents';

const DESKTOP_NAV: { id: PageRoute; label: string }[] = [
  { id: 'beranda', label: 'Beranda' },
  { id: 'tata-ibadah', label: 'Tata Ibadah' },
  { id: 'liturgi-unsur', label: 'Liturgi Unsur' },
  { id: 'jadwal', label: 'Jadwal' },
  { id: 'nyanyian', label: 'Kidung Pujian' },
  { id: 'alkitab', label: 'Alkitab' },
  { id: 'warta', label: 'Warta' },
];

const MOBILE_BOTTOM_NAV: { id: PageRoute; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'beranda', label: 'Beranda', icon: Home },
  { id: 'tata-ibadah', label: 'Tata Ibadah', icon: Church },
  { id: 'nyanyian', label: 'Kidung Pujian', icon: Music },
  { id: 'profil', label: 'Profil', icon: User },
];

export const TopNavbar: React.FC = () => {
  const {
    data,
    route,
    setRoute,
    isDark,
    toggleDark,
    fontScale,
    increaseFont,
    decreaseFont,
    currentUserRole,
    currentUsername,
    logoutAdmin,
  } = usePortal();

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-white/95 backdrop-blur-md dark:border-stone-800 dark:bg-[#14171D]/95">
      <div className="mx-auto flex h-14 max-w-[1280px] items-center justify-between gap-4 px-4 md:h-16 md:px-6">
        {/* Left: Logo + Brand */}
        <button
          type="button"
          onClick={() => setRoute('beranda')}
          className="flex min-w-0 items-center gap-3 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg"
        >
          <ChurchLogo size="sm" />
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold tracking-tight text-[#7F1D1D] dark:text-amber-400 md:text-base">
              {data.profile.name}
            </p>
            <p className="truncate text-[11px] font-medium text-stone-500 dark:text-stone-400">
              {data.profile.klasis}
            </p>
          </div>
        </button>

        {/* Center: Desktop/Tablet Navigation Links */}
        <nav className="hidden md:flex items-center gap-5 lg:gap-7" aria-label="Navigasi Utama">
          {DESKTOP_NAV.map((item) => {
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setRoute(item.id)}
                className={`relative py-1.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'text-[#7F1D1D] font-semibold dark:text-amber-400'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white'
                }`}
              >
                {item.label}
                {active && (
                  <span className="absolute inset-x-0 -bottom-[17px] h-0.5 bg-[#7F1D1D] dark:bg-amber-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Accessibility (A-/A+, Dark Mode) & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div
            className="flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5 dark:border-stone-700 dark:bg-stone-800/80"
            role="group"
            aria-label="Ukuran Teks"
          >
            <button
              type="button"
              onClick={decreaseFont}
              disabled={fontScale === 0}
              className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-stone-700 transition-colors hover:bg-white disabled:opacity-40 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
              title="Perkecil ukuran teks"
              aria-label="Perkecil teks"
            >
              A-
            </button>
            <button
              type="button"
              onClick={increaseFont}
              disabled={fontScale === 3}
              className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-bold text-stone-700 transition-colors hover:bg-white disabled:opacity-40 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
              title="Perbesar ukuran teks"
              aria-label="Perbesar teks"
            >
              A+
            </button>
          </div>

          <button
            type="button"
            onClick={toggleDark}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800/80 dark:text-amber-300 dark:hover:bg-stone-700 cursor-pointer"
            title={isDark ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="hidden sm:block">
            <PWAInstallButton compact />
          </div>

          {currentUserRole !== 'jemaat' && currentUserRole !== null && (
            <button
              type="button"
              onClick={() => setRoute('dashboard')}
              className="hidden lg:inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#7F1D1D] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#68151B] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Dashboard</span>
            </button>
          )}

          {currentUsername && (
            <button
              type="button"
              onClick={logoutAdmin}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 sm:px-3 text-xs font-semibold text-stone-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors cursor-pointer"
              title={`Keluar dari sistem (${currentUsername})`}
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export const MobileBottomNav: React.FC = () => {
  const { route, setRoute } = usePortal();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white/95 backdrop-blur-md pb-safe dark:border-stone-800 dark:bg-[#14171D]/95"
      aria-label="Navigasi Bawah"
    >
      <div className="grid h-16 grid-cols-4 items-center">
        {MOBILE_BOTTOM_NAV.map((item) => {
          const Icon = item.icon;
          const active = route === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setRoute(item.id)}
              className={`flex min-h-[48px] flex-col items-center justify-center gap-1 transition-colors cursor-pointer ${
                active
                  ? 'text-[#7F1D1D] dark:text-amber-400'
                  : 'text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              <span className={`text-[11px] leading-none ${active ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const ReadingToolbar: React.FC<{ title: string; subtitle?: string }> = ({
  title,
  subtitle,
}) => {
  const { fontScale, increaseFont, decreaseFont, isDark, toggleDark } = usePortal();
  const labels = ['Normal', 'Nyaman', 'Besar', 'Lansia'];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex items-center gap-2.5 min-w-0">
        <BookOpen className="h-4 w-4 shrink-0 text-[#7F1D1D] dark:text-amber-400" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
            {title}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="hidden sm:inline text-xs text-stone-500 dark:text-stone-400">
          Ukuran Teks: <strong className="text-stone-800 dark:text-stone-200">{labels[fontScale]}</strong>
        </span>
        <div className="flex items-center rounded-lg border border-stone-200 bg-stone-50 p-0.5 dark:border-stone-700 dark:bg-stone-800">
          <button
            type="button"
            onClick={decreaseFont}
            disabled={fontScale === 0}
            className="min-h-[36px] min-w-[36px] rounded-md px-2 text-xs font-bold text-stone-700 hover:bg-white disabled:opacity-40 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
          >
            A-
          </button>
          <button
            type="button"
            onClick={increaseFont}
            disabled={fontScale === 3}
            className="min-h-[36px] min-w-[36px] rounded-md px-2 text-xs font-bold text-stone-700 hover:bg-white disabled:opacity-40 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
          >
            A+
          </button>
        </div>
        <button
          type="button"
          onClick={toggleDark}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-stone-200 bg-stone-50 px-2.5 text-xs font-medium text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-amber-300 dark:hover:bg-stone-700 cursor-pointer"
        >
          {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          <span className="hidden sm:inline">{isDark ? 'Terang' : 'Gelap'}</span>
        </button>
      </div>
    </div>
  );
};
