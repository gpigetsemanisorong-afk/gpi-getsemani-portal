import { useCallback, useEffect, useMemo, useState } from 'react';

export const BIBLE_BOOKMARKS_STORAGE_KEY = 'gpi_getsemani_bible_bookmarks_v1';

export interface BibleBookmark {
  id: string; // `${bookId}:${chapter}:${verse}`
  bookId: number;
  bookName: string;
  testament: 'PL' | 'PB';
  chapter: number;
  verse: number;
  text: string;
  note?: string;
  savedAt: string;
}

export type NewBibleBookmarkInput = Omit<BibleBookmark, 'id' | 'savedAt'>;

export function makeBookmarkId(bookId: number, chapter: number, verse: number): string {
  return `${bookId}:${chapter}:${verse}`;
}

function readBookmarksFromStorage(): BibleBookmark[] {
  try {
    const raw = localStorage.getItem(BIBLE_BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is BibleBookmark =>
        Boolean(item) &&
        typeof item.id === 'string' &&
        typeof item.bookId === 'number' &&
        typeof item.chapter === 'number' &&
        typeof item.verse === 'number' &&
        typeof item.text === 'string'
    );
  } catch {
    return [];
  }
}

function writeBookmarksToStorage(list: BibleBookmark[]): void {
  try {
    localStorage.setItem(BIBLE_BOOKMARKS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore storage quota errors safely
  }
}

export function useBibleBookmarks() {
  const [bookmarks, setBookmarks] = useState<BibleBookmark[]>(() => readBookmarksFromStorage());

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === BIBLE_BOOKMARKS_STORAGE_KEY) {
        setBookmarks(readBookmarksFromStorage());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const bookmarkedIds = useMemo(
    () => new Set(bookmarks.map((b) => b.id)),
    [bookmarks]
  );

  const isBookmarked = useCallback(
    (bookId: number, chapter: number, verse: number): boolean =>
      bookmarkedIds.has(makeBookmarkId(bookId, chapter, verse)),
    [bookmarkedIds]
  );

  const toggleBookmark = useCallback((input: NewBibleBookmarkInput): boolean => {
    const id = makeBookmarkId(input.bookId, input.chapter, input.verse);
    let added = false;

    setBookmarks((prev) => {
      const exists = prev.some((b) => b.id === id);
      const next = exists
        ? prev.filter((b) => b.id !== id)
        : [
            {
              ...input,
              id,
              savedAt: new Date().toISOString(),
            },
            ...prev,
          ];
      added = !exists;
      writeBookmarksToStorage(next);
      return next;
    });

    return added;
  }, []);

  const updateBookmarkNote = useCallback((id: string, note: string) => {
    setBookmarks((prev) => {
      const next = prev.map((b) =>
        b.id === id ? { ...b, note: note.trim() || undefined } : b
      );
      writeBookmarksToStorage(next);
      return next;
    });
  }, []);

  const removeBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.filter((b) => b.id !== id);
      writeBookmarksToStorage(next);
      return next;
    });
  }, []);

  const clearAllBookmarks = useCallback(() => {
    writeBookmarksToStorage([]);
    setBookmarks([]);
  }, []);

  return {
    bookmarks,
    bookmarkedIds,
    isBookmarked,
    toggleBookmark,
    updateBookmarkNote,
    removeBookmark,
    clearAllBookmarks,
  };
}
