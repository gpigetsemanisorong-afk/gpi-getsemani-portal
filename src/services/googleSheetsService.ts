import { CongregationStatRow, Hymn, HymnBook } from '../types/church';
import {
  extractSpreadsheetId,
  fetchMasterHymnSpreadsheetPull,
  fetchSheetValues,
  fetchSpreadsheetMetadata,
  MASTER_HYMN_TAB_DEFS,
  parseCongregationStatsFromSheet,
  parseHymnsFromSheet,
} from './googleWorkspace';

export const SHEETS_OFFLINE_CACHE_KEY = 'gpi_getsemani_sheets_offline_cache_v1';

export interface SheetsOfflineCacheEntry<T> {
  data: T;
  spreadsheetId: string;
  spreadsheetTitle?: string;
  tabTitle?: string;
  cachedAt: string;
}

export interface SheetsOfflineCacheStore {
  hymns?: SheetsOfflineCacheEntry<Hymn[]>;
  statistics?: SheetsOfflineCacheEntry<CongregationStatRow[]>;
}

export interface MasterHymnsReadResult {
  spreadsheetId: string;
  spreadsheetTitle: string;
  hymns: Hymn[];
  fetchedAt: string;
  tabsRead: string[];
}

export interface ChurchStatsReadResult {
  spreadsheetId: string;
  spreadsheetTitle: string;
  tabTitle: string;
  statistics: CongregationStatRow[];
  fetchedAt: string;
}

function resolveTabTitleForBook(tabTitle: string): HymnBook | null {
  const upper = tabTitle.toUpperCase();
  if (upper.includes('(KJ)') || upper === 'KJ' || upper.includes('KIDUNG JEMAAT')) {
    if (!upper.includes('PELENGKAP') && !upper.includes('PKJ')) return 'KJ';
  }
  if (upper.includes('(PKJ)') || upper === 'PKJ' || upper.includes('PELENGKAP')) return 'PKJ';
  if (upper.includes('(NKB)') || upper === 'NKB' || upper.includes('KIDUNG BARU')) return 'NKB';
  if (upper.includes('(DSL)') || upper === 'DSL' || upper.includes('SAHABAT LAMA')) return 'DSL';
  if (upper.includes('(NR)') || upper === 'NR' || upper.includes('NYANYIAN ROHANI')) return 'NR';
  return null;
}

/**
 * Reads & parses the Master Song Database from Google Sheets.
 * Supports both the 5-tab Master Lagu Rohani structure (KJ, NKB, PKJ, DSL, NR)
 * and single-tab hymn sheets (e.g. tab "Nyanyian" with a "Buku" column).
 */
export async function readMasterHymnsFromGoogleSheets(
  spreadsheetInput: string,
  accessToken: string
): Promise<MasterHymnsReadResult> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  if (!spreadsheetId) {
    throw new Error('ID atau URL Spreadsheet Master Lagu Rohani belum diisi.');
  }

  const metadata = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
  const matchingMultiTabs = metadata.sheets.filter(
    (s) => resolveTabTitleForBook(s.title) !== null
  );

  let hymns: Hymn[] = [];
  let tabsRead: string[] = [];

  if (matchingMultiTabs.length > 0) {
    hymns = await fetchMasterHymnSpreadsheetPull(spreadsheetId, accessToken);
    tabsRead = matchingMultiTabs.map((t) => t.title);
  } else {
    const singleTab =
      metadata.sheets.find((s) => s.title.toLowerCase().includes('nyanyian'))?.title ||
      metadata.sheets[0]?.title;
    if (!singleTab) {
      throw new Error('Spreadsheet tidak memiliki tab lembar kerja lagu.');
    }
    const rows = await fetchSheetValues(spreadsheetId, singleTab, accessToken);
    hymns = parseHymnsFromSheet(rows);
    tabsRead = [singleTab];
  }

  return {
    spreadsheetId: metadata.spreadsheetId,
    spreadsheetTitle: metadata.title,
    hymns,
    fetchedAt: new Date().toISOString(),
    tabsRead,
  };
}

/**
 * Reads & parses Church Congregation Statistics from Google Sheets.
 */
export async function readChurchStatisticsFromGoogleSheets(
  spreadsheetInput: string,
  accessToken: string,
  preferredTabName?: string
): Promise<ChurchStatsReadResult> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  if (!spreadsheetId) {
    throw new Error('ID atau URL Spreadsheet Statistik Jemaat belum diisi.');
  }

  const metadata = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
  if (metadata.sheets.length === 0) {
    throw new Error('Spreadsheet statistik tidak memiliki tab lembar kerja.');
  }

  const matchedTab =
    (preferredTabName && metadata.sheets.find((s) => s.title === preferredTabName)?.title) ||
    metadata.sheets.find((s) => s.title.toLowerCase().includes('statistik'))?.title ||
    metadata.sheets[0].title;

  const rows = await fetchSheetValues(metadata.spreadsheetId, matchedTab, accessToken);
  const statistics = parseCongregationStatsFromSheet(rows);

  return {
    spreadsheetId: metadata.spreadsheetId,
    spreadsheetTitle: metadata.title,
    tabTitle: matchedTab,
    statistics,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Concurrently fetches & parses both Master Song Database and Church Statistics sheets.
 */
export async function readAllSheetsForOfflineCache(
  options: {
    masterHymnsSheetId?: string;
    statsSheetId?: string;
    statsTabName?: string;
  },
  accessToken: string
): Promise<{
  hymnsResult: MasterHymnsReadResult | null;
  statsResult: ChurchStatsReadResult | null;
  errors: string[];
}> {
  const errors: string[] = [];
  let hymnsResult: MasterHymnsReadResult | null = null;
  let statsResult: ChurchStatsReadResult | null = null;

  const tasks: Promise<void>[] = [];

  if (options.masterHymnsSheetId) {
    tasks.push(
      readMasterHymnsFromGoogleSheets(options.masterHymnsSheetId, accessToken)
        .then((res) => {
          hymnsResult = res;
        })
        .catch((err) => {
          errors.push(
            err instanceof Error ? `Master Lagu: ${err.message}` : 'Gagal memuat Master Lagu.'
          );
        })
    );
  }

  if (options.statsSheetId) {
    tasks.push(
      readChurchStatisticsFromGoogleSheets(
        options.statsSheetId,
        accessToken,
        options.statsTabName
      )
        .then((res) => {
          statsResult = res;
        })
        .catch((err) => {
          errors.push(
            err instanceof Error ? `Statistik: ${err.message}` : 'Gagal memuat Statistik.'
          );
        })
    );
  }

  await Promise.all(tasks);
  return { hymnsResult, statsResult, errors };
}

export function loadSheetsOfflineCache(): SheetsOfflineCacheStore {
  try {
    const raw = localStorage.getItem(SHEETS_OFFLINE_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as SheetsOfflineCacheStore;
  } catch {
    return {};
  }
}

export function saveSheetsOfflineCache(patch: Partial<SheetsOfflineCacheStore>): SheetsOfflineCacheStore {
  const current = loadSheetsOfflineCache();
  const next: SheetsOfflineCacheStore = {
    ...current,
    ...patch,
  };
  try {
    localStorage.setItem(SHEETS_OFFLINE_CACHE_KEY, JSON.stringify(next));
  } catch {
    // ignore storage quota errors cleanly
  }
  return next;
}

export { MASTER_HYMN_TAB_DEFS };
