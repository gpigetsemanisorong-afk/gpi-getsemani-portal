import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Database,
  Download,
  Pencil,
  RefreshCw,
  Search,
  Share2,
  Trash2,
  WifiOff,
  X,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { ReadingToolbar } from '../components/Navbar';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { ShareSheetModal } from '../components/ShareSheetModal';
import { useBibleDatabase } from '../hooks/useBibleDatabase';
import { BibleBookmark, useBibleBookmarks } from '../hooks/useBibleBookmarks';
import { buildBibleVerseSharePayload, SharePayload, triggerWebShare } from '../utils/shareUtils';

export const AlkitabPage: React.FC = () => {
  const { data, readingTextClass, logActivity } = usePortal();
  const {
    books,
    currentBookMeta,
    selectedBookId,
    selectedChapter,
    chapterData,
    cachedChapters,
    loadingChapter,
    chapterError,
    isFromOfflineDb,
    isOnline,
    dbStats,
    isDownloadingFull,
    downloadProgress,
    downloadError,
    searchResults,
    isSearchingDb,
    hasPrevChapter,
    hasNextChapter,
    selectBook,
    selectChapter,
    goToPrevChapter,
    goToNextChapter,
    refreshCurrentChapter,
    downloadFullOffline,
    runOfflineSearch,
  } = useBibleDatabase();

  const {
    bookmarks,
    isBookmarked,
    toggleBookmark,
    updateBookmarkNote,
    removeBookmark,
    clearAllBookmarks,
  } = useBibleBookmarks();

  const [sidebarMode, setSidebarMode] = useState<'navigator' | 'bookmarks'>('navigator');
  const [testament, setTestament] = useState<'Semua' | 'PL' | 'PB'>('Semua');
  const [bookQuery, setBookQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'chapter' | 'offline-db'>('chapter');
  const [verseQuery, setVerseQuery] = useState('');

  const [bookmarkQuery, setBookmarkQuery] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [confirmClearBookmarks, setConfirmClearBookmarks] = useState(false);

  const [highlightedVerse, setHighlightedVerse] = useState<number | null>(null);
  const [copiedVerseNum, setCopiedVerseNum] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [sharePayload, setSharePayload] = useState<SharePayload | null>(null);

  const articleRef = useRef<HTMLElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const verseRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 3000);
  };

  // Scroll to highlighted verse once chapter data finishes loading
  useEffect(() => {
    if (highlightedVerse === null || loadingChapter || !chapterData) return;
    const el = verseRefs.current[highlightedVerse];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    const timer = window.setTimeout(() => setHighlightedVerse(null), 4000);
    return () => window.clearTimeout(timer);
  }, [chapterData, highlightedVerse, loadingChapter]);

  const filteredBooks = useMemo(() => {
    const q = bookQuery.trim().toLowerCase();
    return books.filter((b) => {
      const matchesTestament = testament === 'Semua' || b.testament === testament;
      if (!matchesTestament) return false;
      if (!q) return true;
      return b.name.toLowerCase().includes(q) || b.abbr.toLowerCase().includes(q);
    });
  }, [bookQuery, books, testament]);

  const chapterNumbers = useMemo(
    () => Array.from({ length: currentBookMeta.chaptersCount }, (_, idx) => idx + 1),
    [currentBookMeta.chaptersCount]
  );

  const visibleVerses = useMemo(() => {
    const verses = chapterData?.verses || [];
    if (searchMode !== 'chapter') return verses;
    const q = verseQuery.trim().toLowerCase();
    if (!q) return verses;
    return verses.filter(
      (v) => v.text.toLowerCase().includes(q) || String(v.verse) === q
    );
  }, [chapterData, searchMode, verseQuery]);

  const filteredBookmarks = useMemo(() => {
    const q = bookmarkQuery.trim().toLowerCase();
    if (!q) return bookmarks;
    return bookmarks.filter(
      (b) =>
        b.bookName.toLowerCase().includes(q) ||
        `${b.bookName} ${b.chapter}:${b.verse}`.toLowerCase().includes(q) ||
        b.text.toLowerCase().includes(q) ||
        (b.note && b.note.toLowerCase().includes(q))
    );
  }, [bookmarkQuery, bookmarks]);

  const handleDownloadFullBible = async () => {
    const result = await downloadFullOffline();
    if (result) {
      logActivity({
        category: 'Sinkronisasi',
        action: 'Unduh Database Alkitab Offline (66 Kitab)',
        detail: `${result.chaptersSaved} pasal (${result.versesSaved.toLocaleString('id-ID')} ayat) disimpan ke IndexedDB lokal.`,
      });
    }
  };

  const handleDbSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchMode === 'offline-db') {
      void runOfflineSearch(verseQuery, testament);
    }
  };

  const scrollToArticle = () => {
    if (articleRef.current && window.innerWidth < 1024) {
      articleRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleVerseBookmark = (verseNum: number, verseText: string) => {
    const added = toggleBookmark({
      bookId: currentBookMeta.bookId,
      bookName: currentBookMeta.name,
      testament: currentBookMeta.testament,
      chapter: selectedChapter,
      verse: verseNum,
      text: verseText,
    });
    showToast(
      added
        ? `${currentBookMeta.name} ${selectedChapter}:${verseNum} disimpan ke Ayat Favorit.`
        : `${currentBookMeta.name} ${selectedChapter}:${verseNum} dihapus dari Ayat Favorit.`
    );
  };

  const handleCopyVerse = async (verseNum: number, verseText: string) => {
    const formatted = `${currentBookMeta.name} ${selectedChapter}:${verseNum} (TB)\n"${verseText}"`;
    try {
      await navigator.clipboard.writeText(formatted);
      setCopiedVerseNum(verseNum);
      showToast(`Ayat ${currentBookMeta.name} ${selectedChapter}:${verseNum} disalin.`);
      window.setTimeout(() => {
        setCopiedVerseNum((curr) => (curr === verseNum ? null : curr));
      }, 2000);
    } catch {
      showToast('Tidak dapat menyalin teks ke clipboard.');
    }
  };

  const handleShareVerse = async (reference: string, verseText: string) => {
    const payload = buildBibleVerseSharePayload(reference, verseText, data.profile.name);
    const outcome = await triggerWebShare(payload);
    if (outcome.status === 'shared') {
      showToast(`Ayat ${reference} berhasil dibagikan.`);
    } else if (outcome.status === 'fallback') {
      setSharePayload(payload);
    }
  };

  const handleOpenBookmark = (b: BibleBookmark) => {
    setSearchMode('chapter');
    setVerseQuery('');
    setHighlightedVerse(b.verse);
    selectBook(b.bookId, b.chapter);
    scrollToArticle();
  };

  const coveragePercent = Math.min(
    100,
    Math.round((dbStats.fullChaptersCount / dbStats.totalCanonicalChapters) * 100)
  );

  return (
    <div className="space-y-5">
      <ReadingToolbar
        title="Alkitab Terjemahan Baru (TB)"
        subtitle={`${currentBookMeta.name} Pasal ${selectedChapter}`}
      />

      {/* Toast Notification for Bookmark / Copy Actions */}
      {toastMsg && (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-950 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4 shrink-0 fill-current text-amber-600 dark:text-amber-400" />
            <span>{toastMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-amber-800 hover:opacity-70 dark:text-amber-300 cursor-pointer"
            aria-label="Tutup notifikasi"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Offline Database Status & 66-Book Sync Bar */}
      <section className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7F1D1D]/10 text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-400">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  Database Alkitab Offline (66 Kitab · {dbStats.totalCanonicalChapters.toLocaleString('id-ID')} Pasal)
                </p>
                {!isOnline && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                    <WifiOff className="h-3 w-3" />
                    Offline
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-stone-600 dark:text-stone-400">
                {dbStats.isFullOfflineReady ? (
                  <>
                    Lengkap tersimpan di perangkat (
                    <strong className="font-tabular text-emerald-700 dark:text-emerald-400">
                      {dbStats.cachedChaptersCount.toLocaleString('id-ID')} pasal
                    </strong>
                    ) — siap dibaca & dicari tanpa koneksi internet.
                  </>
                ) : (
                  <>
                    Tersimpan lokal:{' '}
                    <strong className="font-tabular">
                      {dbStats.cachedChaptersCount.toLocaleString('id-ID')}
                    </strong>{' '}
                    pasal ({coveragePercent}% lengkap). Pasal yang dibuka otomatis tersimpan ke database offline.
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isDownloadingFull || !isOnline}
            onClick={handleDownloadFullBible}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#68151B] disabled:opacity-50 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400 cursor-pointer"
          >
            <Download className={`h-4 w-4 ${isDownloadingFull ? 'animate-bounce' : ''}`} />
            <span>
              {isDownloadingFull
                ? 'Mengunduh Database...'
                : dbStats.isFullOfflineReady
                ? 'Perbarui Database Offline'
                : 'Unduh 66 Kitab Offline (~7,5 MB)'}
            </span>
          </button>
        </div>

        {downloadProgress && (
          <div className="mt-3 space-y-1.5 border-t border-stone-100 pt-3 dark:border-stone-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-stone-700 dark:text-stone-300">
                {downloadProgress.detail}
              </span>
              <span className="font-tabular font-bold text-[#7F1D1D] dark:text-amber-400">
                {downloadProgress.percent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <div
                className="h-full rounded-full bg-[#7F1D1D] transition-all duration-300 dark:bg-amber-500"
                style={{ width: `${downloadProgress.percent}%` }}
              />
            </div>
          </div>
        )}

        {downloadError && (
          <p className="mt-2 text-xs font-medium text-red-600 dark:text-red-400">
            {downloadError}
          </p>
        )}
      </section>

      {/* Split-screen on desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[350px_1fr] lg:items-start">
        {/* Left Panel: Kitab/Pasal Selector OR Saved Bookmarks */}
        <aside
          ref={sidebarRef}
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 lg:sticky lg:top-20"
        >
          {/* Sidebar Mode Switcher */}
          <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
            <button
              type="button"
              onClick={() => setSidebarMode('navigator')}
              className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors cursor-pointer ${
                sidebarMode === 'navigator'
                  ? 'bg-white text-[#7F1D1D] shadow-xs dark:bg-stone-900 dark:text-amber-400'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Kitab & Pasal</span>
            </button>
            <button
              type="button"
              onClick={() => setSidebarMode('bookmarks')}
              className={`inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition-colors cursor-pointer ${
                sidebarMode === 'bookmarks'
                  ? 'bg-white text-[#7F1D1D] shadow-xs dark:bg-stone-900 dark:text-amber-400'
                  : 'text-stone-600 dark:text-stone-300'
              }`}
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span>Ayat Favorit</span>
              <span className="font-tabular rounded-md bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-[#7F1D1D] dark:text-amber-300">
                {bookmarks.length}
              </span>
            </button>
          </div>

          {sidebarMode === 'navigator' ? (
            <>
              {/* Testament Filter */}
              <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-stone-100 p-1 dark:bg-stone-800">
                {[
                  { id: 'Semua', label: 'Semua (66)' },
                  { id: 'PL', label: 'PL (39)' },
                  { id: 'PB', label: 'PB (27)' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      const t = tab.id as 'Semua' | 'PL' | 'PB';
                      setTestament(t);
                      const first = books.find((b) => t === 'Semua' || b.testament === t);
                      if (first && currentBookMeta.testament !== t && t !== 'Semua') {
                        selectBook(first.bookId, 1);
                      }
                    }}
                    className={`min-h-[36px] rounded-lg px-2 text-xs font-semibold transition-colors cursor-pointer ${
                      testament === tab.id
                        ? 'bg-white text-[#7F1D1D] shadow-xs dark:bg-stone-900 dark:text-amber-400'
                        : 'text-stone-600 dark:text-stone-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Book Selector */}
              <div>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    Pilih Kitab ({filteredBooks.length})
                  </p>
                  <input
                    type="text"
                    value={bookQuery}
                    onChange={(e) => setBookQuery(e.target.value)}
                    placeholder="Filter kitab..."
                    className="w-36 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  />
                </div>
                <div className="mt-2 grid max-h-[230px] grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                  {filteredBooks.map((book) => (
                    <button
                      key={book.bookId}
                      type="button"
                      onClick={() => selectBook(book.bookId, 1)}
                      className={`min-h-[38px] truncate rounded-xl px-2.5 text-left text-xs font-semibold transition-colors cursor-pointer ${
                        selectedBookId === book.bookId
                          ? 'bg-[#7F1D1D] text-white dark:bg-amber-500 dark:text-stone-950'
                          : 'bg-stone-50 text-stone-700 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                      }`}
                      title={`${book.name} (${book.chaptersCount} pasal)`}
                    >
                      {book.name}
                    </button>
                  ))}
                  {filteredBooks.length === 0 && (
                    <p className="col-span-2 py-4 text-center text-xs text-stone-500">
                      Kitab "{bookQuery}" tidak ditemukan.
                    </p>
                  )}
                </div>
              </div>

              {/* Chapter Selector */}
              <div className="border-t border-stone-100 pt-3 dark:border-stone-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    Pilih Pasal ({currentBookMeta.chaptersCount})
                  </p>
                  <span className="font-tabular text-[11px] text-emerald-700 dark:text-emerald-400">
                    {cachedChapters.size} tersimpan offline
                  </span>
                </div>
                <div className="mt-2 grid max-h-[190px] grid-cols-5 gap-1.5 overflow-y-auto pr-1">
                  {chapterNumbers.map((chNum) => {
                    const isActive = selectedChapter === chNum;
                    const isCached = cachedChapters.has(chNum);
                    return (
                      <button
                        key={chNum}
                        type="button"
                        onClick={() => {
                          selectChapter(chNum);
                          scrollToArticle();
                        }}
                        className={`font-tabular relative min-h-[36px] rounded-lg px-2 text-xs font-bold transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-amber-500 text-stone-950'
                            : isCached
                            ? 'border border-emerald-300/70 bg-emerald-50/70 text-stone-800 hover:bg-emerald-100 dark:border-emerald-800/70 dark:bg-emerald-950/30 dark:text-stone-200'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
                        }`}
                      >
                        {chNum}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Search: Current Chapter or Full Offline Database */}
              <div className="space-y-2.5 border-t border-stone-100 pt-3 dark:border-stone-800">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                    Cari Ayat
                  </p>
                  <div className="flex gap-1 rounded-lg bg-stone-100 p-0.5 text-[11px] font-semibold dark:bg-stone-800">
                    <button
                      type="button"
                      onClick={() => setSearchMode('chapter')}
                      className={`rounded-md px-2 py-1 cursor-pointer ${
                        searchMode === 'chapter'
                          ? 'bg-white text-[#7F1D1D] shadow-2xs dark:bg-stone-900 dark:text-amber-400'
                          : 'text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      Pasal Ini
                    </button>
                    <button
                      type="button"
                      onClick={() => setSearchMode('offline-db')}
                      className={`rounded-md px-2 py-1 cursor-pointer ${
                        searchMode === 'offline-db'
                          ? 'bg-white text-[#7F1D1D] shadow-2xs dark:bg-stone-900 dark:text-amber-400'
                          : 'text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      Database Offline
                    </button>
                  </div>
                </div>

                <form onSubmit={handleDbSearchSubmit} className="flex gap-1.5">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                    <input
                      type="text"
                      value={verseQuery}
                      onChange={(e) => setVerseQuery(e.target.value)}
                      placeholder={
                        searchMode === 'chapter'
                          ? 'Kata atau nomor ayat...'
                          : 'Cari kata di seluruh database offline...'
                      }
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                    />
                  </div>
                  {searchMode === 'offline-db' && (
                    <button
                      type="submit"
                      disabled={isSearchingDb || verseQuery.trim().length < 2}
                      className="rounded-xl bg-[#7F1D1D] px-3 text-xs font-semibold text-white hover:bg-[#68151B] disabled:opacity-50 dark:bg-amber-500 dark:text-stone-950 cursor-pointer"
                    >
                      Cari
                    </button>
                  )}
                </form>

                {searchMode === 'offline-db' && searchResults.length > 0 && (
                  <div className="max-h-[220px] divide-y divide-stone-100 overflow-y-auto rounded-xl border border-stone-200 bg-stone-50/60 dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-800/40">
                    {searchResults.map((res) => (
                      <button
                        key={`${res.bookId}-${res.chapter}-${res.verse}`}
                        type="button"
                        onClick={() => {
                          setHighlightedVerse(res.verse);
                          selectBook(res.bookId, res.chapter);
                          setSearchMode('chapter');
                          setVerseQuery('');
                          scrollToArticle();
                        }}
                        className="block w-full p-2.5 text-left hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                      >
                        <p className="font-tabular text-[11px] font-bold text-[#7F1D1D] dark:text-amber-400">
                          {res.bookName} {res.chapter}:{res.verse}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-stone-700 dark:text-stone-300">
                          {res.text}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Bookmarks / Ayat Favorit Sidebar View */
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-stone-600 dark:text-stone-300">
                  Ayat Tersimpan ({bookmarks.length})
                </p>
                {bookmarks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfirmClearBookmarks(true)}
                    className="text-[11px] font-semibold text-red-600 hover:underline dark:text-red-400 cursor-pointer"
                  >
                    Hapus Semua
                  </button>
                )}
              </div>

              {bookmarks.length > 0 && (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    value={bookmarkQuery}
                    onChange={(e) => setBookmarkQuery(e.target.value)}
                    placeholder="Cari kitab, teks, atau catatan..."
                    className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pl-9 pr-3 text-xs text-stone-900 placeholder:text-stone-400 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                  />
                </div>
              )}

              {bookmarks.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 bg-stone-50/70 p-4 text-center dark:border-stone-700 dark:bg-stone-800/40">
                  <Bookmark className="mx-auto h-6 w-6 text-stone-400" />
                  <p className="mt-2 text-xs font-semibold text-stone-700 dark:text-stone-300">
                    Belum ada ayat favorit tersimpan
                  </p>
                  <p className="mt-1 text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    Tekan ikon bookmark di samping ayat saat membaca Alkitab untuk menyimpannya di perangkat ini.
                  </p>
                </div>
              ) : filteredBookmarks.length === 0 ? (
                <p className="py-6 text-center text-xs text-stone-500 dark:text-stone-400">
                  Tidak ada ayat favorit yang cocok dengan "{bookmarkQuery}".
                </p>
              ) : (
                <div className="max-h-[460px] space-y-2.5 overflow-y-auto pr-1">
                  {filteredBookmarks.map((b) => {
                    const isEditingNote = editingNoteId === b.id;
                    return (
                      <div
                        key={b.id}
                        className="rounded-xl border border-stone-200 bg-stone-50/60 p-3 dark:border-stone-800 dark:bg-stone-800/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenBookmark(b)}
                            className="text-left group cursor-pointer"
                          >
                            <p className="font-tabular text-xs font-bold text-[#7F1D1D] group-hover:underline dark:text-amber-400">
                              {b.bookName} {b.chapter}:{b.verse}
                            </p>
                            <p className="font-tabular text-[10px] text-stone-400">
                              Disimpan{' '}
                              {new Date(b.savedAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </p>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                void handleShareVerse(
                                  `${b.bookName} ${b.chapter}:${b.verse}`,
                                  b.text
                                )
                              }
                              title="Bagikan ayat ini ke media sosial"
                              className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-200/70 hover:text-[#7F1D1D] dark:text-stone-400 dark:hover:bg-stone-700 dark:hover:text-amber-400 cursor-pointer"
                            >
                              <Share2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(isEditingNote ? null : b.id);
                                setNoteDraft(b.note || '');
                              }}
                              title="Tambah / Ubah Catatan"
                              className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-200/70 dark:text-stone-400 dark:hover:bg-stone-700 cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                removeBookmark(b.id);
                                showToast(`${b.bookName} ${b.chapter}:${b.verse} dihapus dari Ayat Favorit.`);
                              }}
                              title="Hapus dari Ayat Favorit"
                              className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenBookmark(b)}
                          className="mt-1.5 block w-full text-left cursor-pointer"
                        >
                          <p className="line-clamp-3 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                            "{b.text}"
                          </p>
                        </button>

                        {b.note && !isEditingNote && (
                          <p className="mt-2 rounded-lg bg-amber-50/80 px-2.5 py-1.5 text-[11px] italic text-amber-950 dark:bg-amber-950/30 dark:text-amber-200">
                            Catatan: {b.note}
                          </p>
                        )}

                        {isEditingNote && (
                          <div className="mt-2 space-y-1.5">
                            <input
                              type="text"
                              value={noteDraft}
                              onChange={(e) => setNoteDraft(e.target.value)}
                              placeholder="Tulis catatan perenungan..."
                              className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-900"
                            />
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setEditingNoteId(null)}
                                className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  updateBookmarkNote(b.id, noteDraft);
                                  setEditingNoteId(null);
                                  showToast('Catatan ayat favorit disimpan.');
                                }}
                                className="rounded-lg bg-[#7F1D1D] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#68151B] dark:bg-amber-500 dark:text-stone-950 cursor-pointer"
                              >
                                Simpan
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Right Panel: Scripture Text */}
        <article
          ref={articleRef}
          className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900 sm:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-4 dark:border-stone-800">
            <div>
              <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
                {currentBookMeta.testament === 'PL' ? 'Perjanjian Lama' : 'Perjanjian Baru'} ·{' '}
                {isFromOfflineDb ? 'Database Offline' : 'Tersinkron ke Database'}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
                {currentBookMeta.name} {selectedChapter}
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setSidebarMode('bookmarks');
                  if (sidebarRef.current && window.innerWidth < 1024) {
                    sidebarRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-amber-300/80 bg-amber-50/70 px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200 cursor-pointer"
              >
                <Bookmark className="h-3.5 w-3.5 fill-current text-amber-600 dark:text-amber-400" />
                <span>Favorit ({bookmarks.length})</span>
              </button>

              {isOnline && (
                <button
                  type="button"
                  disabled={loadingChapter}
                  onClick={() => void refreshCurrentChapter()}
                  title="Muat ulang teks pasal dari server"
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-stone-200 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingChapter ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Sinkron Pasal</span>
                </button>
              )}
              <BookOpen className="hidden h-6 w-6 text-amber-600 dark:text-amber-400 sm:block" />
            </div>
          </div>

          {chapterData?.isPartialSeed && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
              Menampilkan cuplikan ayat bawaan (offline). Hubungkan internet atau klik{' '}
              <strong>Unduh 66 Kitab Offline</strong> di atas untuk membaca seluruh ayat pasal ini.
            </div>
          )}

          {chapterError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {chapterError}
            </div>
          )}

          <div
            className={`mt-6 max-w-prose space-y-2.5 font-reading text-stone-800 dark:text-stone-200 ${readingTextClass}`}
          >
            {loadingChapter && !chapterData ? (
              <div className="space-y-3 py-6">
                <div className="h-4 w-5/6 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
                <div className="h-4 w-full animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-stone-100 dark:bg-stone-800" />
                <p className="pt-2 font-sans text-xs text-stone-500">
                  Memuat {currentBookMeta.name} pasal {selectedChapter} dari database...
                </p>
              </div>
            ) : !chapterData ? (
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 font-sans dark:border-stone-800 dark:bg-stone-800/40">
                <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                  Pasal belum tersedia di penyimpanan offline.
                </p>
                <p className="mt-1 text-xs text-stone-600 dark:text-stone-400">
                  Aktifkan koneksi internet lalu tekan Muat Ulang, atau unduh paket 66 kitab untuk akses penuh tanpa internet.
                </p>
              </div>
            ) : visibleVerses.length === 0 ? (
              <p className="font-sans text-sm text-stone-500 dark:text-stone-400">
                Tidak ada ayat yang cocok dengan kata kunci "{verseQuery}".
              </p>
            ) : (
              visibleVerses.map((v) => {
                const saved = isBookmarked(currentBookMeta.bookId, selectedChapter, v.verse);
                const isFocused = highlightedVerse === v.verse;
                const isCopied = copiedVerseNum === v.verse;

                return (
                  <div
                    key={v.verse}
                    ref={(el) => {
                      verseRefs.current[v.verse] = el;
                    }}
                    className={`group flex items-start justify-between gap-3 rounded-xl px-2.5 py-2 transition-colors ${
                      isFocused
                        ? 'bg-amber-100/80 ring-2 ring-[#7F1D1D]/50 dark:bg-amber-950/40 dark:ring-amber-400/60'
                        : saved
                        ? 'bg-amber-50/70 ring-1 ring-amber-300/60 dark:bg-amber-950/20 dark:ring-amber-700/40'
                        : 'hover:bg-stone-50 dark:hover:bg-stone-800/40'
                    }`}
                  >
                    <p className="leading-relaxed">
                      <sup className="font-tabular mr-1.5 text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                        {v.verse}
                      </sup>
                      <span>{v.text}</span>
                    </p>

                    <div className="mt-0.5 flex shrink-0 items-center gap-1 font-sans">
                      <button
                        type="button"
                        onClick={() =>
                          void handleShareVerse(
                            `${currentBookMeta.name} ${selectedChapter}:${v.verse}`,
                            v.text
                          )
                        }
                        title={`Bagikan ${currentBookMeta.name} ${selectedChapter}:${v.verse}`}
                        aria-label={`Bagikan ayat ${v.verse}`}
                        className="rounded-lg p-1.5 text-stone-400 opacity-80 transition-opacity hover:bg-stone-200/70 hover:text-[#7F1D1D] sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 dark:hover:bg-stone-700 dark:hover:text-amber-400 cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleCopyVerse(v.verse, v.text)}
                        title={`Salin ${currentBookMeta.name} ${selectedChapter}:${v.verse}`}
                        aria-label={`Salin ayat ${v.verse}`}
                        className="rounded-lg p-1.5 text-stone-400 opacity-80 transition-opacity hover:bg-stone-200/70 hover:text-stone-700 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 dark:hover:bg-stone-700 dark:hover:text-stone-200 cursor-pointer"
                      >
                        {isCopied ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleVerseBookmark(v.verse, v.text)}
                        title={saved ? 'Hapus dari Ayat Favorit' : 'Simpan ke Ayat Favorit'}
                        aria-label={saved ? `Hapus bookmark ayat ${v.verse}` : `Simpan bookmark ayat ${v.verse}`}
                        className={`rounded-lg p-1.5 transition-all cursor-pointer ${
                          saved
                            ? 'text-amber-600 opacity-100 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40'
                            : 'text-stone-400 opacity-80 hover:bg-stone-200/70 hover:text-[#7F1D1D] sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 dark:hover:bg-stone-700 dark:hover:text-amber-400'
                        }`}
                      >
                        <Bookmark className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Prev / Next Chapter Navigation */}
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5 dark:border-stone-800">
            <button
              type="button"
              disabled={!hasPrevChapter}
              onClick={() => {
                goToPrevChapter();
                scrollToArticle();
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Pasal Sebelumnya</span>
            </button>

            <span className="font-tabular text-xs font-semibold text-stone-500 dark:text-stone-400">
              {currentBookMeta.name} · Pasal {selectedChapter} / {currentBookMeta.chaptersCount}
            </span>

            <button
              type="button"
              disabled={!hasNextChapter}
              onClick={() => {
                goToNextChapter();
                scrollToArticle();
              }}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#68151B] disabled:opacity-40 dark:bg-amber-500 dark:text-stone-950 cursor-pointer"
            >
              <span>Pasal Berikutnya</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </article>
      </div>

      <ConfirmDialog
        open={confirmClearBookmarks}
        title="Hapus Semua Ayat Favorit?"
        description={`Seluruh ${bookmarks.length} ayat favorit dan catatan perenungan yang tersimpan di perangkat ini akan dihapus.`}
        confirmLabel="Ya, Hapus Semua"
        destructive
        onConfirm={() => {
          clearAllBookmarks();
          setConfirmClearBookmarks(false);
          showToast('Semua ayat favorit telah dihapus.');
        }}
        onCancel={() => setConfirmClearBookmarks(false)}
      />

      <ShareSheetModal
        open={Boolean(sharePayload)}
        payload={sharePayload}
        onClose={() => setSharePayload(null)}
        onSharedOrCopied={(msg) => showToast(msg)}
      />
    </div>
  );
};
