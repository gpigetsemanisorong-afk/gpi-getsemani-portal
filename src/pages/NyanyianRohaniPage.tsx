import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FileJson,
  Hash,
  Music,
  RefreshCw,
  Search,
  Upload,
  WifiOff,
  X,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { useGoogleSheetsSync } from '../hooks/useGoogleSheetsSync';
import { useKidungDatabase } from '../hooks/useKidungDatabase';
import { Hymn, HymnBook } from '../types/church';
import { ReadingToolbar } from '../components/Navbar';

const HYMN_BOOKS: ('Semua' | HymnBook)[] = ['Semua', 'KJ', 'PKJ', 'NKB', 'DSL', 'NR'];

const BOOK_FULL_NAMES: Record<HymnBook, string> = {
  KJ: 'Kidung Jemaat',
  PKJ: 'Pelengkap Kidung Jemaat',
  NKB: 'Nyanyian Kidung Baru',
  DSL: 'Dua Sahabat Lama',
  NR: 'Mazmur & Nyanyian Rohani',
};

interface ParsedHymnQuery {
  raw: string;
  normalized: string;
  bookPrefix: HymnBook | null;
  numberQuery: string | null;
  textQuery: string;
}

function parseHymnQuery(input: string): ParsedHymnQuery {
  const trimmed = input.trim();
  const normalized = trimmed.toLowerCase().replace(/\s+/g, ' ');

  if (!normalized) {
    return {
      raw: input,
      normalized: '',
      bookPrefix: null,
      numberQuery: null,
      textQuery: '',
    };
  }

  // Match patterns like "KJ 1", "KJ1", "kj. 64", "NKB no. 188", "nr no 77"
  const bookNumMatch = normalized.match(
    /^(kj|pkj|nkb|dsl|nr)[\s.\-]*(?:no\.?\s*)?(\d+)?(?:\s+(.*))?$/i
  );

  if (bookNumMatch) {
    const book = bookNumMatch[1].toUpperCase() as HymnBook;
    const num = bookNumMatch[2] || null;
    const restText = (bookNumMatch[3] || '').trim();
    return {
      raw: input,
      normalized,
      bookPrefix: book,
      numberQuery: num,
      textQuery: restText,
    };
  }

  // Match patterns like "no 14", "no. 14", "#14", or pure numeric "14"
  const numOnlyMatch = normalized.match(/^(?:no\.?\s*|#)?(\d+)$/i);
  if (numOnlyMatch) {
    return {
      raw: input,
      normalized,
      bookPrefix: null,
      numberQuery: numOnlyMatch[1],
      textQuery: '',
    };
  }

  return {
    raw: input,
    normalized,
    bookPrefix: null,
    numberQuery: null,
    textQuery: normalized,
  };
}

interface HymnSearchResult {
  hymn: Hymn;
  score: number;
  matchedInLyricsOnly: boolean;
}

function scoreHymnMatch(
  hymn: Hymn,
  parsed: ParsedHymnQuery,
  includeLyrics: boolean
): HymnSearchResult | null {
  if (!parsed.normalized) {
    return { hymn, score: 0, matchedInLyricsOnly: false };
  }

  const numStr = String(hymn.number);
  const titleLower = hymn.title.toLowerCase();
  const fullCodeLower = `${hymn.book.toLowerCase()} ${numStr}`;
  const fullCodeNoDotLower = `${hymn.book.toLowerCase()} no. ${numStr}`;

  // Case 1: Query starts with a book code (e.g., "KJ", "KJ 64", "KJ1")
  if (parsed.bookPrefix) {
    if (hymn.book !== parsed.bookPrefix) return null;

    if (parsed.numberQuery) {
      if (numStr === parsed.numberQuery) {
        return { hymn, score: 1000, matchedInLyricsOnly: false };
      }
      if (numStr.startsWith(parsed.numberQuery)) {
        return { hymn, score: 850 - hymn.number * 0.001, matchedInLyricsOnly: false };
      }
      if (numStr.includes(parsed.numberQuery)) {
        return { hymn, score: 700 - hymn.number * 0.001, matchedInLyricsOnly: false };
      }
      return null;
    }

    if (parsed.textQuery) {
      if (titleLower.startsWith(parsed.textQuery)) {
        return { hymn, score: 750, matchedInLyricsOnly: false };
      }
      if (titleLower.includes(parsed.textQuery)) {
        return { hymn, score: 650, matchedInLyricsOnly: false };
      }
      if (includeLyrics) {
        const inLyrics =
          hymn.verses.some((v) => v.text.toLowerCase().includes(parsed.textQuery)) ||
          Boolean(hymn.chorus && hymn.chorus.toLowerCase().includes(parsed.textQuery));
        if (inLyrics) {
          return { hymn, score: 350, matchedInLyricsOnly: true };
        }
      }
      return null;
    }

    return { hymn, score: 900 - hymn.number * 0.001, matchedInLyricsOnly: false };
  }

  // Case 2: Pure numeric or "#14" / "no 14" query
  if (parsed.numberQuery) {
    if (numStr === parsed.numberQuery) {
      return { hymn, score: 950, matchedInLyricsOnly: false };
    }
    if (numStr.startsWith(parsed.numberQuery)) {
      return { hymn, score: 780 - hymn.number * 0.001, matchedInLyricsOnly: false };
    }
    if (numStr.includes(parsed.numberQuery)) {
      return { hymn, score: 620 - hymn.number * 0.001, matchedInLyricsOnly: false };
    }
    if (titleLower.includes(parsed.numberQuery)) {
      return { hymn, score: 450, matchedInLyricsOnly: false };
    }
    return null;
  }

  // Case 3: General text query (title, code, number, or lyrics)
  const q = parsed.textQuery || parsed.normalized;

  if (titleLower === q) {
    return { hymn, score: 920, matchedInLyricsOnly: false };
  }
  if (titleLower.startsWith(q)) {
    return { hymn, score: 820, matchedInLyricsOnly: false };
  }

  const words = q.split(' ').filter(Boolean);
  const allWordsInTitle = words.every((w) => titleLower.includes(w));
  if (titleLower.includes(q)) {
    return { hymn, score: 740, matchedInLyricsOnly: false };
  }
  if (words.length > 1 && allWordsInTitle) {
    return { hymn, score: 680, matchedInLyricsOnly: false };
  }

  if (fullCodeLower.includes(q) || fullCodeNoDotLower.includes(q) || numStr.includes(q)) {
    return { hymn, score: 560, matchedInLyricsOnly: false };
  }

  if (includeLyrics) {
    const inVerses = hymn.verses.some((v) => v.text.toLowerCase().includes(q));
    const inChorus = Boolean(hymn.chorus && hymn.chorus.toLowerCase().includes(q));
    if (inVerses || inChorus) {
      return { hymn, score: 300, matchedInLyricsOnly: true };
    }
  }

  return null;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const HighlightMatch: React.FC<{ text: string; highlight: string }> = ({ text, highlight }) => {
  const q = highlight.trim();
  if (!q) return <>{text}</>;

  const tokens = Array.from(new Set(q.split(/\s+/).filter((t) => t.length >= 1)));
  if (tokens.length === 0) return <>{text}</>;

  const pattern = new RegExp(`(${tokens.map(escapeRegExp).join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <>
      {parts.map((part, index) => {
        const isMatch = tokens.some((token) => part.toLowerCase() === token.toLowerCase());
        return isMatch ? (
          <mark
            key={index}
            className="rounded bg-amber-200/80 px-0.5 text-stone-950 dark:bg-amber-500/35 dark:text-amber-100"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        );
      })}
    </>
  );
};

export const NyanyianRohaniPage: React.FC = () => {
  const { readingTextClass, logActivity } = usePortal();
  const { isOnline, fetchAndCacheMasterHymns, isFetchingHymns } = useGoogleSheetsSync();
  const {
    hymns,
    loading: loadingDb,
    stats,
    isDownloading,
    error: dbError,
    refreshHymns,
    downloadFullPack,
    importFromJson,
    exportToJson,
  } = useKidungDatabase();

  const [selectedBook, setSelectedBook] = useState<'Semua' | HymnBook>('Semua');
  const [query, setQuery] = useState('');
  const [includeLyrics, setIncludeLyrics] = useState(true);
  const [selectedHymnId, setSelectedHymnId] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);
  const lyricsSectionRef = useRef<HTMLElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  useEffect(() => {
    if (hymns.length > 0 && !selectedHymnId) {
      setSelectedHymnId(hymns[0].id);
    }
  }, [hymns, selectedHymnId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const parsedQuery = useMemo(() => parseHymnQuery(query), [query]);

  const allQueryMatches = useMemo(() => {
    const matched: HymnSearchResult[] = [];
    for (const hymn of hymns) {
      const result = scoreHymnMatch(hymn, parsedQuery, includeLyrics);
      if (result) {
        matched.push(result);
      }
    }

    if (parsedQuery.normalized) {
      matched.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.hymn.book !== b.hymn.book) return a.hymn.book.localeCompare(b.hymn.book);
        return a.hymn.number - b.hymn.number;
      });
    }

    return matched;
  }, [hymns, parsedQuery, includeLyrics]);

  const bookMatchCounts = useMemo(() => {
    const counts: Record<'Semua' | HymnBook, number> = {
      Semua: allQueryMatches.length,
      KJ: 0,
      PKJ: 0,
      NKB: 0,
      DSL: 0,
      NR: 0,
    };
    for (const item of allQueryMatches) {
      if (counts[item.hymn.book] !== undefined) {
        counts[item.hymn.book] += 1;
      }
    }
    return counts;
  }, [allQueryMatches]);

  const filteredResults = useMemo(() => {
    if (selectedBook === 'Semua') return allQueryMatches;
    return allQueryMatches.filter((item) => item.hymn.book === selectedBook);
  }, [allQueryMatches, selectedBook]);

  const filteredHymns = useMemo(
    () => filteredResults.map((item) => item.hymn),
    [filteredResults]
  );

  const activeIndex = filteredHymns.findIndex((h) => h.id === selectedHymnId);
  const activeHymn =
    (activeIndex >= 0 ? filteredHymns[activeIndex] : filteredHymns[0]) || null;
  const effectiveIndex = activeHymn
    ? filteredHymns.findIndex((h) => h.id === activeHymn.id)
    : -1;

  const prevHymn = effectiveIndex > 0 ? filteredHymns[effectiveIndex - 1] : null;
  const nextHymn =
    effectiveIndex >= 0 && effectiveIndex < filteredHymns.length - 1
      ? filteredHymns[effectiveIndex + 1]
      : null;

  const highlightTextTerm = parsedQuery.bookPrefix
    ? parsedQuery.textQuery || parsedQuery.numberQuery || ''
    : parsedQuery.numberQuery || parsedQuery.textQuery || '';

  const handleSelectHymn = (id: string) => {
    setSelectedHymnId(id);
    if (window.innerWidth < 1024 && lyricsSectionRef.current) {
      lyricsSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedBook('Semua');
  };

  const handleDownloadPack = async () => {
    const count = await downloadFullPack();
    if (count > 0) {
      showToast(`Berhasil mengunduh ${count} Kidung Pujian untuk akses offline!`);
      logActivity({
        category: 'Sinkronisasi',
        action: 'Unduh Paket Offline Kidung Pujian',
        detail: `${count} lagu (KJ, NKB, PKJ, DSL, NR) disimpan ke IndexedDB lokal.`,
      });
    }
  };

  const handleExportJsonFile = async () => {
    const jsonStr = await exportToJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `koleksi-kidung-pujian-gpi-getsemani-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Koleksi Kidung berhasil diekspor sebagai JSON.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const count = await importFromJson(content);
        if (count > 0) {
          showToast(`Berhasil mengimpor ${count} lagu dari file JSON.`);
          setShowImportModal(false);
        } else {
          showToast('Gagal mengimpor file. Periksa format JSON.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-stone-900 px-4 py-3 text-xs font-semibold text-white shadow-xl dark:bg-stone-100 dark:text-stone-900 animate-fade-in">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="mb-8 flex flex-col gap-4 rounded-3xl bg-gradient-to-br from-[#7F1D1D] to-[#991B1B] p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium backdrop-blur-md">
              <Music className="h-3.5 w-3.5 text-amber-300" />
              <span>Portal Kidung Jemaat & Nyanyian Rohani</span>
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
              Kidung Pujian Jemaat
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-rose-100 sm:text-sm">
              Koleksi lengkap Kidung Jemaat (KJ), Pelengkap Kidung Jemaat (PKJ), Nyanyian Kidung Baru (NKB), Dua Sahabat Lama (DSL), dan Mazmur & Nyanyian Rohani dengan pencarian instan dan dukungan offline penuh.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleDownloadPack}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-bold text-stone-950 shadow-md hover:bg-amber-300 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className={`h-4 w-4 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Mengunduh...' : 'Unduh Paket Offline'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowImportModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/25 transition-all cursor-pointer"
            >
              <Upload className="h-4 w-4" />
              <span>Impor JSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportJsonFile}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/25 transition-all cursor-pointer"
            >
              <FileJson className="h-4 w-4" />
              <span>Ekspor JSON</span>
            </button>
          </div>
        </div>

        {stats && (
          <div className="mt-2 flex flex-wrap items-center gap-4 border-t border-white/15 pt-4 text-xs text-rose-100">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Database className="h-3.5 w-3.5 text-amber-300" />
              <span>{stats.cachedHymnsCount} Lagu tersimpan di Database Offline</span>
            </span>
            <span>•</span>
            <span>KJ: {stats.booksCount.KJ}</span>
            <span>•</span>
            <span>PKJ: {stats.booksCount.PKJ}</span>
            <span>•</span>
            <span>NKB: {stats.booksCount.NKB}</span>
            <span>•</span>
            <span>DSL: {stats.booksCount.DSL}</span>
            <span>•</span>
            <span>NR: {stats.booksCount.NR}</span>
          </div>
        )}
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-stone-900 sm:p-8">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4 dark:border-stone-800">
              <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                Impor Koleksi Kidung Pujian
              </h2>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl p-1.5 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Unggah File JSON Kidung
                </label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="mt-1.5 block w-full text-xs text-stone-500 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-[#7F1D1D] hover:file:bg-amber-100 dark:file:bg-amber-950/40 dark:file:text-amber-300 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Atau Tempel Teks JSON (Array Lagu)
                </label>
                <textarea
                  rows={6}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder={`[{"id": "kj-100", "book": "KJ", "number": 100, "title": "Rembulan Yang Indah", "verses": [{"number": 1, "text": "..."}]}]`}
                  className="mt-1.5 w-full rounded-2xl border border-stone-200 bg-stone-50 p-3 text-xs font-mono text-stone-900 focus:border-[#7F1D1D] focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-stone-100 pt-4 dark:border-stone-800">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!importJsonText.trim()) return;
                  const count = await importFromJson(importJsonText);
                  if (count > 0) {
                    showToast(`Berhasil mengimpor ${count} lagu dari teks JSON.`);
                    setShowImportModal(false);
                    setImportJsonText('');
                  } else {
                    showToast('Format JSON tidak valid.');
                  }
                }}
                className="rounded-xl bg-[#7F1D1D] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-rose-900 cursor-pointer"
              >
                Proses Impor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: Left List + Right Lyrics */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Sidebar: Search & Hymn List */}
        <aside className="lg:col-span-5 rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-stone-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari (cth: KJ 64, 14, Bintang, atau lirik)..."
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-10 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#7F1D1D] focus:bg-white focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-3.5 rounded-full p-0.5 text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Quick Helper Tips */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1">
                <Hash className="h-3 w-3 text-[#7F1D1D] dark:text-amber-400" />
                <span>Tekan <kbd className="rounded bg-stone-100 px-1 py-0.5 font-mono text-[10px] dark:bg-stone-800">/</kbd> untuk mencari</span>
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLyrics}
                  onChange={(e) => setIncludeLyrics(e.target.checked)}
                  className="rounded border-stone-300 text-[#7F1D1D] focus:ring-[#7F1D1D]"
                />
                <span>Cari dalam Lirik</span>
              </label>
            </div>
          </div>

          {/* Book Filter Tabs */}
          <div className="mt-5 flex flex-wrap gap-1.5 border-b border-stone-100 pb-4 dark:border-stone-800">
            {HYMN_BOOKS.map((book) => {
              const count = bookMatchCounts[book];
              const isSelected = selectedBook === book;
              return (
                <button
                  key={book}
                  type="button"
                  onClick={() => setSelectedBook(book)}
                  className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7F1D1D] text-white shadow-sm dark:bg-amber-500 dark:text-stone-950'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                  }`}
                >
                  <span>{book}</span>
                  <span
                    className={`text-[10px] ${
                      isSelected
                        ? 'text-rose-200 dark:text-stone-900'
                        : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 max-h-[420px] divide-y divide-stone-100 overflow-y-auto pr-1 dark:divide-stone-800 lg:max-h-[520px]">
            {filteredResults.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Lagu tidak ditemukan
                  {query.trim() ? ` untuk "${query.trim()}"` : ''}
                  {selectedBook !== 'Semua' ? ` di buku ${selectedBook}` : ''}.
                </p>
                {(query.trim() || selectedBook !== 'Semua') && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-stone-100 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Tampilkan Semua Lagu</span>
                  </button>
                )}
              </div>
            ) : (
              filteredResults.map(({ hymn, matchedInLyricsOnly }) => {
                const isSelected = activeHymn?.id === hymn.id;
                return (
                  <button
                    key={hymn.id}
                    type="button"
                    onClick={() => handleSelectHymn(hymn.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-3 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-amber-50 text-[#7F1D1D] dark:bg-amber-950/30 dark:text-amber-300'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-tabular text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                          {hymn.book} No.{' '}
                          <HighlightMatch
                            text={String(hymn.number)}
                            highlight={parsedQuery.numberQuery || ''}
                          />
                        </p>
                        {matchedInLyricsOnly && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                            Lirik
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                        <HighlightMatch text={hymn.title} highlight={highlightTextTerm} />
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] text-stone-400">
                      {hymn.verses.length} bait
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Panel: Hymn Lyrics */}
        <section
          ref={lyricsSectionRef}
          className="lg:col-span-7 rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8"
        >
          {activeHymn ? (
            <div>
              <div className="border-b border-stone-100 pb-5 dark:border-stone-800">
                <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
                  {BOOK_FULL_NAMES[activeHymn.book]} ({activeHymn.book}) · Nomor{' '}
                  <span className="font-tabular">{activeHymn.number}</span>
                  {activeHymn.keySignature ? ` · ${activeHymn.keySignature}` : ''}
                </p>
                <h1 className="mt-1.5 text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
                  <HighlightMatch text={activeHymn.title} highlight={highlightTextTerm} />
                </h1>
              </div>

              <div
                className={`mt-6 space-y-6 font-reading text-stone-800 dark:text-stone-200 ${readingTextClass}`}
              >
                {activeHymn.verses.map((verse) => (
                  <div key={verse.number} className="flex gap-3.5">
                    <span className="font-tabular pt-1 text-sm font-bold text-[#7F1D1D] dark:text-amber-400">
                      {verse.number}.
                    </span>
                    <p className="whitespace-pre-line">
                      {includeLyrics && highlightTextTerm ? (
                        <HighlightMatch text={verse.text} highlight={highlightTextTerm} />
                      ) : (
                        verse.text
                      )}
                    </p>
                  </div>
                ))}

                {activeHymn.chorus && (
                  <div className="rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
                    <p className="font-sans text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                      Refrein
                    </p>
                    <p className="mt-1.5 whitespace-pre-line italic text-stone-900 dark:text-stone-100">
                      {includeLyrics && highlightTextTerm ? (
                        <HighlightMatch text={activeHymn.chorus} highlight={highlightTextTerm} />
                      ) : (
                        activeHymn.chorus
                      )}
                    </p>
                  </div>
                )}
              </div>

              {(prevHymn || nextHymn) && (
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5 dark:border-stone-800">
                  {prevHymn ? (
                    <button
                      type="button"
                      onClick={() => handleSelectHymn(prevHymn.id)}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>
                        {prevHymn.book} No. {prevHymn.number} · {prevHymn.title}
                      </span>
                    </button>
                  ) : (
                    <span />
                  )}

                  {nextHymn && (
                    <button
                      type="button"
                      onClick={() => handleSelectHymn(nextHymn.id)}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
                    >
                      <span>
                        {nextHymn.book} No. {nextHymn.number} · {nextHymn.title}
                      </span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Music className="mx-auto h-10 w-10 text-stone-300 dark:text-stone-600" />
              <p className="mt-3 text-sm text-stone-500 dark:text-stone-400">
                Pilih lagu di panel kiri untuk membaca lirik nyanyian.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
