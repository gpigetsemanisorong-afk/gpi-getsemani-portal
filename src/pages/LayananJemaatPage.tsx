import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Heart, HeartHandshake, MessageCircle, Send } from 'lucide-react';
import { usePortal } from '../context/PortalContext';

type ServiceType = 'Pokok Doa' | 'Lapor Sakit' | 'Baptis/Sidi/Nikah';

const UNITS = ['Unit Rehoboth (Filadelfia)', 'Unit Silo (Filadelfia)', 'Unit Pniel (Petra)', 'Unit Siloam (Petra)'];

export const LayananJemaatPage: React.FC = () => {
  const { data, updateData, logActivity, setRoute } = usePortal();
  const [serviceType, setServiceType] = useState<ServiceType>('Pokok Doa');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [unit, setUnit] = useState(UNITS[0]);
  const [detail, setDetail] = useState('');
  const [sacramentKind, setSacramentKind] = useState('Baptis Kudus Anak');
  const [submittedMessage, setSubmittedMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !detail.trim()) return;

    const fullDetail =
      serviceType === 'Baptis/Sidi/Nikah'
        ? `Jenis Pelayanan: ${sacramentKind}. Keterangan: ${detail.trim()}`
        : detail.trim();

    updateData((prev) => ({
      ...prev,
      serviceRequests: [
        {
          id: `req-${Date.now()}`,
          type: serviceType,
          requesterName: name.trim(),
          phone: phone.trim() || '-',
          unit,
          detail: fullDetail,
          createdAt: new Date().toISOString(),
        },
        ...prev.serviceRequests,
      ],
    }));

    logActivity({
      category: 'Layanan',
      action: `Pengajuan ${serviceType}`,
      detail: `${name.trim()} (${unit}) — ${fullDetail}`,
      actorOverride: name.trim(),
      roleOverride: 'jemaat',
    });

    const waText = [
      `Shalom Sekretariat ${data.profile.name},`,
      `Mohon pelayanan *${serviceType}*:`,
      `Nama: ${name.trim()}`,
      `No. HP/WA: ${phone.trim() || '-'}`,
      `Asal Unit: ${unit}`,
      serviceType === 'Baptis/Sidi/Nikah' ? `Sakramen/Peneguhan: ${sacramentKind}` : null,
      `Keterangan: ${detail.trim()}`,
    ]
      .filter(Boolean)
      .join('\n');

    const waUrl = `https://wa.me/${data.profile.whatsappSekretariat}?text=${encodeURIComponent(
      waText
    )}`;

    setSubmittedMessage(waUrl);
    setName('');
    setPhone('');
    setDetail('');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
          Layanan Jemaat & Pastoral
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Kirim Pokok Doa, Lapor Warga Sakit, atau Pendaftaran Baptis, Katekisasi Sidi, dan Pemberkatan Nikah langsung ke WhatsApp Sekretariat.
        </p>
      </div>

      {/* Kotak Doa Quick Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
        <div className="flex items-center gap-2.5 text-xs text-amber-950 dark:text-amber-200">
          <Heart className="h-4 w-4 shrink-0 text-[#7F1D1D] dark:text-amber-400" />
          <span>
            Ingin mengirim permohonan doa secara anonim atau langsung ke <strong>Database Kotak Doa Majelis</strong>?
          </span>
        </div>
        <button
          type="button"
          onClick={() => setRoute('kotak-doa')}
          className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-[#7F1D1D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
        >
          <span>Buka Kotak Doa</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Category Switcher */}
      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-stone-200 bg-white p-1.5 dark:border-stone-800 dark:bg-stone-900 sm:grid-cols-3">
        {(['Pokok Doa', 'Lapor Sakit', 'Baptis/Sidi/Nikah'] as ServiceType[]).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setServiceType(type);
              setSubmittedMessage(null);
            }}
            className={`min-h-[42px] rounded-xl px-4 py-2 text-sm font-semibold transition-colors cursor-pointer ${
              serviceType === type
                ? 'bg-[#7F1D1D] text-white dark:bg-amber-500 dark:text-stone-950'
                : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8"
      >
        <div className="flex items-center gap-2.5 border-b border-stone-100 pb-4 dark:border-stone-800">
          <HeartHandshake className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Formulir {serviceType}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Nama Lengkap Pemohon
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kel. Bpk. Yohanes Kambu"
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Nomor WhatsApp / Telepon
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0812xxxxxxxx"
              className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Asal Sektor / Unit
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

          {serviceType === 'Baptis/Sidi/Nikah' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                Jenis Pelayanan Sakramen / Peneguhan
              </label>
              <select
                value={sacramentKind}
                onChange={(e) => setSacramentKind(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              >
                <option value="Baptis Kudus Anak">Baptis Kudus Anak</option>
                <option value="Baptis Kudus Dewasa">Baptis Kudus Dewasa</option>
                <option value="Katekisasi & Peneguhan Sidi">Katekisasi & Peneguhan Sidi</option>
                <option value="Pemberkatan Nikah Kudus">Pemberkatan Nikah Kudus</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
            {serviceType === 'Pokok Doa'
              ? 'Isi Pokok Doa'
              : serviceType === 'Lapor Sakit'
              ? 'Nama Warga yang Sakit, Lokasi Perawatan / Rumah, dan Keterangan'
              : 'Nama Calon & Rencana Tanggal Pelaksanaan'}
          </label>
          <textarea
            required
            rows={4}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="Tuliskan keterangan secara jelas agar Majelis Jemaat dan Pendeta dapat menindaklanjuti..."
            className="mt-1.5 w-full rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Pengajuan dicatat dan diteruskan langsung ke WhatsApp Sekretariat Jemaat.
          </p>
          <button
            type="submit"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#68151B] cursor-pointer"
          >
            <Send className="h-4 w-4" />
            <span>Siapkan Pesan WhatsApp</span>
          </button>
        </div>

        {submittedMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                  Permohonan berhasil dicatat! Klik tombol di bawah untuk mengirim ke WhatsApp Sekretariat.
                </p>
                <a
                  href={submittedMessage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Kirim ke WhatsApp Sekretariat</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
