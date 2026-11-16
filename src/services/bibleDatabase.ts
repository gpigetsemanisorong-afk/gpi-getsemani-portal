import { BIBLE_BOOKS } from '../data/bibleData';
import {
  BIBLE_BOOK_CATALOG,
  findBibleBookMeta,
  TOTAL_CANONICAL_BOOKS,
  TOTAL_CANONICAL_CHAPTERS,
} from '../data/bibleBooksCatalog';
import { BibleVerse } from '../types/church';

const DB_NAME = 'gpi_getsemani_bible_db';
const DB_VERSION = 1;
const STORE_CHAPTERS = 'chapters';
const STORE_META = 'meta';

const BOLLS_CHAPTER_ENDPOINT = 'https://bolls.life/get-chapter/TB';
const BOLLS_FULL_TB_URL = 'https://bolls.life/static/translations/TB.json';

export type BibleChapterSource = 'seed' | 'api' | 'full-pack' | 'sheets' | 'json';

export interface StoredBibleChapter {
  key: string; // `${bookId}:${chapter}`
  bookId: number;
  bookSlug: string;
  bookName: string;
  chapter: number;
  verses: BibleVerse[];
  source: BibleChapterSource;
  isPartialSeed?: boolean;
  updatedAt: string;
}

export interface BibleDbStats {
  cachedChaptersCount: number;
  fullChaptersCount: number;
  cachedBooksCount: number;
  totalCanonicalChapters: number;
  totalCanonicalBooks: number;
  isFullOfflineReady: boolean;
  fullDownloadedAt: string | null;
  lastUpdatedAt: string | null;
}

export interface BibleSearchResult {
  bookId: number;
  bookName: string;
  testament: 'PL' | 'PB';
  chapter: number;
  verse: number;
  text: string;
}

export interface BibleDownloadProgress {
  stage: 'downloading' | 'indexing' | 'done';
  percent: number;
  detail: string;
}

// Memory fallback if IndexedDB is blocked in restricted private browsing modes
const memoryFallbackChapters = new Map<string, StoredBibleChapter>();
const memoryFallbackMeta = new Map<string, unknown>();

let dbPromise: Promise<IDBDatabase | null> | null = null;
let seedPromise: Promise<void> | null = null;

export function makeChapterKey(bookId: number, chapter: number): string {
  return `${bookId}:${chapter}`;
}

export function cleanVerseText(raw: string): string {
  return raw
    .replace(/<s>.*?<\/s>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function openBibleDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_CHAPTERS)) {
          const store = db.createObjectStore(STORE_CHAPTERS, { keyPath: 'key' });
          store.createIndex('bookId', 'bookId', { unique: false });
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META, { keyPath: 'key' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });

  return dbPromise;
}

async function getMetaValue<T>(key: string): Promise<T | null> {
  const db = await openBibleDb();
  if (!db) {
    return (memoryFallbackMeta.get(key) as T) ?? null;
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_META, 'readonly');
      const req = tx.objectStore(STORE_META).get(key);
      req.onsuccess = () => resolve(req.result ? (req.result.value as T) : null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function setMetaValue(key: string, value: unknown): Promise<void> {
  memoryFallbackMeta.set(key, value);
  const db = await openBibleDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_META, 'readwrite');
      tx.objectStore(STORE_META).put({ key, value });
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function getChapterFromDb(
  bookId: number,
  chapter: number
): Promise<StoredBibleChapter | null> {
  const key = makeChapterKey(bookId, chapter);
  const db = await openBibleDb();
  if (!db) {
    return memoryFallbackChapters.get(key) || null;
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHAPTERS, 'readonly');
      const req = tx.objectStore(STORE_CHAPTERS).get(key);
      req.onsuccess = () => resolve((req.result as StoredBibleChapter) || null);
      req.onerror = () => resolve(memoryFallbackChapters.get(key) || null);
    } catch {
      resolve(memoryFallbackChapters.get(key) || null);
    }
  });
}

export async function saveChapterToDb(entry: StoredBibleChapter): Promise<void> {
  memoryFallbackChapters.set(entry.key, entry);
  const db = await openBibleDb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHAPTERS, 'readwrite');
      tx.objectStore(STORE_CHAPTERS).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

