import React from 'react';
import { BookOpen, Music, Printer, UserCheck } from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { ReadingToolbar } from '../components/Navbar';

export const TataIbadahPage: React.FC = () => {
  const { data, readingTextClass } = usePortal();
  const { liturgy, hymns } = data;

  const findHymn = (book: string, num: number) =>
    hymns.find((h) => h.book === book && h.number === num);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ReadingToolbar
        title="Tata Ibadah Minggu"
        subtitle={`${liturgy.sundayName} · ${liturgy.date}`}
      />

      {/* Header Liturgi */}
      <article className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-6 dark:border-stone-800">
          <div>
            <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
              {liturgy.sundayName} · {liturgy.date}
            </p>
            <h1 className="mt-1.5 text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
              {liturgy.title}
            </h1>
            <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">
              Tema: <strong>{liturgy.theme}</strong>
            </p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-stone-500 dark:text-stone-400">
              <span className="inline-flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-amber-600" />
                Bacaan: {liturgy.scriptureReading}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-[#7F1D1D] dark:text-amber-400" />
                Pelayan Firman: {liturgy.preacher}
              </span>
              <span>Liturgos: {liturgy.liturgos}</span>
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

        {/* Urutan Liturgi Satu Halaman Gulir dengan Lirik Terintegrasi */}
        <ol className="mt-6 space-y-8">
          {liturgy.steps
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
                    <p className="text-stone-800 dark:text-stone-200">
                      <span className="font-sans text-xs font-bold uppercase tracking-wide text-[#7F1D1D] dark:text-amber-400 mr-2">
                        Pelayan:
                      </span>
                      {step.leaderText}
                    </p>

                    {step.congregationText && (
                      <p className="rounded-xl bg-stone-50 p-3.5 text-stone-900 dark:bg-stone-800/70 dark:text-stone-100">
                        <span className="font-sans text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-300 mr-2">
                          Jemaat:
                        </span>
                        {step.congregationText}
                      </p>
                    )}
                  </div>

                  {/* Integrated Hymn Lyrics */}
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
                        <div className={`mt-3 space-y-3 font-reading text-stone-800 dark:text-stone-200 ${readingTextClass}`}>
                          {linkedHymn.verses.map((v) => (
                            <div key={v.number} className="flex gap-2.5">
                              <span className="font-tabular text-xs font-bold text-amber-700 dark:text-amber-400 pt-1">
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
                              <p className="mt-1 whitespace-pre-line italic">{linkedHymn.chorus}</p>
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
      </article>
    </div>
  );
};
