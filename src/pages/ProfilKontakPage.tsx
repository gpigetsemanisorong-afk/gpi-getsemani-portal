import React, { useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Landmark,
  Mail,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { ChurchLogo } from '../components/ChurchLogo';

export const ProfilKontakPage: React.FC = () => {
  const { data, setRoute, currentUserRole } = usePortal();
  const [copiedAcc, setCopiedAcc] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleCopyAccount = async (accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAcc(accountNumber);
      setTimeout(() => setCopiedAcc(null), 2200);
    } catch {
      // Fallback
      setCopiedAcc(accountNumber);
      setTimeout(() => setCopiedAcc(null), 2200);
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    data.profile.mapsQuery
  )}`;

  return (
    <div className="space-y-8">
      {/* Identity Card */}
      <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8">
        <div className="flex flex-wrap items-center gap-4 border-b border-stone-100 pb-6 dark:border-stone-800">
          <ChurchLogo size="lg" />
          <div>
            <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
              {data.profile.synod} · {data.profile.klasis}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
              {data.profile.name}
            </h1>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">{data.profile.address}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Sejarah Singkat</h2>
            <p className="mt-2.5 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {data.profile.history}
            </p>

            <h3 className="mt-5 text-base font-bold text-stone-900 dark:text-stone-100">Visi Jemaat</h3>
            <p className="mt-1.5 text-sm italic leading-relaxed text-stone-700 dark:text-stone-300">
              "{data.profile.vision}"
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">Misi Pelayanan</h2>
            <ul className="mt-2.5 space-y-2.5 text-sm text-stone-600 dark:text-stone-300">
              {data.profile.mission.map((m, idx) => (
                <li key={idx} className="flex gap-2.5">
                  <span className="font-tabular font-bold text-[#7F1D1D] dark:text-amber-400">
                    0{idx + 1}.
                  </span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Rekening Persembahan & Lokasi Google Maps */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900 dark:text-stone-100">
            <Landmark className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
            <span>Rekening Persembahan & Diakonia</span>
          </h2>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
            Salin nomor rekening resmi Majelis Jemaat untuk persembahan syukur, persepuluhan, dan aksi pembangunan.
          </p>

          <div className="mt-4 space-y-3">
            {data.profile.bankAccounts.map((acc) => {
              const isCopied = copiedAcc === acc.accountNumber;
              return (
                <div
                  key={acc.accountNumber}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 dark:border-stone-800 dark:bg-stone-800/60"
                >
                  <div>
                    <p className="text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                      {acc.bank} · {acc.purpose}
                    </p>
                    <p className="font-tabular mt-1 text-lg font-bold text-stone-900 dark:text-stone-100">
                      {acc.accountNumber}
                    </p>
                    <p className="text-xs text-stone-600 dark:text-stone-300">
                      a.n. {acc.accountName}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyAccount(acc.accountNumber)}
                    className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      isCopied
                        ? 'bg-emerald-700 text-white'
                        : 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100'
                    }`}
                  >
                    {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{isCopied ? 'Tersalin' : 'Salin Rekening'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col justify-between rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900 dark:text-stone-100">
              <MapPin className="h-5 w-5 text-amber-600" />
              <span>Lokasi & Kontak Sekretariat</span>
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
              {data.profile.address}
            </p>
            <div className="mt-4 space-y-2 text-sm text-stone-700 dark:text-stone-300">
              <p className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-stone-400" />
                <span>{data.profile.email}</span>
              </p>
              <p className="font-tabular text-xs text-stone-500 dark:text-stone-400">
                WhatsApp Sekretariat: +{data.profile.whatsappSekretariat}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#68151B]"
            >
              <MapPin className="h-4 w-4" />
              <span>Buka Lokasi di Google Maps</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {currentUserRole !== 'jemaat' && currentUserRole !== null && (
              <button
                type="button"
                onClick={() => setRoute('dashboard')}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 cursor-pointer"
              >
                <ShieldCheck className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
                <span>Buka Dashboard Admin</span>
              </button>
            )}
          </div>
        </section>
      </div>

      {/* Galeri Pelayanan */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-stone-900 dark:text-stone-100">Galeri Pelayanan Jemaat</h2>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {data.gallery.map((item) => (
            <figure
              key={item.id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900"
            >
              {!failedImages[item.id] ? (
                <img
                  src={item.imageUrl}
                  alt={item.title}
                  referrerPolicy="no-referrer"
                  onError={() => setFailedImages((prev) => ({ ...prev, [item.id]: true }))}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-stone-100 p-4 text-center dark:bg-stone-800">
                  <ImageIcon className="h-8 w-8 text-stone-400" />
                  <p className="mt-2 text-xs font-medium text-stone-500">{item.title}</p>
                </div>
              )}
              <figcaption className="p-4">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{item.date}</p>
                <h3 className="mt-1 text-sm font-bold text-stone-900 dark:text-stone-100">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                  {item.caption}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
};
