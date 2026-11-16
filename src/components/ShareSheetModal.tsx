import React, { useState } from 'react';
import { Check, Copy, ExternalLink, MessageCircle, Share2, X } from 'lucide-react';
import { SharePayload } from '../utils/shareUtils';

interface ShareSheetModalProps {
  open: boolean;
  payload: SharePayload | null;
  onClose: () => void;
  onSharedOrCopied?: (message: string) => void;
}

export const ShareSheetModal: React.FC<ShareSheetModalProps> = ({
  open,
  payload,
  onClose,
  onSharedOrCopied,
}) => {
  const [copied, setCopied] = useState(false);

  if (!open || !payload) return null;

  const shareUrl = payload.url || (typeof window !== 'undefined' ? window.location.origin : '');
  const fullShareText = shareUrl ? `${payload.text}\n\n${shareUrl}` : payload.text;

  const waHref = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
  const tgHref = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(
    payload.text
  )}`;
  const fbHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    shareUrl
  )}&quote=${encodeURIComponent(payload.text)}`;
  const xHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    payload.text.slice(0, 230)
  )}&url=${encodeURIComponent(shareUrl)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopied(true);
      onSharedOrCopied?.('Teks & tautan berhasil disalin ke clipboard.');
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      onSharedOrCopied?.('Gagal menyalin teks ke clipboard.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-sheet-title"
    >
      <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-400">
              <Share2 className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="share-sheet-title"
                className="text-base font-bold text-stone-900 dark:text-stone-100"
              >
                Bagikan ke Media Sosial
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Pilih platform atau salin teks untuk dibagikan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup jendela bagikan"
            className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 p-3.5 text-xs leading-relaxed text-stone-700 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-200">
          <p className="font-bold text-[#7F1D1D] dark:text-amber-400">{payload.title}</p>
          <p className="mt-1.5 max-h-36 overflow-y-auto whitespace-pre-line">{payload.text}</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2.5">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSharedOrCopied?.('Membuka WhatsApp untuk membagikan konten.')}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            <MessageCircle className="h-4 w-4" />
            <span>WhatsApp</span>
          </a>

          <a
            href={tgHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSharedOrCopied?.('Membuka Telegram untuk membagikan konten.')}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-sky-700"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Telegram</span>
          </a>

          <a
            href={fbHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSharedOrCopied?.('Membuka Facebook untuk membagikan konten.')}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <ExternalLink className="h-4 w-4" />
            <span>Facebook</span>
          </a>

          <a
            href={xHref}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onSharedOrCopied?.('Membuka X untuk membagikan konten.')}
            className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-stone-800 dark:bg-stone-700 dark:hover:bg-stone-600"
          >
            <ExternalLink className="h-4 w-4" />
            <span>X / Twitter</span>
          </a>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="mt-3 flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700 cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Tersalin ke Clipboard</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Salin Teks & Tautan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