async function saveChaptersBatchToDb(entries: StoredBibleChapter[]): Promise<void> {
  entries.forEach((e) => memoryFallbackChapters.set(e.key, e));
  const db = await openBibleDb();
  if (!db || entries.length === 0) return;

  const CHUNK_SIZE = 120;
  for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
    const chunk = entries.slice(i, i + CHUNK_SIZE);
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction(STORE_CHAPTERS, 'readwrite');
        const store = tx.objectStore(STORE_CHAPTERS);
        chunk.forEach((entry) => store.put(entry));
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
}

export async function initBibleDatabase(): Promise<void> {
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    const seededAt = new Date().toISOString();
    const toSeed: StoredBibleChapter[] = [];

    for (const book of BIBLE_BOOKS) {
      const meta = findBibleBookMeta(book.id) || findBibleBookMeta(book.name);
      if (!meta) continue;
      for (const ch of book.chapters) {
        const existing = await getChapterFromDb(meta.bookId, ch.chapter);
        if (!existing) {
          toSeed.push({
            key: makeChapterKey(meta.bookId, ch.chapter),
            bookId: meta.bookId,
            bookSlug: meta.id,
            bookName: meta.name,
            chapter: ch.chapter,
            verses: ch.verses,
            source: 'seed',
            isPartialSeed: true,
            updatedAt: seededAt,
          });
        }
      }
    }

    if (toSeed.length > 0) {
      await saveChaptersBatchToDb(toSeed);
    }
  })();

  return seedPromise;
}

export async function getCachedChapterNumbersForBook(bookId: number): Promise<number[]> {
  await initBibleDatabase();
  const db = await openBibleDb();
  if (!db) {
    return Array.from(memoryFallbackChapters.values())
      .filter((c) => c.bookId === bookId)
      .map((c) => c.chapter)
      .sort((a, b) => a - b);
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHAPTERS, 'readonly');
      const idx = tx.objectStore(STORE_CHAPTERS).index('bookId');
      const req = idx.getAll(IDBKeyRange.only(bookId));
      req.onsuccess = () => {
        const rows = (req.result as StoredBibleChapter[]) || [];
        resolve(rows.map((r) => r.chapter).sort((a, b) => a - b));
      };
      req.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
}

export async function getBibleDbStats(): Promise<BibleDbStats> {
  await initBibleDatabase();
  const fullInfo = await getMetaValue<{ downloadedAt: string }>('fullOfflineInfo');
  const db = await openBibleDb();

  if (!db) {
    const entries = Array.from(memoryFallbackChapters.values());
    const books = new Set(entries.map((e) => e.bookId));
    const fullCount = entries.filter((e) => !e.isPartialSeed).length;
    const latest = entries.reduce<string | null>(
      (acc, cur) => (!acc || cur.updatedAt > acc ? cur.updatedAt : acc),
      null
    );
    return {
      cachedChaptersCount: entries.length,
      fullChaptersCount: fullCount,
      cachedBooksCount: books.size,
      totalCanonicalChapters: TOTAL_CANONICAL_CHAPTERS,
      totalCanonicalBooks: TOTAL_CANONICAL_BOOKS,
      isFullOfflineReady: fullCount >= TOTAL_CANONICAL_CHAPTERS,
      fullDownloadedAt: fullInfo?.downloadedAt || null,
      lastUpdatedAt: latest,
    };
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHAPTERS, 'readonly');
      const store = tx.objectStore(STORE_CHAPTERS);
      const req = store.openCursor();
      let cachedChaptersCount = 0;
      let fullChaptersCount = 0;
      const books = new Set<number>();
      let lastUpdatedAt: string | null = null;

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          const val = cursor.value as StoredBibleChapter;
          cachedChaptersCount += 1;
          if (!val.isPartialSeed) fullChaptersCount += 1;
          books.add(val.bookId);
          if (!lastUpdatedAt || val.updatedAt > lastUpdatedAt) {
            lastUpdatedAt = val.updatedAt;
          }
          cursor.continue();
        } else {
          resolve({
            cachedChaptersCount,
            fullChaptersCount,
            cachedBooksCount: books.size,
            totalCanonicalChapters: TOTAL_CANONICAL_CHAPTERS,
            totalCanonicalBooks: TOTAL_CANONICAL_BOOKS,
            isFullOfflineReady:
              fullChaptersCount >= TOTAL_CANONICAL_CHAPTERS || Boolean(fullInfo?.downloadedAt),
            fullDownloadedAt: fullInfo?.downloadedAt || null,
            lastUpdatedAt,
          });
        }
      };
      req.onerror = () =>
        resolve({
          cachedChaptersCount: 0,
          fullChaptersCount: 0,
          cachedBooksCount: 0,
          totalCanonicalChapters: TOTAL_CANONICAL_CHAPTERS,
          totalCanonicalBooks: TOTAL_CANONICAL_BOOKS,
          isFullOfflineReady: false,
          fullDownloadedAt: null,
          lastUpdatedAt: null,
        });
    } catch {
      resolve({
        cachedChaptersCount: 0,
        fullChaptersCount: 0,
        cachedBooksCount: 0,
        totalCanonicalChapters: TOTAL_CANONICAL_CHAPTERS,
        totalCanonicalBooks: TOTAL_CANONICAL_BOOKS,
        isFullOfflineReady: false,
        fullDownloadedAt: null,
        lastUpdatedAt: null,
      });
    }
  });
}

