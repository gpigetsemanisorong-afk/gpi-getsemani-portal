import React from 'react';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Church,
  Cloud,
  Database,
  FileText,
  Heart,
  Info,
  Music,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { ChurchLogo } from '../components/ChurchLogo';

const APP_FEATURES = [
  {
    title: 'Tata Ibadah & Liturgi Wadah Kategorial',
    description:
      'Panduan liturgi ibadah Minggu serta wadah kategorial (PAR, PP, PERWATA, PERPRI, dan LANSIA) lengkap dengan urutan ibadah dan lirik kidung pujian yang terhubung.',
    icon: Church,
  },
  {
    title: 'Kidung Pujian Lengkap',
    description:
      'Koleksi nyanyian jemaat dari Kidung Jemaat (KJ), Pelengkap Kidung Jemaat (PKJ), Nyanyian Kidung Baru (NKB), Dua Sahabat Lama (DSL), dan Mazmur & Nyanyian Rohani (NR) dengan pencarian cerdas.',
    icon: Music,
  },
  {
    title: 'Alkitab Offline (66 Kitab)',
    description:
      'Terjemahan Baru (TB) Perjanjian Lama dan Perjanjian Baru lengkap dengan sistem penyimpanan lokal IndexedDB, pencarian ayat, bookmark ayat favorit, dan catatan perenungan.',
    icon: BookOpen,
  },
  {
    title: 'Kotak Doa & Layanan Jemaat',
    description:
      'Wadah permohonan doa jemaat (dengan opsi anonim), laporan warga sakit, dan pendaftaran sakramen/nikah yang terhubung ke database cloud Firestore dan WhatsApp Sekretariat.',
    icon: Heart,
  },
  {
    title: 'Warta Jemaat & Jadwal',
    description:
      'Pengumuman mingguan, daftar HUT warga jemaat, berita pastoral (sakit/duka/sukacita), unduhan PDF warta, serta jadwal ibadah sektor dan unit.',
    icon: FileText,
  },
  {
    title: 'Laporan Keuangan & Statistik',
    description:
      'Transparansi laporan kas umum dan aksi pembangunan gereja serta rekapitulasi data demografi jemaat per sektor dan unit.',
    icon: BarChart3,
  },
  {
    title: 'Sinkronisasi Google Workspace',
    description:
      'Integrasi dengan Google Drive dan Google Sheets untuk cadangan database dan sinkronisasi real-time antar perangkat Majelis Jemaat.',
    icon: Cloud,
  },
  {
    title: 'Progressive Web App (PWA)',
    description:
      'Dapat dipasang langsung ke layar utama perangkat (Android, iOS, atau Desktop) untuk akses cepat dan andal secara offline.',
    icon: Smartphone,
  },
];

export const TentangAplikasiPage: React.FC = () => {
  const { data, setRoute } = usePortal();

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header Info */}
      <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8">
        <div className="flex flex-wrap items-center gap-4 border-b border-stone-100 pb-6 dark:border-stone-800">
          <ChurchLogo size="lg" />
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#7F1D1D]/10 px-3 py-1 text-xs font-semibold text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Tentang Aplikasi Portal Jemaat</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
              {data.profile.name}
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              {data.profile.synod} · {data.profile.klasis}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
          <p>
            <strong>Portal Informasi & Pelayanan Jemaat GPI Getsemani Sorong</strong> adalah aplikasi digital berbasis web modern yang dirancang khusus untuk mempermudah warga jemaat dan Majelis dalam mengakses informasi peribadahan, warta, pembinaan iman, serta layanan pastoral di lingkungan Klasis Sorong Raya.
          </p>
          <p>
            Aplikasi ini dikembangkan dengan teknologi PWA (*Progressive Web App*), memungkinkan jemaat untuk mengakses fitur-fitur penting seperti Alkitab, Kidung Pujian, dan Tata Ibadah bahkan saat berada dalam mode offline di perangkat seluler maupun komputer.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setRoute('beranda')}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
          >
            <span>Kembali ke Beranda</span>
          </button>
          <button
            type="button"
            onClick={() => setRoute('profil')}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-xs font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 cursor-pointer"
          >
            <span>Profil & Kontak Gereja</span>
          </button>
        </div>
      </section>

      {/* Daftar Fitur Utama */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Fitur & Keunggulan Portal
          </h2>
          <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
            Berbagai sarana digital yang disediakan untuk mendukung pertumbuhan rohani warga jemaat.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {APP_FEATURES.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {feat.title}
                  </h3>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Informasi Teknis & Keamanan */}
      <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8">
        <div className="flex items-center gap-2.5 border-b border-stone-100 pb-4 dark:border-stone-800">
          <ShieldCheck className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
            Penatalayanan, Data & Keamanan
          </h2>
        </div>
        <div className="mt-4 space-y-3 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
          <p>
            • <strong>Basis Data Cloud & Offline:</strong> Portal ini menggunakan Google Firestore dan IndexedDB untuk menjamin kecepatan akses serta sinkronisasi data peribadahan dan Kotak Doa yang andal.
          </p>
          <p>
            • <strong>Privasi Jemaat:</strong> Seluruh permohonan doa pada Kotak Doa dijaga kerahasiaannya dan hanya dapat diakses oleh Majelis Jemaat yang berwenang.
          </p>
          <p>
            • <strong>Dikelola Oleh:</strong> Majelis Jemaat GPI Getsemani Sorong di bawah naungan Klasis Sorong Raya, Sinode GPI Papua.
          </p>
        </div>
      </section>
    </div>
  );
};
