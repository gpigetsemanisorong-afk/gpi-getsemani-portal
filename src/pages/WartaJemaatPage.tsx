import React, { useState } from 'react';
import { Cake, Download, FileText, HeartHandshake, Lock, Megaphone, Share2, X } from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { ReadingToolbar } from '../components/Navbar';
import { ShareSheetModal } from '../components/ShareSheetModal';
import { buildWartaSharePayload, SharePayload, triggerWebShare } from '../utils/shareUtils';
import { WartaItem } from '../types/church';

export const WartaJemaatPage: React.FC = () => {
  const { data, readingTextClass } = usePortal();
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const showNotice = (msg: string) => {
    setShareNotice(msg);
    window.setTimeout(() => {
      setShareNotice((curr) => (curr === msg ? null : curr));
    }, 3200);
  };

  const handleShareWarta = async (warta: WartaItem) => {
    const payload = buildWartaSharePayload(warta, data.profile.name);
    const outcome = await triggerWebShare(payload);
    if (outcome.status === 'shared') {
      showNotice(`Warta "${warta.title}" berhasil dibagikan.`);
    } else if (outcome.status === 'fallback') {
      setSharePayload(payload);
    }
  };

  const handleDownloadPdf = (url: string, title: string) => {
    if (!url) {
      window.print();
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.download = `${title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ReadingToolbar
        title="Warta Jemaat Mingguan"
        subtitle="Pengumuman, Daftar HUT Warga Jemaat, & Berita Pastoral"
      />

      {shareNotice && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <Share2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>{shareNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setShareNotice(null)}
            className="text-emerald-700 hover:opacity-70 dark:text-emerald-300 cursor-pointer"
            aria-label="Tutup notifikasi bagikan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {data.warta.map((item) => (
          <article
            key={item.id}
            className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8"
          >
            {/* Header Warta */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-5 dark:border-stone-800">
              <div>
                <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
                  {item.edition} · {item.date}
                </p>
                <h2 className="mt-1 text-xl font-bold text-stone-900 dark:text-stone-100 sm:text-2xl">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{item.summary}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => void handleShareWarta(item)}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700 whitespace-nowrap cursor-pointer"
                >
                  <Share2 className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
                  <span>Bagikan Warta</span>
                </button>

                {item.allowPdfDownload ? (
                  <button
                    type="button"
                    onClick={() => handleDownloadPdf(item.pdfUrl, item.title)}
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#68151B] whitespace-nowrap cursor-pointer"
                  >
                    <Download className="h-4 w-4" />
                    <span>Unduh Warta PDF</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-stone-200 bg-stone-100 px-4 py-2 text-xs font-medium text-stone-500 cursor-not-allowed dark:border-stone-700 dark:bg-stone-800 dark:text-stone-400 whitespace-nowrap"
                    title="Unduhan PDF belum diizinkan oleh Admin"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    <span>PDF Dibatasi Admin</span>
                  </button>
                )}
              </div>
            </div>

            {/* Pengumuman Mingguan */}
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                  <Megaphone className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
                  <span>Pengumuman Pelayanan</span>
                </h3>
                <ul className={`mt-3 space-y-2.5 text-stone-700 dark:text-stone-300 ${readingTextClass}`}>
                  {item.announcements.map((ann, idx) => (
                    <li key={idx} className="flex gap-2.5">
                      <span className="font-tabular text-xs font-bold text-amber-700 dark:text-amber-400 pt-1.5">
                        {idx + 1}.
                      </span>
                      <span>{ann}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 gap-6 border-t border-stone-100 pt-6 dark:border-stone-800 md:grid-cols-2">
                {/* Daftar HUT Jemaat */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                    <Cake className="h-4 w-4 text-amber-600" />
                    <span>Daftar HUT Jemaat Minggu Ini</span>
                  </h3>
                  {item.birthdays.length === 0 ? (
                    <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                      Tidak ada daftar HUT tercatat untuk edisi ini.
                    </p>
                  ) : (
                    <ul className="mt-3 divide-y divide-stone-100 dark:divide-stone-800">
                      {item.birthdays.map((b, idx) => (
                        <li key={idx} className="py-2.5 first:pt-0 last:pb-0">
                          <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {b.name}
                          </p>
                          <p className="text-xs text-stone-500 dark:text-stone-400">
                            {b.date} · {b.unit}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Berita Duka / Sakit / Sukacita */}
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                    <HeartHandshake className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
                    <span>Berita Pastoral (Sakit / Duka / Sukacita)</span>
                  </h3>
                  {item.pastoralNews.length === 0 ? (
                    <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                      Tidak ada berita pastoral tambahan.
                    </p>
                  ) : (
                    <ul className="mt-3 space-y-3">
                      {item.pastoralNews.map((news, idx) => (
                        <li
                          key={idx}
                          className="rounded-xl border border-stone-100 bg-stone-50 p-3 dark:border-stone-800 dark:bg-stone-800/60"
                        >
                          <p className="text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                            {news.type} · {news.name}
                          </p>
                          <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                            {news.detail}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}

        {data.warta.length === 0 && (
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center dark:border-stone-800 dark:bg-stone-900">
            <FileText className="mx-auto h-8 w-8 text-stone-400" />
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
              Belum ada Warta Jemaat yang diterbitkan.
            </p>
          </div>
        )}
      </div>

      <ShareSheetModal
        open={Boolean(sharePayload)}
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
        onSharedOrCopied={(msg) => showNotice(msg)}
      />
    </div>
  );
};