export async function loadBibleChapter(options: {
  bookId: number;
  chapter: number;
  isOnline: boolean;
  forceRefresh?: boolean;
}): Promise<{ chapterData: StoredBibleChapter | null; fromCache: boolean; error?: string }> {
  await initBibleDatabase();
  const { bookId, chapter, isOnline, forceRefresh = false } = options;
  const meta = findBibleBookMeta(bookId);
  if (!meta) {
    return { chapterData: null, fromCache: false, error: 'Kitab tidak ditemukan dalam katalog.' };
  }

  const cached = await getChapterFromDb(bookId, chapter);

  // Serve directly from offline database when complete (not partial seed) or when offline
  if (cached && !forceRefresh && (!cached.isPartialSeed || !isOnline)) {
    return { chapterData: cached, fromCache: true };
  }

  if (!isOnline) {
    if (cached) {
      return { chapterData: cached, fromCache: true };
    }
    return {
      chapterData: null,
      fromCache: false,
      error: `Pasal ${meta.name} ${chapter} belum tersimpan di database offline. Hubungkan internet atau unduh paket 66 kitab saat online.`,
    };
  }

  try {
    const res = await fetch(`${BOLLS_CHAPTER_ENDPOINT}/${bookId}/${chapter}/`);
    if (!res.ok) {
      throw new Error(`Gagal memuat pasal dari server Alkitab (${res.status}).`);
    }
    const rawVerses = (await res.json()) as Array<{ verse: number; text: string }>;
    const verses: BibleVerse[] = rawVerses
      .filter((v) => typeof v.verse === 'number' && typeof v.text === 'string')
      .map((v) => ({
        verse: v.verse,
        text: cleanVerseText(v.text),
      }))
      .sort((a, b) => a.verse - b.verse);

    if (verses.length === 0) {
      throw new Error('Data ayat tidak ditemukan untuk pasal tersebut.');
    }

    const stored: StoredBibleChapter = {
      key: makeChapterKey(meta.bookId, chapter),
      bookId: meta.bookId,
      bookSlug: meta.id,
      bookName: meta.name,
      chapter,
      verses,
      source: 'api',
      isPartialSeed: false,
      updatedAt: new Date().toISOString(),
    };

    await saveChapterToDb(stored);
    return { chapterData: stored, fromCache: false };
  } catch (err) {
    if (cached) {
      return {
        chapterData: cached,
        fromCache: true,
        error:
          err instanceof Error
            ? `Gagal memperbarui pasal (${err.message}), menampilkan salinan offline.`
            : undefined,
      };
    }
    return {
      chapterData: null,
      fromCache: false,
      error: err instanceof Error ? err.message : 'Gagal mengambil teks pasal Alkitab.',
    };
  }
}

