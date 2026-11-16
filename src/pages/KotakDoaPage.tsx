import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Heart,
  Lock,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { usePrayerBox } from '../hooks/usePrayerBox';
import { PRAYER_CATEGORIES } from '../services/prayerBoxService';
import { PrayerCategory } from '../types/church';

const UNITS = [
  'Unit Rehoboth (Filadelfia)',
  'Unit Silo (Filadelfia)',
  'Unit Pniel (Petra)',
  'Unit Siloam (Petra)',
  'Simpatisan / Tamu',
];

export const KotakDoaPage: React.FC = () => {
  const { data } = usePortal();
  const { mySentPrayers, submitPrayer } = usePrayerBox(false);

  const [isAnonymous, setIsAnonymous] = useState(false);
  const [requesterName, setRequesterName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState<PrayerCategory>('Kesembuhan');
  const [unit, setUnit] = useState(UNITS[0]);
  const [prayerText, setPrayerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{
    savedToCloud: boolean;
    warning?: string;
    waUrl: string;
    requesterLabel: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSubmittedResult(null);

    if (!isAnonymous && !requesterName.trim()) {
      setErrorMsg('Mohon tuliskan nama Anda atau centang opsi "Kirim sebagai Anonim".');
      return;
    }

    if (prayerText.trim().length < 5) {
      setErrorMsg('Mohon tuliskan isi permohonan doa minimal 5 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitPrayer({
        requesterName: isAnonymous ? 'Anonim' : requesterName.trim(),
        isAnonymous,
        phone: phone.trim(),
        category,
        unit,
        prayerText: prayerText.trim(),
      });

      const waText = [
        `Shalom Majelis & Tim Doa ${data.profile.name},`,
        `Saya telah mengirimkan permohonan ke *Kotak Doa Portal*:`,
        `Pemohon: ${res.prayer.isAnonymous ? 'Anonim' : res.prayer.requesterName}`,
        `Kategori: ${res.prayer.category}`,
        `Unit: ${res.prayer.unit}`,
        `Isi Doa: ${res.prayer.prayerText}`,
      ].join('\n');

      setSubmittedResult({
        savedToCloud: res.savedToCloud,
        warning: res.warning,
        waUrl: `https://wa.me/${data.profile.whatsappSekretariat}?text=${encodeURIComponent(
          waText
        )}`,
        requesterLabel: res.prayer.isAnonymous ? 'Anonim' : res.prayer.requesterName,
      });

      setPrayerText('');
      if (!isAnonymous) {
        setRequesterName('');
      }
      setPhone('');
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Gagal mengirim permohonan doa. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#7F1D1D]/10 px-3 py-1 text-xs font-semibold text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-400">
            <Heart className="h-3.5 w-3.5" />
            <span>Pelayanan Doa Syafaat Jemaat</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
            Kotak Doa Jemaat
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-600 dark:text-stone-400">
            Sampaikan pokok doa, pergumulan, atau ucapan syukur Anda. Setiap permohonan masuk ke database pelayanan dan didoakan oleh Pendeta serta Majelis Jemaat {data.profile.name}.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_0.95fr] lg:items-start">
        {/* Form Kotak Doa */}
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-[#7F1D1D] dark:text-amber-400" />
              <span>
                <strong>Kerahasiaan Terjaga:</strong> Permohonan doa hanya dapat dibuka oleh Majelis Jemaat di Dashboard Pelayanan.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 dark:border-stone-800 dark:bg-stone-800/60">
            <div>
              <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">
                Kirim sebagai Anonim (Tanpa Nama)
              </p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                Aktifkan jika Anda ingin identitas nama tetap dirahasiakan.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="peer sr-only"
              />
              <div className="h-6 w-11 rounded-full bg-stone-300 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-[#7F1D1D] peer-checked:after:translate-x-5 dark:bg-stone-700 dark:peer-checked:bg-amber-500" />
            </label>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Nama Lengkap {isAnonymous ? '(Otomatis Anonim)' : '*'}
              </label>
              <input
                type="text"
                maxLength={100}
                disabled={isAnonymous}
                required={!isAnonymous}
                value={isAnonymous ? 'Anonim' : requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Contoh: Kel. Bpk. Yohanes Kambu"
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#7F1D1D] focus:outline-none disabled:opacity-60 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                No. WhatsApp / Telepon (Opsional)
              </label>
              <input
                type="tel"
                maxLength={30}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812xxxxxxxx (jika ingin dihubungi)"
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Kategori Pokok Doa
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PrayerCategory)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              >
                {PRAYER_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Asal Sektor / Unit Pelayanan
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              >
                {UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Isi Permohonan Doa *
              </label>
              <span className="font-tabular text-[11px] text-stone-400">
                {prayerText.length} / 1500
              </span>
            </div>
            <textarea
              required
              minLength={5}
              maxLength={1500}
              rows={5}
              value={prayerText}
              onChange={(e) => setPrayerText(e.target.value)}
              placeholder="Tuliskan pokok doa, pergumulan keluarga, atau ucapan syukur Anda di sini..."
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Data langsung tersimpan ke Database Kotak Doa Majelis.
            </p>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#68151B] disabled:opacity-50 cursor-pointer"
            >
              <Send className="h-4 w-4" />
              <span>{isSubmitting ? 'Mengirim Doa...' : 'Kirim ke Kotak Doa'}</span>
            </button>
          </div>

          {submittedResult && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                <div className="space-y-2.5">
                  <div>
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                      Permohonan doa atas nama "{submittedResult.requesterLabel}" telah diterima!
                    </p>
                    <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                      {submittedResult.savedToCloud
                        ? 'Tersimpan langsung ke database cloud Majelis Jemaat untuk didoakan.'
                        : submittedResult.warning ||
                          'Tersimpan di perangkat dan siap ditindaklanjuti.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={submittedResult.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      <span>Kirim juga via WhatsApp Sekretariat (Opsional)</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>

        {/* Sidebar: Firman Penguat & Riwayat Doa Pengirim */}
        <aside className="space-y-5">
          <div className="rounded-3xl border border-amber-200/80 bg-amber-50/70 p-6 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span>Janji Firman Tuhan</span>
            </div>
            <blockquote className="mt-3 font-reading text-base italic leading-relaxed text-stone-800 dark:text-stone-200">
              "Janganlah hendaknya kamu kuatir tentang apa pun juga, tetapi nyatakanlah dalam segala hal keinginanmu kepada Allah dalam doa dan permohonan dengan ucapan syukur."
            </blockquote>
            <p className="mt-2.5 text-xs font-semibold text-stone-600 dark:text-stone-400">
              — Filipi 4:6
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between gap-2 border-b border-stone-100 pb-3 dark:border-stone-800">
              <h2 className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                <ShieldCheck className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
                <span>Doa Terkirim dari Perangkat Ini</span>
              </h2>
              <span className="font-tabular text-xs font-semibold text-stone-500 dark:text-stone-400">
                {mySentPrayers.length}
              </span>
            </div>

            {mySentPrayers.length === 0 ? (
              <p className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
                Belum ada permohonan doa yang Anda kirimkan dari perangkat ini.
              </p>
            ) : (
              <div className="mt-3 max-h-[360px] space-y-3 overflow-y-auto pr-1">
                {mySentPrayers.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-stone-100 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-800/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-[#7F1D1D] dark:text-amber-400">
                        {item.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                      {item.prayerText}
                    </p>
                    <p className="mt-1.5 text-[11px] text-stone-500 dark:text-stone-400">
                      Pengirim: {item.isAnonymous ? 'Anonim' : item.requesterName} · {item.unit}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
