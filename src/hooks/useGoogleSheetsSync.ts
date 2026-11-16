import { useCallback, useEffect, useState } from 'react';
import { usePortal } from '../context/PortalContext';
import { CongregationStatRow, Hymn } from '../types/church';
import { getWorkspaceAccessToken } from '../services/googleWorkspace';
import {
  loadSheetsOfflineCache,
  readAllSheetsForOfflineCache,
  readChurchStatisticsFromGoogleSheets,
  readMasterHymnsFromGoogleSheets,
  saveSheetsOfflineCache,
  SheetsOfflineCacheStore,
} from '../services/googleSheetsService';

export interface UseGoogleSheetsSyncResult {
  isOnline: boolean;
  isFetchingHymns: boolean;
  isFetchingStats: boolean;
  isSyncingAll: boolean;
  error: string | null;
  statusMessage: string | null;
  offlineCache: SheetsOfflineCacheStore;
  fetchAndCacheMasterHymns: (spreadsheetIdOverride?: string) => Promise<Hymn[]>;
  fetchAndCacheStatistics: (
    spreadsheetIdOverride?: string,
    tabNameOverride?: string
  ) => Promise<CongregationStatRow[]>;
  syncAllConfiguredSheets: () => Promise<{ hymnsCount: number; statsCount: number }>;
  restoreFromOfflineCache: () => { hymnsCount: number; statsCount: number };
  clearMessages: () => void;
}

