import React, { useMemo, useState } from 'react';
import { BookOpen, Layers, Music, Printer, Sparkles } from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { UnsurName } from '../types/church';
import { ReadingToolbar } from '../components/Navbar';

const UNSUR_META: { id: UnsurName; label: string; fullName: string }[] = [
  { id: 'PERPRI', label: 'PERPRI', fullName: 'Persekutuan Kaum Pria' },
  { id: 'PERWATA', label: 'PERWATA', fullName: 'Persekutuan Kaum Wanita' },
  { id: 'PP', label: 'PP', fullName: 'Persekutuan Pemuda' },
  { id: 'PAR', label: 'PAR', fullName: 'Pelayanan Anak & Remaja' },
  { id: 'LANSIA', label: 'LANSIA', fullName: 'Persekutuan Lanjut Usia' },
];

export const LiturgiUnsurPage: React.FC = () => {
  const { data, readingTextClass } = usePortal();
  const [selectedUnsur, setSelectedUnsur] = useState<UnsurName>('PERPRI');
  const [selectedModelId, setSelectedModelId] = useState<string>('');

  const modelsByUnsur = useMemo(() => {
    const map = new Map<UnsurName, typeof data.unsurLiturgies>();
    UNSUR_META.forEach((u) => map.set(u.id, []));
    data.unsurLiturgies.forEach((m) => {
      const list = map.get(m.unsur) || [];
      list.push(m);
      map.set(m.unsur, list);
    });
    return map;
  }, [data.unsurLiturgies]);

  const currentModels = useMemo(
    () => modelsByUnsur.get(selectedUnsur) || [],
    [modelsByUnsur, selectedUnsur]
  );

  const activeModel =
    currentModels.find((m) => m.id === selectedModelId) || currentModels[0] || null;

  const activeUnsurInfo = UNSUR_META.find((u) => u.id === selectedUnsur)!;

  const findHymn = (book: string, num: number) =>
    data.hymns.find((h) => h.book === book && h.number === num);

  return (
    <div className="space-y-5">
      <ReadingToolbar
        title="Liturgi Wadah Kategorial"
        subtitle="Pilihan model tata ibadah untuk PAR, PP, PERWATA, PERPRI & LANSIA"
      />

      {/* Wadah Kategorial Filter Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
        <p className="px-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500 dark:text-stone-400">
          Pilih Wadah Kategorial
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
          {UNSUR_META.map((u) => {
            const count = modelsByUnsur.get(u.id)?.length || 0;
            const active = selectedUnsur === u.id;
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setSelectedUnsur(u.id);
                  const first = modelsByUnsur.get(u.id)?.[0];
                  setSelectedModelId(first?.id || '');
                }}
                className={`flex min-h-[58px] flex-col justify-between rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                  active
                    ? 'border-[#7F1D1D] bg-[#7F1D1D] text-white dark:border-amber-500 dark:bg-amber-500 dark:text-stone-950'
                    : 'border-stone-200 bg-stone-50/70 text-stone-800 hover:border-amber-500/60 hover:bg-amber-50/40 dark:border-stone-800 dark:bg-stone-800/60 dark:text-stone-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">{u.label}</span>
                  <span
                    className={`font-tabular text-[11px] font-semibold ${
                      active
                        ? 'text-amber-200 dark:text-stone-900'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {count} Model
                  </span>
                </div>
                <span
                  className={`mt-1 truncate text-[11px] ${
                    active
                      ? 'text-stone-100 dark:text-stone-900/90'
                      : 'text-stone-500 dark:text-stone-400'
                  }`}
                >
                  {u.fullName}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Split-Screen on Desktop: Left = Models (Model A, B, C, D...), Right = Full Liturgy */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[330px_1fr] lg:items-start">
        {/* Left Panel: Model Selector */}
        <aside className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 lg:sticky lg:top-20">
          <div className="border-b border-stone-100 pb-3 dark:border-stone-800">
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
              <Layers className="h-3.5 w-3.5" />
              <span>Pilihan Model Liturgi {activeUnsurInfo.label}</span>
            </p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {activeUnsurInfo.fullName} ({currentModels.length} model tersedia)
            </p>
          </div>

          {currentModels.length === 0 ? (
            <p className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
              Belum ada model liturgi untuk unsur {activeUnsurInfo.label}.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {currentModels.map((model) => {
                const isSelected = activeModel?.id === model.id;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModelId(model.id)}
                    className={`w-full rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#7F1D1D] bg-amber-50/70 dark:border-amber-500 dark:bg-amber-950/25'
                        : 'border-stone-200 bg-stone-50/40 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-800/40 dark:hover:bg-stone-800/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-bold uppercase tracking-wide ${
                          isSelected
                            ? 'text-[#7F1D1D] dark:text-amber-400'
                            : 'text-stone-700 dark:text-stone-300'
                        }`}
                      >
                        {model.modelCode}
                      </span>
                      <span className="font-tabular text-[11px] text-stone-500 dark:text-stone-400">
                        {model.steps.length} bagian
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold leading-snug text-stone-900 dark:text-stone-100">
                      {model.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-stone-500 dark:text-stone-400">
                      {model.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Right Panel: Selected Model Liturgy Content */}
        <article className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8">
          {activeModel ? (
            <div>
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-6 dark:border-stone-800">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7F1D1D] dark:text-amber-400">
                    {activeUnsurInfo.label} · {activeModel.modelCode}
                  </p>
                  <h1 className="mt-1.5 text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
                    {activeModel.title}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-stone-600 dark:text-stone-400">
                    {activeModel.subtitle}
                  </p>
                  <div className="mt-3 space-y-1 text-xs text-stone-600 dark:text-stone-300">
                    <p className="flex items-start gap-1.5">
                      <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                      <span>
                        Tema Pelayanan: <strong>{activeModel.theme}</strong>
                      </span>
                    </p>
                    {activeModel.occasionHint && (
                      <p className="flex items-start gap-1.5 text-stone-500 dark:text-stone-400">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#7F1D1D] dark:text-amber-400" />
                        <span>{activeModel.occasionHint}</span>
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-stone-200 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 print:hidden cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Cetak Liturgi</span>
                </button>
              </div>

              <ol className="mt-6 space-y-8">
                {activeModel.steps
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((step) => {
                    const linkedHymn = step.hymnRef
                      ? findHymn(step.hymnRef.book, step.hymnRef.number)
                      : undefined;

                    return (
                      <li
                        key={step.id}
                        className="border-b border-stone-100 pb-7 last:border-b-0 last:pb-0 dark:border-stone-800"
                      >
                        <div className="flex items-baseline gap-2.5">
                          <span className="font-tabular text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                            {String(step.order).padStart(2, '0')}.
                          </span>
                          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                            {step.section}
                          </h2>
                        </div>

                        {step.instruction && (
                          <p className="mt-1.5 text-xs italic text-stone-500 dark:text-stone-400">
                            Petunjuk: {step.instruction}
                          </p>
                        )}

                        <div className={`mt-3 space-y-3 font-reading ${readingTextClass}`}>
                          {step.leaderText && (
                            <p className="text-stone-800 dark:text-stone-200">
                              <span className="mr-2 font-sans text-xs font-bold uppercase tracking-wide text-[#7F1D1D] dark:text-amber-400">
                                Pemimpin:
                              </span>
                              {step.leaderText}
                            </p>
                          )}

                          {step.congregationText && (
                            <p className="rounded-xl bg-stone-50 p-3.5 text-stone-900 dark:bg-stone-800/70 dark:text-stone-100">
                              <span className="mr-2 font-sans text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                Peserta / Jemaat:
                              </span>
                              {step.congregationText}
                            </p>
                          )}
                        </div>

                        {step.hymnRef && (
                          <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-sm font-bold text-[#7F1D1D] dark:text-amber-300">
                                <Music className="h-4 w-4" />
                                <span>
                                  {step.hymnRef.book} No. {step.hymnRef.number} — {step.hymnRef.title}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-stone-600 dark:text-stone-400">
                                Dinyanyikan: {step.hymnRef.versesToSing}
                              </span>
                            </div>

                            {linkedHymn ? (
                              <div
                                className={`mt-3 space-y-3 font-reading text-stone-800 dark:text-stone-200 ${readingTextClass}`}
                              >
                                {linkedHymn.verses.map((v) => (
                                  <div key={v.number} className="flex gap-2.5">
                                    <span className="font-tabular pt-1 text-xs font-bold text-amber-700 dark:text-amber-400">
                                      {v.number}.
                                    </span>
                                    <p className="whitespace-pre-line">{v.text}</p>
                                  </div>
                                ))}
                                {linkedHymn.chorus && (
                                  <div className="rounded-xl bg-white/80 p-3 dark:bg-stone-900/70">
                                    <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                                      Refrein
                                    </p>
                                    <p className="mt-1 whitespace-pre-line italic">
                                      {linkedHymn.chorus}
                                    </p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                                Lirik nyanyian tersedia di menu Kidung Pujian.
                              </p>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
              </ol>
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-stone-500 dark:text-stone-400">
              Pilih model liturgi di sebelah kiri untuk membaca tata ibadah wadah kategorial.
            </div>
          )}
        </article>
      </div>
    </div>
  );
};
