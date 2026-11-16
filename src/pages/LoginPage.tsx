import React, { useState } from 'react';
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Moon,
  Shield,
  Sun,
  User,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { ChurchLogo } from '../components/ChurchLogo';

export const LoginPage: React.FC = () => {
  const { data, loginAdmin, isDark, toggleDark } = usePortal();

  // Input username dan password benar-benar kosong sejak awal
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    const res = loginAdmin(username, password);
    setIsLoading(false);

    if (!res.ok) {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF8F5] via-stone-50 to-stone-100 dark:from-[#0B0D11] dark:via-[#0F1115] dark:to-[#14171E] flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar with Brand & Dark Mode Toggle */}
      <header className="mx-auto w-full max-w-5xl flex items-center justify-between pb-4">
        <div className="flex items-center gap-3">
          <ChurchLogo size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-[#7F1D1D] dark:text-amber-400">
              {data.profile.synod}
            </p>
            <p className="text-[11px] text-stone-500 dark:text-stone-400">
              {data.profile.klasis} · {data.profile.name}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleDark}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-xs hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-800 dark:text-amber-300 dark:hover:bg-stone-700 transition-colors cursor-pointer"
          title={isDark ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
          aria-label={isDark ? 'Mode Terang' : 'Mode Gelap'}
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* Main Login Card */}
      <main className="my-auto mx-auto w-full max-w-md py-4">
        <div className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-xl shadow-stone-200/50 dark:border-stone-800 dark:bg-stone-900 dark:shadow-none sm:p-8">
          {/* Header Info */}
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <ChurchLogo size="lg" />
              <div className="absolute -bottom-1 -right-1 rounded-full bg-[#7F1D1D] p-1.5 text-white shadow-sm dark:bg-amber-500 dark:text-stone-950">
                <Shield className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-900 dark:bg-amber-400/10 dark:text-amber-300">
              <Lock className="h-3 w-3" />
              <span>Sistem Terproteksi — Akses Terbatas</span>
            </div>

            <h1 className="mt-2.5 text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-2xl font-display">
              {data.profile.name}
            </h1>
            <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 max-w-xs">
              Silakan masukkan username dan kata sandi Anda untuk mengakses portal gereja sesuai dengan hak akses yang diberikan.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {/* Username Input */}
            <div>
              <label
                htmlFor="username-input"
                className="block text-xs font-semibold text-stone-700 dark:text-stone-300"
              >
                Username / Nama Pengguna
              </label>
              <div className="relative mt-1.5">
                <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="username-input"
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Masukkan username Anda"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/70 py-2.5 pl-10 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#7F1D1D] focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-100 dark:focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {/* Password Input with Show/Hide Toggle Button */}
            <div>
              <label
                htmlFor="password-input"
                className="block text-xs font-semibold text-stone-700 dark:text-stone-300"
              >
                Kata Sandi
              </label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errorMsg) setErrorMsg(null);
                  }}
                  placeholder="Masukkan kata sandi"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50/70 py-2.5 pl-10 pr-10 text-sm text-stone-900 placeholder:text-stone-400 focus:border-[#7F1D1D] focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800/80 dark:text-stone-100 dark:focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                  title={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                  aria-label={showPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 animate-shake">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="font-medium leading-relaxed">{errorMsg}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#7F1D1D] py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#68151B] active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>{isLoading ? 'Memverifikasi Akun...' : 'Masuk ke Sistem'}</span>
            </button>
          </form>

          {/* Security & Confidentiality Footer */}
          <div className="mt-6 border-t border-stone-150 pt-4 text-center dark:border-stone-800">
            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              Pastikan Anda menggunakan username dan kata sandi resmi yang telah diberikan oleh Majelis Jemaat untuk mengakses fitur pelayanan.
            </p>
          </div>
        </div>
      </main>

      {/* Footer Notice */}
      <footer className="mx-auto w-full max-w-md pt-4 text-center">
        <p className="text-[11px] text-stone-400 dark:text-stone-500">
          © {new Date().getFullYear()} {data.profile.name}. Sistem Informasi Gereja & Layanan Terpadu Jemaat.
        </p>
      </footer>
    </div>
  );
};
