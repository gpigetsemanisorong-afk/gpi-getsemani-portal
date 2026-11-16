import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BIBLE_BOOK_CATALOG,
  BibleBookMeta,
  findBibleBookMeta,
  TOTAL_CANONICAL_CHAPTERS,
} from '../data/bibleBooksCatalog';
import {
  BibleDbStats,
  BibleDownloadProgress,
  BibleSearchResult,
  clearBibleOfflineCache,
  downloadFullBibleOffline,
  getBibleDbStats,
  getCachedChapterNumbersForBook,
  importBibleFromRows,
  loadBibleChapter,
  searchBibleVersesOffline,
  StoredBibleChapter,
} from '../services/bibleDatabase';
import {
  fetchSheetValues,
  fetchSpreadsheetMetadata,
  getWorkspaceAccessToken,
} from '../services/googleWorkspace';
import { useOnlineStatus } from './useOnlineStatus';

const LAST_READ_KEY = 'gpi_getsemani_bible_last_read_v1';

interface SavedLastRead {
  bookId: number;
  chapter: number;
}

function loadLastRead(): SavedLastRead {
  try {
    const raw = localStorage.getItem(LAST_READ_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SavedLastRead>;
      if (parsed.bookId && parsed.chapter) {
        const meta = findBibleBookMeta(parsed.bookId);
        if (meta && parsed.chapter >= 1 && parsed.chapter <= meta.chaptersCount) {
          return { bookId: meta.bookId, chapter: parsed.chapter };
        }
      }
    }
  } catch {
    // ignore
  }
  return { bookId: 43, chapter: 15 }; // Default: Yohanes 15
}

