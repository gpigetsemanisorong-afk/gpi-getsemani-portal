import { useCallback, useEffect, useMemo, useState } from 'react';
import { CongregationStatRow, Hymn } from '../types/church';
import {
  extractSpreadsheetId,
  fetchSheetValues,
  fetchSpreadsheetMetadata,
  getWorkspaceAccessToken,
  parseCongregationStatsFromSheet,
  parseHymnsFromSheet,
} from '../services/googleWorkspace';
import {
  readChurchStatisticsFromGoogleSheets,
  readMasterHymnsFromGoogleSheets,
  saveSheetsOfflineCache,
} from '../services/googleSheetsService';

export const MASTER_SHEET_CACHE_PREFIX = 'gpi_getsemani_sheet_cache_v1';

export type GoogleSheetDataKind = 'hymns' | 'statistics' | 'raw' | 'auto';

export interface UseGoogleSheetsOptions {
  /** Master Google Sheets URL or Spreadsheet ID */
  sheetUrl?: string;
  /** Target data type to parse; defaults to 'auto' */
  kind?: GoogleSheetDataKind;
  /** Optional specific tab/sheet name to read */
  tabName?: string;
  /** Automatically fetch when mounted (or when sheetUrl changes) if online & authenticated */
  autoFetch?: boolean;
  /** Cache freshness window in ms (default: 15 minutes). Cached data is still served offline regardless of TTL. */
  cacheTtlMs?: number;
  /** Optional callback invoked when fresh or cached data is resolved */
  onDataLoaded?: (payload: GoogleSheetsParsedData) => void;
}

export interface GoogleSheetsParsedData {
  spreadsheetId: string;
  spreadsheetTitle: string;
  tabTitle?: string;
  hymns: Hymn[];
  statistics: CongregationStatRow[];
  rawRows: string[][];
  cachedAt: string;
}

export interface UseGoogleSheetsResult {
  data: GoogleSheetsParsedData | null;
  hymns: Hymn[];
  statistics: CongregationStatRow[];
  rawRows: string[][];
  spreadsheetTitle: string | null;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  isFromCache: boolean;
  lastCachedAt: string | null;
  refresh: (overrideUrlOrId?: string) => Promise<GoogleSheetsParsedData | null>;
  clearCache: () => void;
}

function buildCacheKey(sheetId: string, kind: GoogleSheetDataKind, tabName?: string): string {
  const safeId = sheetId || 'default';
  const safeTab = tabName ? `_${tabName.trim().toLowerCase()}` : '';
  return `${MASTER_SHEET_CACHE_PREFIX}_${kind}_${safeId}${safeTab}`;
}

function readLocalSheetCache(key: string): GoogleSheetsParsedData | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as GoogleSheetsParsedData;
  } catch {
    return null;
  }
}

function writeLocalSheetCache(key: string, payload: GoogleSheetsParsedData): void {
  try {
    localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Ignore storage quota issues safely
  }
}

function isCacheFresh(cachedAt: string | null | undefined, ttlMs: number): boolean {
  if (!cachedAt) return false;
  const parsedTime = Date.parse(cachedAt);
  if (Number.isNaN(parsedTime)) return false;
  return Date.now() - parsedTime < ttlMs;
}