export async function downloadFullBibleOffline(
  onProgress?: (progress: BibleDownloadProgress) => void
): Promise<{ chaptersSaved: number; versesSaved: number }> {
  await initBibleDatabase();
  onProgress?.({
    stage: 'downloading',
    percent: 5,
    detail: 'Menghubungkan ke database Alkitab Terjemahan Baru (TB)...',
  });

  const res = await fetch(BOLLS_FULL_TB_URL);
  if (!res.ok) {
    throw new Error(`Gagal mengunduh database Alkitab lengkap (${res.status}).`);
  }

  let jsonText = '';
  const contentLength = Number(res.headers.get('content-length')) || 7_500_000;
  if (res.body && typeof res.body.getReader === 'function') {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let received = 0;
    const chunks: string[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        chunks.push(decoder.decode(value, { stream: true }));
        const dlPercent = Math.min(60, 8 + Math.round((received / contentLength) * 52));
        onProgress?.({
          stage: 'downloading',
          percent: dlPercent,
          detail: `Mengunduh teks Alkitab (${(received / (1024 * 1024)).toFixed(1)} MB)...`,
        });
      }
    }
    chunks.push(decoder.decode());
    jsonText = chunks.join('');
  } else {
    jsonText = await res.text();
  }

  onProgress?.({
    stage: 'indexing',
    percent: 65,
    detail: 'Memproses 66 kitab dan 31.000+ ayat ke database lokal...',
  });

  const rows = JSON.parse(jsonText) as Array<{
    book: number;
    chapter: number;
    verse: number;
    text: string;
  }>;

  const grouped = new Map<string, { bookId: number; chapter: number; verses: BibleVerse[] }>();
  let versesSaved = 0;

  for (const row of rows) {
    if (!row.book || !row.chapter || !row.verse || typeof row.text !== 'string') continue;
    const key = makeChapterKey(row.book, row.chapter);
    let bucket = grouped.get(key);
    if (!bucket) {
      bucket = { bookId: row.book, chapter: row.chapter, verses: [] };
      grouped.set(key, bucket);
    }
    bucket.verses.push({
      verse: row.verse,
      text: cleanVerseText(row.text),
    });
    versesSaved += 1;
  }

  const now = new Date().toISOString();
  const entries: StoredBibleChapter[] = [];
  for (const bucket of grouped.values()) {
    const meta = findBibleBookMeta(bucket.bookId);
    if (!meta) continue;
    bucket.verses.sort((a, b) => a.verse - b.verse);
    entries.push({
      key: makeChapterKey(meta.bookId, bucket.chapter),
      bookId: meta.bookId,
      bookSlug: meta.id,
      bookName: meta.name,
      chapter: bucket.chapter,
      verses: bucket.verses,
      source: 'full-pack',
      isPartialSeed: false,
      updatedAt: now,
    });
  }

  const totalEntries = entries.length;
  const CHUNK_SIZE = 120;
  for (let i = 0; i < totalEntries; i += CHUNK_SIZE) {
    await saveChaptersBatchToDb(entries.slice(i, i + CHUNK_SIZE));
    const idxPercent = Math.min(99, 70 + Math.round(((i + CHUNK_SIZE) / totalEntries) * 29));
    onProgress?.({
      stage: 'indexing',
      percent: idxPercent,
      detail: `Menyimpan pasal offline (${Math.min(i + CHUNK_SIZE, totalEntries)} / ${totalEntries} pasal)...`,
    });
  }

  await setMetaValue('fullOfflineInfo', {
    downloadedAt: now,
    chaptersCount: totalEntries,
    versesCount: versesSaved,
  });

  onProgress?.({
    stage: 'done',
    percent: 100,
    detail: `Selesai! ${totalEntries.toLocaleString('id-ID')} pasal dari 66 kitab siap dibaca offline.`,
  });

  return { chaptersSaved: totalEntries, versesSaved };
}

export async function searchBibleVersesOffline(
  query: string,
  options?: { testament?: 'Semua' | 'PL' | 'PB'; bookId?: number; limit?: number }
): Promise<BibleSearchResult[]> {
  await initBibleDatabase();
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const limit = options?.limit ?? 60;
  const testament = options?.testament ?? 'Semua';
  const filterBookId = options?.bookId;
  const results: BibleSearchResult[] = [];

  const db = await openBibleDb();
  if (!db) {
    const all = Array.from(memoryFallbackChapters.values()).sort(
      (a, b) => a.bookId - b.bookId || a.chapter - b.chapter
    );
    for (const ch of all) {
      const meta = findBibleBookMeta(ch.bookId);
      if (!meta) continue;
      if (testament !== 'Semua' && meta.testament !== testament) continue;
      if (filterBookId && ch.bookId !== filterBookId) continue;
      for (const v of ch.verses) {
        if (v.text.toLowerCase().includes(q)) {
          results.push({
            bookId: ch.bookId,
            bookName: meta.name,
            testament: meta.testament,
            chapter: ch.chapter,
            verse: v.verse,
            text: v.text,
          });
          if (results.length >= limit) return results;
        }
      }
    }
    return results;
  }

  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_CHAPTERS, 'readonly');
      const req = tx.objectStore(STORE_CHAPTERS).openCursor();

      req.onsuccess = () => {
        const cursor = req.result;
        if (!cursor || results.length >= limit) {
          results.sort(
            (a, b) => a.bookId - b.bookId || a.chapter - b.chapter || a.verse - b.verse
          );
          resolve(results);
          return;
        }

        const ch = cursor.value as StoredBibleChapter;
        const meta = findBibleBookMeta(ch.bookId);
        if (
          meta &&
          (testament === 'Semua' || meta.testament === testament) &&
          (!filterBookId || ch.bookId === filterBookId)
        ) {
          for (const v of ch.verses) {
            if (v.text.toLowerCase().includes(q)) {
              results.push({
                bookId: ch.bookId,
                bookName: meta.name,
                testament: meta.testament,
                chapter: ch.chapter,
                verse: v.verse,
                text: v.text,
              });
              if (results.length >= limit) break;
            }
          }
        }
        cursor.continue();
      };
      req.onerror = () => resolve(results);
    } catch {
      resolve(results);
    }
  });
}

