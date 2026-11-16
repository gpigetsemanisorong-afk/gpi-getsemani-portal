import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BookText,
  CalendarDays,
  Church,
  Clock,
  FileText,
  HandHeart,
  Heart,
  Info,
  Layers,
  MapPin,
  Music,
  Share2,
  Wallet,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { PageRoute } from '../types/church';
import { PWAInstallButton } from '../components/PWAComponents';
import { ShareSheetModal } from '../components/ShareSheetModal';
import { KalenderKegiatanWidget } from '../components/KalenderKegiatanWidget';
import {
  buildBibleVerseSharePayload,
  buildWartaSharePayload,
  SharePayload,
  triggerWebShare,
} from '../utils/shareUtils';

const MENU_ITEMS: {
  id: PageRoute;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
}[] = [
  {
    id: 'tata-ibadah',
    title: 'Tata Ibadah',
    subtitle: 'Liturgi Minggu & lirik',
    icon: Church,
    accentClass: 'bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-400',
  },
  {
    id: 'liturgi-unsur',
    title: 'Liturgi Unsur',
    subtitle: 'PAR, PP, PERWATA, PERPRI & LANSIA',
    icon: Layers,
    accentClass: 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  {
    id: 'jadwal',
    title: 'Jadwal Ibadah',
    subtitle: 'Minggu, Unsur & Sektor/Unit',
    icon: CalendarDays,
    accentClass: 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  {
    id: 'warta',
    title: 'Warta Jemaat',
    subtitle: 'Pengumuman, HUT & PDF',
    icon: FileText,
    accentClass: 'bg-stone-200/80 text-stone-800 dark:bg-stone-800 dark:text-stone-200',
  },
  {
    id: 'nyanyian',
    title: 'Kidung Pujian',
    subtitle: 'KJ, PKJ, NKB, DSL & NR',
    icon: Music,
    accentClass: 'bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-400',
  },
  {
    id: 'alkitab',
    title: 'Alkitab',
    subtitle: 'Perjanjian Lama & Baru',
    icon: BookOpen,
    accentClass: 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  {
    id: 'layanan',
    title: 'Layanan Jemaat',
    subtitle: 'Sakit, baptis & nikah',
    icon: HandHeart,
    accentClass: 'bg-stone-200/80 text-stone-800 dark:bg-stone-800 dark:text-stone-200',
  },
  {
    id: 'kotak-doa',
    title: 'Kotak Doa',
    subtitle: 'Kirim permohonan doa',
    icon: Heart,
    accentClass: 'bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-400',
  },
  {
    id: 'keuangan',
    title: 'Laporan Keuangan',
    subtitle: 'Kas & aksi pembangunan',
    icon: Wallet,
    accentClass: 'bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-400',
  },
  {
    id: 'statistik',
    title: 'Data & Statistik',
    subtitle: 'Sektor, Unit & Google Sheet',
    icon: BarChart3,
    accentClass: 'bg-amber-500/15 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
  },
  {
    id: 'profil',
    title: 'Profil & Kontak',
    subtitle: 'Sejarah, peta & rekening',
    icon: Info,
    accentClass: 'bg-stone-200/80 text-stone-800 dark:bg-stone-800 dark:text-stone-200',
  },
];

export const BerandaPage: React.FC = () => {
  const { data, setRoute } = usePortal();
  const [heroImgError, setHeroImgError] = useState(false);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const upcomingSchedules = data.schedules.slice(0, 4);
  const latestWarta = data.warta[0];

  const handleQuickShare = async (payload: SharePayload, successLabel: string) => {
    const res = await triggerWebShare(payload);
    if (res.status === 'shared') {
      setShareNotice(successLabel);
      window.setTimeout(() => setShareNotice(null), 3000);
    } else if (res.status === 'fallback') {
      setSharePayload(payload);
    }
  };

  return (
    <div className="space-y-8">
      {shareNotice && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          {shareNotice}
        </div>
      )}
      {/* Desktop 2-column layout (65% Left / 35% Right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[65fr_35fr] lg:items-start lg:gap-8">
        {/* LEFT COLUMN (65%): Banner Utama + Grid Menu Utama */}
        <div className="space-y-7">
          {/* Banner Utama */}
          <section className="relative overflow-hidden rounded-3xl border border-stone-200 bg-[#5C1215] text-white shadow-sm dark:border-stone-800">
            {!heroImgError ? (
              <img
                src="/src/assets/images/hero_getsemani_sanctuary_1794648269013.jpg"
                alt="Ruang Ibadah GPI Getsemani Sorong"
                referrerPolicy="no-referrer"
                onError={() => setHeroImgError(true)}
                className="absolute inset-0 h-full w-full object-cover opacity-35"
              />
            ) : null}
            <div className="absolute inset-0 bg-gradient-to-br from-[#5C1215]/95 via-[#7F1D1D]/85 to-[#2D0A0C]/95" />

            <div className="relative z-10 p-6 sm:p-8">
              <p className="text-xs font-semibold tracking-wider text-amber-300 uppercase">
                {data.profile.synod} · {data.profile.klasis}
              </p>

              <h1 className="mt-2.5 max-w-2xl text-2xl font-bold leading-tight text-white text-balance sm:text-3xl lg:text-4xl">
                {data.profile.ministryTheme}
              </h1>

              <blockquote className="mt-5 rounded-2xl border border-white/15 bg-black/25 p-4 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                  <BookText className="h-3.5 w-3.5" />
                  <span>Ayat Minggu Ini · {data.profile.weeklyVerse.ref}</span>
                </div>
                <p className="mt-1.5 font-reading text-sm leading-relaxed text-stone-100 sm:text-base">
                  {data.profile.weeklyVerse.text}
                </p>
              </blockquote>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRoute('tata-ibadah')}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-semibold text-stone-950 transition-colors hover:bg-amber-400 cursor-pointer"
                >
                  <span>Buka Tata Ibadah Minggu Ini</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
                <div className="sm:hidden">
                  <PWAInstallButton />
                </div>
              </div>
            </div>
          </section>

          {/* Grid Menu Utama: Mobile 3 cols | Tablet 4 cols | Desktop 5 cols */}
          <section aria-labelledby="menu-utama-heading">
            <div className="mb-4 flex items-baseline justify-between gap-4">
              <div>
                <h2
                  id="menu-utama-heading"
                  className="text-xl font-bold text-stone-900 dark:text-stone-100"
                >
                  Menu Pelayanan Jemaat
                </h2>
                <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                  Akses cepat ibadah, warta, kidung pujian, Alkitab, dan administrasi jemaat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 md:grid-cols-4 md:gap-3.5 lg:grid-cols-5">
              {MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRoute(item.id)}
                    className="group flex min-h-[116px] flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-3 text-center transition-all hover:border-amber-500/60 hover:bg-amber-50/40 active:scale-[0.98] dark:border-stone-800 dark:bg-stone-900 dark:hover:border-amber-500/50 dark:hover:bg-stone-800/80 cursor-pointer sm:p-4"
                  >
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${item.accentClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="mt-2.5 text-xs font-semibold leading-snug text-stone-900 dark:text-stone-100 sm:text-sm">
                      {item.title}
                    </span>
                    <span className="mt-1 hidden text-[11px] leading-tight text-stone-500 dark:text-stone-400 sm:block">
                      {item.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Kalender Kegiatan Interaktif */}
          <KalenderKegiatanWidget schedules={data.schedules} />

          {/* Latest Warta Preview */}
          {latestWarta && (
            <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
                  {latestWarta.edition} · {latestWarta.date}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      void handleQuickShare(
                        buildWartaSharePayload(latestWarta, data.profile.name),
                        'Warta Jemaat terbaru berhasil dibagikan.'
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 cursor-pointer"
                  >
                    <Share2 className="h-3.5 w-3.5 text-[#7F1D1D] dark:text-amber-400" />
                    <span>Bagikan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRoute('warta')}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#7F1D1D] hover:underline dark:text-amber-400 cursor-pointer"
                  >
                    <span>Lihat Semua Warta</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <h3 className="mt-1.5 text-lg font-bold text-stone-900 dark:text-stone-100">
                {latestWarta.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {latestWarta.summary}
              </p>
            </section>
          )}
        </div>

        {/* RIGHT COLUMN (35%): Jadwal Ibadah Terdekat + Ayat Minggu Ini */}
        <aside className="space-y-6">
          {/* Panel Samping: Jadwal Ibadah Terdekat */}
          <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-3.5 dark:border-stone-800">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Jadwal Ibadah Terdekat
              </h2>
              <button
                type="button"
                onClick={() => setRoute('jadwal')}
                className="text-xs font-semibold text-[#7F1D1D] hover:underline dark:text-amber-400 cursor-pointer"
              >
                Semua Jadwal
              </button>
            </div>

            <div className="mt-4 divide-y divide-stone-100 dark:divide-stone-800">
              {upcomingSchedules.map((sch) => (
                <div key={sch.id} className="py-3.5 first:pt-0 last:pb-0">
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                    {sch.category}
                    {sch.unsur ? ` · ${sch.unsur}` : ''}
                    {sch.unit ? ` · ${sch.unit}` : ''}
                  </p>
                  <p className="mt-0.5 text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {sch.title}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600 dark:text-stone-300">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      {sch.date}, {sch.time}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#7F1D1D] dark:text-amber-400" />
                      {sch.location}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel Samping: Ayat Minggu Ini */}
          <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
                Renungan & Ayat Minggu Ini
              </p>
              <button
                type="button"
                onClick={() =>
                  void handleQuickShare(
                    buildBibleVerseSharePayload(
                      data.profile.weeklyVerse.ref,
                      data.profile.weeklyVerse.text,
                      data.profile.name
                    ),
                    `Ayat ${data.profile.weeklyVerse.ref} berhasil dibagikan.`
                  )
                }
                className="inline-flex items-center gap-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100/70 dark:border-amber-800 dark:bg-stone-900 dark:text-amber-300 cursor-pointer"
              >
                <Share2 className="h-3 w-3" />
                <span>Bagikan Ayat</span>
              </button>
            </div>
            <p className="mt-2 font-reading text-base italic leading-relaxed text-stone-800 dark:text-stone-200">
              {data.profile.weeklyVerse.text}
            </p>
            <p className="mt-3 text-xs font-semibold text-stone-600 dark:text-stone-400">
              — {data.profile.weeklyVerse.ref}
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setRoute('alkitab')}
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl border border-amber-300 bg-white px-3 text-xs font-semibold text-stone-800 hover:bg-amber-50 dark:border-amber-800 dark:bg-stone-900 dark:text-stone-200 cursor-pointer"
              >
                Baca Alkitab
              </button>
              <button
                type="button"
                onClick={() => setRoute('nyanyian')}
                className="inline-flex min-h-[40px] flex-1 items-center justify-center rounded-xl bg-[#7F1D1D] px-3 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
              >
                Kidung Pujian
              </button>
            </div>
          </div>
        </aside>
      </div>

      <ShareSheetModal
        open={Boolean(sharePayload)}
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
        onSharedOrCopied={(msg) => {
          setShareNotice(msg);
          window.setTimeout(() => setShareNotice(null), 3000);
        }}
      />
    </div>
  );
};