export function useGoogleSheets(
  optionsOrUrl?: string | UseGoogleSheetsOptions
): UseGoogleSheetsResult {
  const normalizedOptions: UseGoogleSheetsOptions = useMemo(() => {
    if (typeof optionsOrUrl === 'string') {
      return { sheetUrl: optionsOrUrl };
    }
    return optionsOrUrl || {};
  }, [optionsOrUrl]);

  const {
    sheetUrl = '',
    kind = 'auto',
    tabName,
    autoFetch = false,
    cacheTtlMs = 15 * 60 * 1000,
    onDataLoaded,
  } = normalizedOptions;

  const resolvedSheetId = useMemo(
    () => (sheetUrl ? extractSpreadsheetId(sheetUrl) : ''),
    [sheetUrl]
  );

  const cacheKey = useMemo(
    () => buildCacheKey(resolvedSheetId, kind, tabName),
    [resolvedSheetId, kind, tabName]
  );

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [data, setData] = useState<GoogleSheetsParsedData | null>(() =>
    readLocalSheetCache(cacheKey)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(() =>
    Boolean(readLocalSheetCache(cacheKey))
  );

  // Sync cached state immediately if cacheKey changes (e.g. different sheet URL/tab)
  useEffect(() => {
    const cached = readLocalSheetCache(cacheKey);
    if (cached) {
      setData(cached);
      setIsFromCache(true);
    }
  }, [cacheKey]);

  // Track online/offline transitions
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const refresh = useCallback(
    async (overrideUrlOrId?: string): Promise<GoogleSheetsParsedData | null> => {
      const targetInput = (overrideUrlOrId ?? sheetUrl).trim();
      const targetId = targetInput ? extractSpreadsheetId(targetInput) : '';
      const activeCacheKey = buildCacheKey(targetId, kind, tabName);
      const cached = readLocalSheetCache(activeCacheKey);

      setError(null);

      // Offline fallback: serve localStorage cache immediately
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          onDataLoaded?.(cached);
          return cached;
        }
        setError('Aplikasi sedang offline dan data cache lokal belum tersedia.');
        return null;
      }

      if (!targetId) {
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          return cached;
        }
        setError('URL atau ID Google Sheets belum diberikan.');
        return null;
      }

      const accessToken = getWorkspaceAccessToken();
      if (!accessToken) {
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          onDataLoaded?.(cached);
          return cached;
        }
        setError('Silakan hubungkan akun Google (Sign in with Google) untuk membaca Google Sheets.');
        return null;
      }

      setLoading(true);
      try {
        let parsedResult: GoogleSheetsParsedData;

        if (kind === 'hymns') {
          const res = await readMasterHymnsFromGoogleSheets(targetId, accessToken);
          parsedResult = {
            spreadsheetId: res.spreadsheetId,
            spreadsheetTitle: res.spreadsheetTitle,
            tabTitle: res.tabsRead.join(', '),
            hymns: res.hymns,
            statistics: [],
            rawRows: [],
            cachedAt: res.fetchedAt,
          };
          if (res.hymns.length > 0) {
            saveSheetsOfflineCache({
              hymns: {
                data: res.hymns,
                spreadsheetId: res.spreadsheetId,
                spreadsheetTitle: res.spreadsheetTitle,
                cachedAt: res.fetchedAt,
              },
            });
          }
        } else if (kind === 'statistics') {
          const res = await readChurchStatisticsFromGoogleSheets(
            targetId,
            accessToken,
            tabName
          );
          parsedResult = {
            spreadsheetId: res.spreadsheetId,
            spreadsheetTitle: res.spreadsheetTitle,
            tabTitle: res.tabTitle,
            hymns: [],
            statistics: res.statistics,
            rawRows: [],
            cachedAt: res.fetchedAt,
          };
          if (res.statistics.length > 0) {
            saveSheetsOfflineCache({
              statistics: {
                data: res.statistics,
                spreadsheetId: res.spreadsheetId,
                spreadsheetTitle: res.spreadsheetTitle,
                tabTitle: res.tabTitle,
                cachedAt: res.fetchedAt,
              },
            });
          }
        } else if (kind === 'raw') {
          const meta = await fetchSpreadsheetMetadata(targetId, accessToken);
          const resolvedTab =
            (tabName && meta.sheets.find((s) => s.title === tabName)?.title) ||
            meta.sheets[0]?.title;
          if (!resolvedTab) {
            throw new Error('Spreadsheet tidak memiliki tab lembar kerja.');
          }
          const rows = await fetchSheetValues(meta.spreadsheetId, resolvedTab, accessToken);
          parsedResult = {
            spreadsheetId: meta.spreadsheetId,
            spreadsheetTitle: meta.title,
            tabTitle: resolvedTab,
            hymns: [],
            statistics: [],
            rawRows: rows,
            cachedAt: new Date().toISOString(),
          };
        } else {
          // 'auto': Inspect spreadsheet tabs and parse hymns and/or statistics
          const meta = await fetchSpreadsheetMetadata(targetId, accessToken);
          const titlesLower = meta.sheets.map((s) => s.title.toLowerCase());
          const looksLikeMasterHymns = titlesLower.some(
            (t) =>
              t.includes('(kj)') ||
              t.includes('(nkb)') ||
              t.includes('(pkj)') ||
              t.includes('(dsl)') ||
              t.includes('(nr)') ||
              t.includes('nyanyian')
          );
          const hasStatsTab = meta.sheets.find(
            (s) =>
              s.title.toLowerCase().includes('statistik') ||
              s.title.toLowerCase().includes('jemaat')
          );

          let hymns: Hymn[] = [];
          let statistics: CongregationStatRow[] = [];
          let rawRows: string[][] = [];
          let resolvedTabTitle = tabName || meta.sheets[0]?.title;

          if (looksLikeMasterHymns) {
            const hymnRes = await readMasterHymnsFromGoogleSheets(targetId, accessToken);
            hymns = hymnRes.hymns;
            resolvedTabTitle = hymnRes.tabsRead.join(', ');
          }

          if (hasStatsTab || !looksLikeMasterHymns) {
            const targetStatsTab =
              (tabName && meta.sheets.find((s) => s.title === tabName)?.title) ||
              hasStatsTab?.title ||
              meta.sheets[0]?.title;

            if (targetStatsTab) {
              const rows = await fetchSheetValues(meta.spreadsheetId, targetStatsTab, accessToken);
              rawRows = rows;
              const headers = (rows[0] || []).map((h) => String(h).toLowerCase());
              const isHymnTable =
                headers.some((h) => h.includes('lirik') || h.includes('bait')) &&
                headers.some((h) => h.includes('judul'));
              const isStatsTable = headers.some(
                (h) => h.includes('sektor') || h.includes('jiwa') || h.includes('kk')
              );

              if (isHymnTable && hymns.length === 0) {
                hymns = parseHymnsFromSheet(rows);
              } else if (isStatsTable) {
                statistics = parseCongregationStatsFromSheet(rows);
              }
              if (!looksLikeMasterHymns) {
                resolvedTabTitle = targetStatsTab;
              }
            }
          }

          const now = new Date().toISOString();
          parsedResult = {
            spreadsheetId: meta.spreadsheetId,
            spreadsheetTitle: meta.title,
            tabTitle: resolvedTabTitle,
            hymns,
            statistics,
            rawRows,
            cachedAt: now,
          };

          if (hymns.length > 0) {
            saveSheetsOfflineCache({
              hymns: {
                data: hymns,
                spreadsheetId: meta.spreadsheetId,
                spreadsheetTitle: meta.title,
                cachedAt: now,
              },
            });
          }
          if (statistics.length > 0) {
            saveSheetsOfflineCache({
              statistics: {
                data: statistics,
                spreadsheetId: meta.spreadsheetId,
                spreadsheetTitle: meta.title,
                tabTitle: hasStatsTab?.title || resolvedTabTitle,
                cachedAt: now,
              },
            });
          }
        }

        writeLocalSheetCache(activeCacheKey, parsedResult);
        setData(parsedResult);
        setIsFromCache(false);
        onDataLoaded?.(parsedResult);
        return parsedResult;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Gagal mengambil data dari Google Sheets.';
        setError(message);

        // Fallback to cached localStorage data if available
        if (cached) {
          setData(cached);
          setIsFromCache(true);
          onDataLoaded?.(cached);
          return cached;
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [kind, onDataLoaded, sheetUrl, tabName]
  );

  // Optional auto-fetch when online & cache is stale or absent
  useEffect(() => {
    if (!autoFetch || !resolvedSheetId || !isOnline) return;
    const cached = readLocalSheetCache(cacheKey);
    if (cached && isCacheFresh(cached.cachedAt, cacheTtlMs)) {
      return;
    }
    if (getWorkspaceAccessToken()) {
      void refresh();
    }
  }, [autoFetch, cacheKey, cacheTtlMs, isOnline, refresh, resolvedSheetId]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey);
    } catch {
      // ignore
    }
    setData(null);
    setIsFromCache(false);
  }, [cacheKey]);

  return {
    data,
    hymns: data?.hymns || [],
    statistics: data?.statistics || [],
    rawRows: data?.rawRows || [],
    spreadsheetTitle: data?.spreadsheetTitle || null,
    loading,
    error,
    isOnline,
    isFromCache,
    lastCachedAt: data?.cachedAt || null,
    refresh,
    clearCache,
  };
}

export default useGoogleSheets;