/**
 * Imports Bible verses from spreadsheet rows into the offline IndexedDB database.
 * Expected header columns: Kitab (or Book) | Pasal (or Chapter) | Ayat (or Verse) | Teks (or Text)
 */
export async function importBibleFromRows(
  rows: string[][],
  source: 'sheets' | 'json' = 'sheets'
): Promise<{ chaptersSaved: number; versesSaved: number }> {
  await initBibleDatabase();
  if (rows.length < 2) {
    throw new Error('Data Alkitab kosong. Minimal harus ada baris header dan 1 baris ayat.');
  }

  const headers = rows[0].map((h) => String(h).trim().toLowerCase());
  const colBook = headers.findIndex((h) => h.includes('kitab') || h.includes('book'));
  const colChapter = headers.findIndex((h) => h.includes('pasal') || h.includes('chapter'));
  const colVerse = headers.findIndex((h) => h.includes('ayat') || h.includes('verse'));
  const colText = headers.findIndex(
    (h) => h.includes('teks') || h.includes('isi') || h.includes('text')
  );

  const idxBook = colBook >= 0 ? colBook : 0;
  const idxChapter = colChapter >= 0 ? colChapter : 1;
  const idxVerse = colVerse >= 0 ? colVerse : 2;
  const idxText = colText >= 0 ? colText : 3;

  const grouped = new Map<string, { bookId: number; chapter: number; verses: BibleVerse[] }>();
  let versesSaved = 0;

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const bookRaw = String(r[idxBook] || '').trim();
    const chapterNum = parseInt(String(r[idxChapter] || ''), 10);
    const verseNum = parseInt(String(r[idxVerse] || ''), 10);
    const verseText = cleanVerseText(String(r[idxText] || ''));

    if (!bookRaw || !chapterNum || !verseNum || !verseText) continue;
    const meta = findBibleBookMeta(bookRaw);
    if (!meta) continue;

    const key = makeChapterKey(meta.bookId, chapterNum);
    let bucket = grouped.get(key);
    if (!bucket) {
      bucket = { bookId: meta.bookId, chapter: chapterNum, verses: [] };
      grouped.set(key, bucket);
    }
    bucket.verses.push({ verse: verseNum, text: verseText });
    versesSaved += 1;
  }

  const now = new Date().toISOString();
  const entries: StoredBibleChapter[] = [];
  for (const bucket of grouped.values()) {
    const meta = findBibleBookMeta(bucket.bookId);
    if (!meta) continue;
    bucket.verses.sort((a, b) => a.verse - b.verse);
    entries.push({
      key: makeChapterKey(meta.bookId, bucket.chapter),
      bookId: meta.bookId,
      bookSlug: meta.id,
      bookName: meta.name,
      chapter: bucket.chapter,
      verses: bucket.verses,
      source,
      isPartialSeed: false,
      updatedAt: now,
    });
  }

  if (entries.length === 0) {
    throw new Error('Tidak ada ayat valid yang dapat diimpor. Periksa format Kitab, Pasal, Ayat, Teks.');
  }

  await saveChaptersBatchToDb(entries);
  return { chaptersSaved: entries.length, versesSaved };
}

export async function clearBibleOfflineCache(): Promise<void> {
  memoryFallbackChapters.clear();
  memoryFallbackMeta.clear();
  seedPromise = null;

  const db = await openBibleDb();
  if (db) {
    await new Promise<void>((resolve) => {
      try {
        const tx = db.transaction([STORE_CHAPTERS, STORE_META], 'readwrite');
        tx.objectStore(STORE_CHAPTERS).clear();
        tx.objectStore(STORE_META).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }
  await initBibleDatabase();
}

export { BIBLE_BOOK_CATALOG, TOTAL_CANONICAL_BOOKS, TOTAL_CANONICAL_CHAPTERS };
