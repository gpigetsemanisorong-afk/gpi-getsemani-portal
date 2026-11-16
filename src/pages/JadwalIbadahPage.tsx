import React, { useMemo, useState } from 'react';
import { CalendarDays, Clock, ExternalLink, MapPin, User } from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { SektorName, UnitName, UnsurName } from '../types/church';

type CategoryFilter = 'Semua' | 'Ibadah Minggu' | 'Unsur' | 'Sektor/Unit';

const UNSUR_LIST: UnsurName[] = ['PAR', 'PP', 'PERWATA', 'PERPRI', 'LANSIA'];

const SEKTOR_UNITS: Record<SektorName, UnitName[]> = {
  'Sektor Filadelfia': ['Unit Rehoboth', 'Unit Silo'],
  'Sektor Petra': ['Unit Pniel', 'Unit Siloam'],
};

export const JadwalIbadahPage: React.FC = () => {
  const { data } = usePortal();
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('Semua');
  const [unsurFilter, setUnsurFilter] = useState<'Semua' | UnsurName>('Semua');
  const [sektorFilter, setSektorFilter] = useState<'Semua' | SektorName>('Semua');
  const [unitFilter, setUnitFilter] = useState<'Semua' | UnitName>('Semua');

  const filtered = useMemo(() => {
    return data.schedules.filter((s) => {
      if (categoryFilter !== 'Semua' && s.category !== categoryFilter) return false;
      if (categoryFilter === 'Unsur' && unsurFilter !== 'Semua' && s.unsur !== unsurFilter) {
        return false;
      }
      if (categoryFilter === 'Sektor/Unit') {
        if (sektorFilter !== 'Semua' && s.sektor !== sektorFilter) return false;
        if (unitFilter !== 'Semua' && s.unit !== unitFilter) return false;
      }
      return true;
    });
  }, [data.schedules, categoryFilter, unsurFilter, sektorFilter, unitFilter]);

  const handleSelectSektor = (sektor: 'Semua' | SektorName) => {
    setSektorFilter(sektor);
    setUnitFilter('Semua');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
          Jadwal Ibadah Jemaat
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Ibadah Minggu, Kategorial Unsur (PAR, PP, PERWATA, PERPRI, LANSIA), serta Ibadah Sektor Filadelfia & Sektor Petra.
        </p>
      </div>

      {/* Split-screen on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
        {/* Left Filter Panel */}
        <aside className="space-y-5 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 lg:sticky lg:top-20">
          <div>
            <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
              Kategori Ibadah
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {(['Semua', 'Ibadah Minggu', 'Unsur', 'Sektor/Unit'] as CategoryFilter[]).map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`min-h-[40px] rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                      categoryFilter === cat
                        ? 'bg-[#7F1D1D] text-white dark:bg-amber-500 dark:text-stone-950'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {categoryFilter === 'Unsur' && (
            <div className="border-t border-stone-100 pt-4 dark:border-stone-800">
              <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                Filter Unsur Pelayanan
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setUnsurFilter('Semua')}
                  className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold cursor-pointer ${
                    unsurFilter === 'Semua'
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                  }`}
                >
                  Semua Unsur
                </button>
                {UNSUR_LIST.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnsurFilter(u)}
                    className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold cursor-pointer ${
                      unsurFilter === u
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>
          )}

          {categoryFilter === 'Sektor/Unit' && (
            <div className="space-y-4 border-t border-stone-100 pt-4 dark:border-stone-800">
              <div>
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                  Pilih Sektor
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  {(['Semua', 'Sektor Filadelfia', 'Sektor Petra'] as const).map((sek) => (
                    <button
                      key={sek}
                      type="button"
                      onClick={() => handleSelectSektor(sek)}
                      className={`min-h-[40px] rounded-xl px-3 text-left text-xs font-semibold transition-colors cursor-pointer ${
                        sektorFilter === sek
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      {sek === 'Semua' ? 'Semua Sektor' : sek}
                    </button>
                  ))}
                </div>
              </div>

              {sektorFilter !== 'Semua' && (
                <div>
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    Unit di {sektorFilter}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setUnitFilter('Semua')}
                      className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold cursor-pointer ${
                        unitFilter === 'Semua'
                          ? 'bg-[#7F1D1D] text-white'
                          : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                      }`}
                    >
                      Semua Unit
                    </button>
                    {SEKTOR_UNITS[sektorFilter].map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnitFilter(u)}
                        className={`min-h-[36px] rounded-lg px-3 text-xs font-semibold cursor-pointer ${
                          unitFilter === u
                            ? 'bg-[#7F1D1D] text-white'
                            : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="border-t border-stone-100 pt-4 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
            Menampilkan <strong className="font-tabular text-stone-900 dark:text-stone-100">{filtered.length}</strong> jadwal ibadah.
          </div>
        </aside>

        {/* Right Content: Schedule List */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center dark:border-stone-800 dark:bg-stone-900">
              <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                Belum ada jadwal untuk filter yang dipilih.
              </p>
            </div>
          ) : (
            filtered.map((sch) => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                sch.mapsQuery || sch.location
              )}`;
              return (
                <article
                  key={sch.id}
                  className="rounded-2xl border border-stone-200 bg-white p-5 transition-colors hover:border-amber-500/50 dark:border-stone-800 dark:bg-stone-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
                        {sch.category}
                        {sch.unsur ? ` · ${sch.unsur}` : ''}
                        {sch.sektor ? ` · ${sch.sektor}` : ''}
                        {sch.unit ? ` · ${sch.unit}` : ''}
                      </p>
                      <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                        {sch.title}
                      </h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 text-sm text-stone-600 dark:text-stone-300">
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="h-4 w-4 text-amber-600" />
                          {sch.date}
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-tabular">
                          <Clock className="h-4 w-4 text-amber-600" />
                          {sch.time}
                        </span>
                      </div>
                      <p className="inline-flex items-start gap-1.5 text-sm text-stone-600 dark:text-stone-300">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#7F1D1D] dark:text-amber-400" />
                        <span>{sch.location}</span>
                      </p>
                      <p className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                        <User className="h-3.5 w-3.5" />
                        <span>
                          Pelayan: <strong className="text-stone-800 dark:text-stone-200">{sch.leader}</strong>
                          {sch.liturgos ? ` · Liturgos: ${sch.liturgos}` : ''}
                        </span>
                      </p>
                      {sch.notes && (
                        <p className="pt-1 text-xs text-stone-500 dark:text-stone-400">
                          Catatan: {sch.notes}
                        </p>
                      )}
                    </div>

                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[42px] items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-800 transition-colors hover:border-amber-500 hover:bg-amber-50 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 whitespace-nowrap shrink-0"
                    >
                      <MapPin className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
                      <span>Petunjuk Arah Google Maps</span>
                      <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                    </a>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