export function useBibleDatabase() {
  const isOnline = useOnlineStatus();
  const initialPos = useMemo(() => loadLastRead(), []);

  const [selectedBookId, setSelectedBookId] = useState<number>(initialPos.bookId);
  const [selectedChapter, setSelectedChapter] = useState<number>(initialPos.chapter);

  const [chapterData, setChapterData] = useState<StoredBibleChapter | null>(null);
  const [cachedChapters, setCachedChapters] = useState<Set<number>>(new Set());
  const [loadingChapter, setLoadingChapter] = useState<boolean>(true);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [isFromOfflineDb, setIsFromOfflineDb] = useState<boolean>(false);

  const [dbStats, setDbStats] = useState<BibleDbStats>({
    cachedChaptersCount: 0,
    fullChaptersCount: 0,
    cachedBooksCount: 0,
    totalCanonicalChapters: TOTAL_CANONICAL_CHAPTERS,
    totalCanonicalBooks: 66,
    isFullOfflineReady: false,
    fullDownloadedAt: null,
    lastUpdatedAt: null,
  });

  const [isDownloadingFull, setIsDownloadingFull] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<BibleDownloadProgress | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const [searchResults, setSearchResults] = useState<BibleSearchResult[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState<boolean>(false);

  const currentBookMeta: BibleBookMeta = useMemo(
    () => findBibleBookMeta(selectedBookId) || BIBLE_BOOK_CATALOG[42],
    [selectedBookId]
  );

  // Persist last read book/chapter
  useEffect(() => {
    try {
      localStorage.setItem(
        LAST_READ_KEY,
        JSON.stringify({ bookId: selectedBookId, chapter: selectedChapter })
      );
    } catch {
      // ignore
    }
  }, [selectedBookId, selectedChapter]);

  const refreshDbMetadata = useCallback(async (bookIdToCheck: number) => {
    const [stats, cachedNums] = await Promise.all([
      getBibleDbStats(),
      getCachedChapterNumbersForBook(bookIdToCheck),
    ]);
    setDbStats(stats);
    setCachedChapters(new Set(cachedNums));
  }, []);

  // Load chapter from IndexedDB (offline-first, upgrades partial seed or missing chapters when online)
  const fetchChapter = useCallback(
    async (bookId: number, chapter: number, forceRefresh = false) => {
      setLoadingChapter(true);
      setChapterError(null);
      const res = await loadBibleChapter({
        bookId,
        chapter,
        isOnline,
        forceRefresh,
      });
      setChapterData(res.chapterData);
      setIsFromOfflineDb(res.fromCache);
      if (res.error) setChapterError(res.error);
      setLoadingChapter(false);
      await refreshDbMetadata(bookId);
    },
    [isOnline, refreshDbMetadata]
  );

  useEffect(() => {
    void fetchChapter(selectedBookId, selectedChapter, false);
  }, [fetchChapter, selectedBookId, selectedChapter]);

  const selectBook = useCallback((bookId: number, chapter = 1) => {
    const meta = findBibleBookMeta(bookId);
    if (!meta) return;
    const safeChapter = Math.min(Math.max(1, chapter), meta.chaptersCount);
    setSelectedBookId(meta.bookId);
    setSelectedChapter(safeChapter);
  }, []);

  const selectChapter = useCallback(
    (chapter: number) => {
      const safeChapter = Math.min(Math.max(1, chapter), currentBookMeta.chaptersCount);
      setSelectedChapter(safeChapter);
    },
    [currentBookMeta.chaptersCount]
  );

  const hasPrevChapter = selectedBookId > 1 || selectedChapter > 1;
  const hasNextChapter =
    selectedBookId < BIBLE_BOOK_CATALOG[BIBLE_BOOK_CATALOG.length - 1].bookId ||
    selectedChapter < currentBookMeta.chaptersCount;

  const goToPrevChapter = useCallback(() => {
    if (selectedChapter > 1) {
      setSelectedChapter((c) => c - 1);
      return;
    }
    const idx = BIBLE_BOOK_CATALOG.findIndex((b) => b.bookId === selectedBookId);
    if (idx > 0) {
      const prevBook = BIBLE_BOOK_CATALOG[idx - 1];
      setSelectedBookId(prevBook.bookId);
      setSelectedChapter(prevBook.chaptersCount);
    }
  }, [selectedBookId, selectedChapter]);

  const goToNextChapter = useCallback(() => {
    if (selectedChapter < currentBookMeta.chaptersCount) {
      setSelectedChapter((c) => c + 1);
      return;
    }
    const idx = BIBLE_BOOK_CATALOG.findIndex((b) => b.bookId === selectedBookId);
    if (idx >= 0 && idx < BIBLE_BOOK_CATALOG.length - 1) {
      const nextBook = BIBLE_BOOK_CATALOG[idx + 1];
      setSelectedBookId(nextBook.bookId);
      setSelectedChapter(1);
    }
  }, [currentBookMeta.chaptersCount, selectedBookId, selectedChapter]);

  const downloadFullOffline = useCallback(async () => {
    if (!isOnline) {
      setDownloadError('Perangkat sedang offline. Hubungkan internet untuk mengunduh 66 kitab.');
      return null;
    }
    setIsDownloadingFull(true);
    setDownloadError(null);
    try {
      const result = await downloadFullBibleOffline((p) => setDownloadProgress(p));
      await fetchChapter(selectedBookId, selectedChapter, false);
      return result;
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Gagal mengunduh database Alkitab offline.'
      );
      return null;
    } finally {
      setIsDownloadingFull(false);
    }
  }, [fetchChapter, isOnline, selectedBookId, selectedChapter]);

  const runOfflineSearch = useCallback(
    async (query: string, testament: 'Semua' | 'PL' | 'PB' = 'Semua') => {
      if (query.trim().length < 2) {
        setSearchResults([]);
        return [];
      }
      setIsSearchingDb(true);
      try {
        const res = await searchBibleVersesOffline(query, { testament, limit: 60 });
        setSearchResults(res);
        return res;
      } finally {
        setIsSearchingDb(false);
      }
    },
    []
  );

  const importBibleFromGoogleSheet = useCallback(
    async (sheetUrlOrId: string, preferredTab?: string) => {
      const token = getWorkspaceAccessToken();
      if (!token) {
        throw new Error('Hubungkan akun Google Workspace terlebih dahulu.');
      }
      const meta = await fetchSpreadsheetMetadata(sheetUrlOrId, token);
      const tabTitle =
        (preferredTab && meta.sheets.find((s) => s.title === preferredTab)?.title) ||
        meta.sheets.find((s) => s.title.toLowerCase().includes('alkitab'))?.title ||
        meta.sheets[0]?.title;
      if (!tabTitle) {
        throw new Error('Tab lembar kerja Alkitab tidak ditemukan.');
      }
      const rows = await fetchSheetValues(meta.spreadsheetId, tabTitle, token);
      const imported = await importBibleFromRows(rows, 'sheets');
      await fetchChapter(selectedBookId, selectedChapter, false);
      return {
        ...imported,
        spreadsheetTitle: meta.title,
        tabTitle,
      };
    },
    [fetchChapter, selectedBookId, selectedChapter]
  );

  const resetBibleOfflineDb = useCallback(async () => {
    await clearBibleOfflineCache();
    setDownloadProgress(null);
    await fetchChapter(selectedBookId, selectedChapter, false);
  }, [fetchChapter, selectedBookId, selectedChapter]);

  return {
    books: BIBLE_BOOK_CATALOG,
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
    refreshCurrentChapter: () => fetchChapter(selectedBookId, selectedChapter, true),
    downloadFullOffline,
    runOfflineSearch,
    importBibleFromGoogleSheet,
    resetBibleOfflineDb,
  };
}
