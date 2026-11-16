import React, { useState } from 'react';
import { Download, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-700 whitespace-nowrap shrink-0 cursor-pointer"
        title="Pasang aplikasi ke layar utama"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>{compact ? 'Pasang' : 'Pasang Aplikasi'}</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Smartphone className="h-4 w-4 shrink-0" />
          <span>Pasang di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-800 dark:bg-stone-900">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
                  Pasang di iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                  aria-label="Tutup panduan"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-stone-600 dark:text-stone-300">
                <li>1. Ketuk tombol <strong>Bagikan (Share)</strong> pada bilah Safari.</li>
                <li>2. Gulir ke bawah dan pilih <strong>Tambahkan ke Layar Utama (Add to Home Screen)</strong>.</li>
                <li>3. Ketuk <strong>Tambah</strong> untuk membuka aplikasi seperti aplikasi asli.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#7F1D1D] py-2.5 text-sm font-semibold text-white hover:bg-[#68151B]"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg lg:bottom-5"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>Mode Offline — Menampilkan data tersimpan</span>
    </div>
  );
};
