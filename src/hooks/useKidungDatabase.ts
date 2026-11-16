import { useCallback, useEffect, useState } from 'react';
import { Hymn, HymnBook } from '../types/church';
import {
  downloadFullKidungPackOffline,
  exportKidungAsJsonString,
  getAllHymnsFromDb,
  getKidungDbStats,
  importKidungFromJsonString,
  KidungDbStats,
  saveHymnsToDb,
} from '../services/kidungDatabase';

export function useKidungDatabase() {
  const [hymns, setHymns] = useState<Hymn[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<KidungDbStats | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshHymns = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllHymnsFromDb();
      setHymns(data);
      const st = await getKidungDbStats();
      setStats(st);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Gagal memuat database Kidung Pujian.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshHymns();
  }, [refreshHymns]);

  const downloadFullPack = useCallback(async () => {
    setIsDownloading(true);
    try {
      const res = await downloadFullKidungPackOffline();
      await refreshHymns();
      setIsDownloading(false);
      return res.count;
    } catch (err: any) {
      setError(err?.message || 'Gagal mengunduh paket offline Kidung Pujian.');
      setIsDownloading(false);
      return 0;
    }
  }, [refreshHymns]);

  const importFromJson = useCallback(async (jsonStr: string) => {
    try {
      const res = await importKidungFromJsonString(jsonStr);
      if (res.error) {
        setError(res.error);
        return 0;
      }
      await refreshHymns();
      return res.count;
    } catch (err: any) {
      setError(err?.message || 'Gagal mengimpor file JSON.');
      return 0;
    }
  }, [refreshHymns]);

  const exportToJson = useCallback(async () => {
    return await exportKidungAsJsonString();
  }, []);

  const updateHymnList = useCallback(async (newHymns: Hymn[]) => {
    await saveHymnsToDb(newHymns);
    await refreshHymns();
  }, [refreshHymns]);

  return {
    hymns,
    loading,
    stats,
    isDownloading,
    error,
    refreshHymns,
    downloadFullPack,
    importFromJson,
    exportToJson,
    updateHymnList,
  };
}