export function useGoogleSheetsSync(): UseGoogleSheetsSyncResult {
  const { data, applyCachedSheetsData } = usePortal();

  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isFetchingHymns, setIsFetchingHymns] = useState(false);
  const [isFetchingStats, setIsFetchingStats] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [offlineCache, setOfflineCache] = useState<SheetsOfflineCacheStore>(() =>
    loadSheetsOfflineCache()
  );

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

  const restoreFromOfflineCache = useCallback(() => {
    const cached = loadSheetsOfflineCache();
    setOfflineCache(cached);
    const hymns = cached.hymns?.data;
    const statistics = cached.statistics?.data;

    if (hymns?.length || statistics?.length) {
      applyCachedSheetsData({
        hymns: hymns?.length ? hymns : undefined,
        statistics: statistics?.length ? statistics : undefined,
      });
      setStatusMessage(
        `Data offline dimuat dari cache lokal (${hymns?.length || 0} lagu, ${statistics?.length || 0} unit statistik).`
      );
    }

    return {
      hymnsCount: hymns?.length || 0,
      statsCount: statistics?.length || 0,
    };
  }, [applyCachedSheetsData]);

  const fetchAndCacheMasterHymns = useCallback(
    async (spreadsheetIdOverride?: string): Promise<Hymn[]> => {
      setError(null);
      setStatusMessage(null);

      const targetId =
        spreadsheetIdOverride?.trim() ||
        data.syncConfig.masterHymnsSheetId ||
        data.syncConfig.spreadsheetId;

      if (!isOnline) {
        const cached = loadSheetsOfflineCache();
        if (cached.hymns?.data?.length) {
          applyCachedSheetsData({ hymns: cached.hymns.data });
          setStatusMessage(
            `Sedang offline — menampilkan ${cached.hymns.data.length} lagu dari cache lokal.`
          );
          return cached.hymns.data;
        }
        setError('Tidak ada koneksi internet dan belum ada cache lagu offline.');
        return [];
      }

      const token = getWorkspaceAccessToken();
      if (!token) {
        setError('Hubungkan akun Google (Sign in with Google) untuk membaca Google Sheets.');
        return [];
      }
      if (!targetId) {
        setError('Spreadsheet Master Lagu Rohani belum ditautkan.');
        return [];
      }

      setIsFetchingHymns(true);
      try {
        const result = await readMasterHymnsFromGoogleSheets(targetId, token);
        if (result.hymns.length === 0) {
          setError('Tidak ada baris lagu yang terbaca dari Spreadsheet tersebut.');
          return [];
        }

        const updatedCache = saveSheetsOfflineCache({
          hymns: {
            data: result.hymns,
            spreadsheetId: result.spreadsheetId,
            spreadsheetTitle: result.spreadsheetTitle,
            cachedAt: result.fetchedAt,
          },
        });
        setOfflineCache(updatedCache);

        applyCachedSheetsData({
          hymns: result.hymns,
          syncPatch: {
            masterHymnsSheetId: result.spreadsheetId,
            masterHymnsSheetUrl: `https://docs.google.com/spreadsheets/d/${result.spreadsheetId}`,
            lastSyncedAt: result.fetchedAt,
          },
        });

        setStatusMessage(
          `${result.hymns.length} lagu berhasil dimuat dari "${result.spreadsheetTitle}" dan disimpan untuk akses offline.`
        );
        return result.hymns;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Gagal membaca Master Spreadsheet Lagu.';
        setError(msg);
        return [];
      } finally {
        setIsFetchingHymns(false);
      }
    },
    [
      applyCachedSheetsData,
      data.syncConfig.masterHymnsSheetId,
      data.syncConfig.spreadsheetId,
      isOnline,
    ]
  );

  const fetchAndCacheStatistics = useCallback(
    async (
      spreadsheetIdOverride?: string,
      tabNameOverride?: string
    ): Promise<CongregationStatRow[]> => {
      setError(null);
      setStatusMessage(null);

      const targetId =
        spreadsheetIdOverride?.trim() ||
        data.syncConfig.externalStatsSheetId ||
        data.syncConfig.spreadsheetId;

      const targetTab =
        tabNameOverride?.trim() || data.syncConfig.externalStatsSheetName || undefined;

      if (!isOnline) {
        const cached = loadSheetsOfflineCache();
        if (cached.statistics?.data?.length) {
          applyCachedSheetsData({ statistics: cached.statistics.data });
          setStatusMessage(
            `Sedang offline — menampilkan ${cached.statistics.data.length} unit statistik dari cache lokal.`
          );
          return cached.statistics.data;
        }
        setError('Tidak ada koneksi internet dan belum ada cache statistik offline.');
        return [];
      }

      const token = getWorkspaceAccessToken();
      if (!token) {
        setError('Hubungkan akun Google (Sign in with Google) untuk membaca Google Sheets.');
        return [];
      }
      if (!targetId) {
        setError('Spreadsheet Statistik Jemaat belum ditautkan.');
        return [];
      }

      setIsFetchingStats(true);
      try {
        const result = await readChurchStatisticsFromGoogleSheets(
          targetId,
          token,
          targetTab
        );
        if (result.statistics.length === 0) {
          setError(`Tab "${result.tabTitle}" belum memiliki baris statistik yang valid.`);
          return [];
        }

        const updatedCache = saveSheetsOfflineCache({
          statistics: {
            data: result.statistics,
            spreadsheetId: result.spreadsheetId,
            spreadsheetTitle: result.spreadsheetTitle,
            tabTitle: result.tabTitle,
            cachedAt: result.fetchedAt,
          },
        });
        setOfflineCache(updatedCache);

        applyCachedSheetsData({
          statistics: result.statistics,
          syncPatch: {
            externalStatsSheetId: result.spreadsheetId,
            externalStatsSheetName: result.tabTitle,
            lastSyncedAt: result.fetchedAt,
          },
        });

        setStatusMessage(
          `${result.statistics.length} unit statistik dari "${result.spreadsheetTitle}" (tab "${result.tabTitle}") berhasil disimpan ke cache offline.`
        );
        return result.statistics;
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Gagal membaca Spreadsheet Statistik Jemaat.';
        setError(msg);
        return [];
      } finally {
        setIsFetchingStats(false);
      }
    },
    [
      applyCachedSheetsData,
      data.syncConfig.externalStatsSheetId,
      data.syncConfig.externalStatsSheetName,
      data.syncConfig.spreadsheetId,
      isOnline,
    ]
  );

  const syncAllConfiguredSheets = useCallback(async () => {
    setError(null);
    setStatusMessage(null);

    if (!isOnline) {
      return restoreFromOfflineCache();
    }

    const token = getWorkspaceAccessToken();
    if (!token) {
      setError('Hubungkan akun Google terlebih dahulu untuk menyinkronkan Google Sheets.');
      return { hymnsCount: 0, statsCount: 0 };
    }

    const masterHymnsSheetId =
      data.syncConfig.masterHymnsSheetId || data.syncConfig.spreadsheetId || undefined;
    const statsSheetId =
      data.syncConfig.externalStatsSheetId || data.syncConfig.spreadsheetId || undefined;

    if (!masterHymnsSheetId && !statsSheetId) {
      setError('Belum ada Google Spreadsheet yang ditautkan untuk Lagu Rohani maupun Statistik.');
      return { hymnsCount: 0, statsCount: 0 };
    }

    setIsSyncingAll(true);
    try {
      const { hymnsResult, statsResult, errors } = await readAllSheetsForOfflineCache(
        {
          masterHymnsSheetId,
          statsSheetId,
          statsTabName: data.syncConfig.externalStatsSheetName || undefined,
        },
        token
      );

      const cachePatch: Partial<SheetsOfflineCacheStore> = {};
      if (hymnsResult && hymnsResult.hymns.length > 0) {
        cachePatch.hymns = {
          data: hymnsResult.hymns,
          spreadsheetId: hymnsResult.spreadsheetId,
          spreadsheetTitle: hymnsResult.spreadsheetTitle,
          cachedAt: hymnsResult.fetchedAt,
        };
      }
      if (statsResult && statsResult.statistics.length > 0) {
        cachePatch.statistics = {
          data: statsResult.statistics,
          spreadsheetId: statsResult.spreadsheetId,
          spreadsheetTitle: statsResult.spreadsheetTitle,
          tabTitle: statsResult.tabTitle,
          cachedAt: statsResult.fetchedAt,
        };
      }

      const nextCache = saveSheetsOfflineCache(cachePatch);
      setOfflineCache(nextCache);

      applyCachedSheetsData({
        hymns: hymnsResult?.hymns.length ? hymnsResult.hymns : undefined,
        statistics: statsResult?.statistics.length ? statsResult.statistics : undefined,
        syncPatch: {
          lastSyncedAt: new Date().toISOString(),
        },
      });

      const hymnsCount = hymnsResult?.hymns.length || 0;
      const statsCount = statsResult?.statistics.length || 0;

      if (errors.length > 0) {
        setError(errors.join(' | '));
      } else {
        setStatusMessage(
          `Sinkronisasi selesai & tersimpan offline (${hymnsCount} lagu, ${statsCount} unit statistik).`
        );
      }

      return { hymnsCount, statsCount };
    } finally {
      setIsSyncingAll(false);
    }
  }, [
    applyCachedSheetsData,
    data.syncConfig.externalStatsSheetId,
    data.syncConfig.externalStatsSheetName,
    data.syncConfig.masterHymnsSheetId,
    data.syncConfig.spreadsheetId,
    isOnline,
    restoreFromOfflineCache,
  ]);

  return {
    isOnline,
    isFetchingHymns,
    isFetchingStats,
    isSyncingAll,
    error,
    statusMessage,
    offlineCache,
    fetchAndCacheMasterHymns,
    fetchAndCacheStatistics,
    syncAllConfiguredSheets,
    restoreFromOfflineCache,
    clearMessages: () => {
      setError(null);
      setStatusMessage(null);
    },
  };
}
