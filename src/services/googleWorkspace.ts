import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { CongregationStatRow, Hymn, HymnBook, PortalDataState } from '../types/church';

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/spreadsheets',
] as const;

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => provider.addScope(scope));

let isSigningIn = false;
// Access token is kept strictly in memory per security guidelines
let cachedAccessToken: string | null = null;

export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthUnavailable?: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        onAuthSuccess?.(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        onAuthUnavailable?.(user);
      }
    } else {
      cachedAccessToken = null;
      onAuthUnavailable?.(null);
    }
  });
};

export const signInWithGoogleWorkspace = async (): Promise<{
  user: User;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Token akses Google Workspace tidak ditemukan. Silakan coba lagi.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } finally {
    isSigningIn = false;
  }
};

export const getWorkspaceAccessToken = (): string | null => cachedAccessToken;

export const signOutGoogleWorkspace = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  thumbnailLink?: string;
  modifiedTime?: string;
}

export function extractDriveFolderId(input: string): string {
  const trimmed = input.trim();
  const folderMatch = trimmed.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch) return folderMatch[1];
  const idMatch = trimmed.match(/id=([a-zA-Z0-9_-]+)/);
  if (idMatch) return idMatch[1];
  return trimmed;
}

export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) return match[1];
  return trimmed;
}

export async function listDriveFolderFiles(
  folderId: string,
  accessToken: string
): Promise<DriveFileSummary[]> {
  const cleanId = extractDriveFolderId(folderId);
  const query = encodeURIComponent(`'${cleanId}' in parents and trashed = false`);
  const fields = encodeURIComponent('files(id,name,mimeType,webViewLink,thumbnailLink,modifiedTime)');
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=25`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membaca folder Google Drive (${res.status}).`);
  }
  const data = await res.json();
  return data.files || [];
}

export async function fetchDriveImageAsDataUrl(
  fileId: string,
  accessToken: string
): Promise<string> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Gagal mengunduh gambar logo dari Google Drive (${res.status}).`);
  }
  const blob = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Gagal membaca data gambar dari Google Drive.'));
    reader.readAsDataURL(blob);
  });
}

export async function syncDatabaseToDrive(
  portalData: PortalDataState,
  existingFileId: string | undefined,
  accessToken: string
): Promise<{ fileId: string; modifiedTime: string }> {
  const fileName = 'gpi_getsemani_sorong_db.json';
  const payload = JSON.stringify(
    {
      app: 'GPI GETSEMANI SORONG',
      updatedAt: new Date().toISOString(),
      data: portalData,
    },
    null,
    2
  );

  const metadata = {
    name: fileName,
    mimeType: 'application/json',
  };

  const boundary = '-------gpiGetsemaniBoundary314159';
  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${payload}\r\n` +
    `--${boundary}--`;

  const isUpdate = Boolean(existingFileId);
  const url = isUpdate
    ? `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart&fields=id,modifiedTime`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,modifiedTime`;

  const res = await fetch(url, {
    method: isUpdate ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary="${boundary}"`,
    },
    body: multipartBody,
  });

  if (!res.ok) {
    if (res.status === 404 && isUpdate) {
      // File no longer exists on Drive; create a fresh backup file
      return syncDatabaseToDrive(portalData, undefined, accessToken);
    }
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal menyimpan data ke Google Drive (${res.status}).`);
  }

  const result = await res.json();
  return {
    fileId: result.id,
    modifiedTime: result.modifiedTime || new Date().toISOString(),
  };
}

export async function loadDatabaseFromDrive(
  fileId: string,
  accessToken: string
): Promise<Partial<PortalDataState>> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    throw new Error(`Gagal memuat berkas cadangan dari Google Drive (${res.status}).`);
  }
  const parsed = await res.json();
  return parsed.data || parsed;
}

export interface SheetMetadata {
  spreadsheetId: string;
  title: string;
  spreadsheetUrl: string;
  sheets: { sheetId: number; title: string }[];
}

export async function fetchSpreadsheetMetadata(
  spreadsheetInput: string,
  accessToken: string
): Promise<SheetMetadata> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,spreadsheetUrl,properties.title,sheets.properties(sheetId,title)`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membaca metadata Google Sheets (${res.status}).`);
  }
  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    title: data.properties?.title || 'Spreadsheet',
    spreadsheetUrl:
      data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}`,
    sheets: (data.sheets || []).map(
      (s: { properties: { sheetId: number; title: string } }) => ({
        sheetId: s.properties.sheetId,
        title: s.properties.title,
      })
    ),
  };
}

export async function fetchSheetValues(
  spreadsheetInput: string,
  sheetTitle: string,
  accessToken: string
): Promise<string[][]> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  const safeRange = encodeURIComponent(`'${sheetTitle}'!A1:Z500`);
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${safeRange}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membaca isi sheet "${sheetTitle}" (${res.status}).`);
  }
  const data = await res.json();
  return data.values || [];
}

export function parseCongregationStatsFromSheet(rows: string[][]): CongregationStatRow[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h).trim().toLowerCase());
  const findCol = (keywords: string[], fallbackIdx: number) => {
    const idx = headers.findIndex((h) => keywords.some((k) => h.includes(k)));
    return idx >= 0 ? idx : fallbackIdx;
  };

  const colSektor = findCol(['sektor', 'rayon', 'wilayah'], 0);
  const colUnit = findCol(['unit', 'lingkungan', 'komisariat'], 1);
  const colKK = findCol(['kk', 'kepala keluarga'], 2);
  const colJiwa = findCol(['jiwa', 'total', 'anggota'], 3);
  const colPar = findCol(['par', 'anak'], 4);
  const colPp = findCol(['pp', 'pemuda'], 5);
  const colPerwata = findCol(['perwata', 'wanita', 'ibu'], 6);
  const colPerpri = findCol(['perpri', 'pria', 'bapak'], 7);
  const colLansia = findCol(['lansia', 'lanjut'], 8);

  const toNum = (val: string | undefined) => {
    const parsed = parseInt(String(val ?? '0').replace(/[^\d-]/g, ''), 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  };

  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ''))
    .map((row, index) => {
      const par = toNum(row[colPar]);
      const pp = toNum(row[colPp]);
      const perwata = toNum(row[colPerwata]);
      const perpri = toNum(row[colPerpri]);
      const lansia = toNum(row[colLansia]);
      const rawJiwa = toNum(row[colJiwa]);
      return {
        id: `sheet-stat-${index + 1}`,
        sektor: String(row[colSektor] || 'Sektor Umum').trim(),
        unit: String(row[colUnit] || `Unit ${index + 1}`).trim(),
        kk: toNum(row[colKK]),
        jiwa: rawJiwa > 0 ? rawJiwa : par + pp + perwata + perpri + lansia,
        par,
        pp,
        perwata,
        perpri,
        lansia,
      };
    });
}

const VALID_HYMN_BOOKS = new Set<HymnBook>(['KJ', 'PKJ', 'NKB', 'DSL', 'NR']);

export const MASTER_HYMN_TAB_DEFS: { book: HymnBook; tabTitle: string }[] = [
  { book: 'KJ', tabTitle: 'Kidung Jemaat (KJ)' },
  { book: 'NKB', tabTitle: 'Nyanyikan Kidung Baru (NKB)' },
  { book: 'PKJ', tabTitle: 'Pelengkap Kidung Jemaat (PKJ)' },
  { book: 'DSL', tabTitle: 'Dua Sahabat Lama (DSL)' },
  { book: 'NR', tabTitle: 'Nyanyian Rohani (NR)' },
];

export function parseHymnsFromSheet(rows: string[][], defaultBook?: HymnBook): Hymn[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => String(h).trim().toLowerCase());
  const findColExact = (keywords: string[]) =>
    headers.findIndex((h) => keywords.some((k) => h.includes(k)));

  const colBook = findColExact(['buku', 'book', 'kategori']);
  const hasExplicitBookCol = colBook >= 0;

  const colNumber = (() => {
    const idx = findColExact(['nomor', 'no', 'number']);
    return idx >= 0 ? idx : hasExplicitBookCol ? 1 : 0;
  })();
  const colTitle = (() => {
    const idx = findColExact(['judul', 'title', 'nama']);
    return idx >= 0 ? idx : hasExplicitBookCol ? 2 : 1;
  })();
  const colKey = (() => {
    const idx = findColExact(['nada', 'kunci', 'key']);
    return idx >= 0 ? idx : hasExplicitBookCol ? 3 : 2;
  })();
  const colLyrics = (() => {
    const idx = findColExact(['lirik', 'bait', 'syair', 'lyrics']);
    return idx >= 0 ? idx : hasExplicitBookCol ? 4 : 3;
  })();
  const colChorus = (() => {
    const idx = findColExact(['refrein', 'reff', 'chorus']);
    return idx >= 0 ? idx : hasExplicitBookCol ? 5 : 4;
  })();

  return rows
    .slice(1)
    .filter((row) => row.some((cell) => String(cell).trim() !== ''))
    .map((row, idx) => {
      const rawBook = hasExplicitBookCol
        ? (String(row[colBook] || defaultBook || 'KJ').trim().toUpperCase() as HymnBook)
        : (defaultBook || 'KJ');
      const book: HymnBook = VALID_HYMN_BOOKS.has(rawBook) ? rawBook : defaultBook || 'KJ';
      const numParsed = parseInt(String(row[colNumber] || idx + 1).replace(/[^\d]/g, ''), 10);
      const number = Number.isFinite(numParsed) && numParsed > 0 ? numParsed : idx + 1;
      const title = String(row[colTitle] || `${book} No. ${number}`).trim();
      const keySignature = String(row[colKey] || '').trim() || undefined;
      const chorus = String(row[colChorus] || '').trim() || undefined;
      const rawLyrics = String(row[colLyrics] || '').trim();

      const verses = rawLyrics
        ? rawLyrics
            .split(/\n\s*\n/)
            .map((chunk, vIdx) => ({
              number: vIdx + 1,
              text: chunk.replace(/^\d+\.\s*/, '').trim(),
            }))
            .filter((v) => v.text.length > 0)
        : [{ number: 1, text: '(Lirik belum diisi)' }];

      return {
        id: `${book.toLowerCase()}-${number}`,
        book,
        number,
        title,
        keySignature,
        verses,
        chorus,
      };
    });
}

function detectBookFromTabTitle(tabTitle: string): HymnBook | null {
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

export async function createMasterHymnSpreadsheet(
  hymns: Hymn[],
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Master Lagu Rohani — GPI Getsemani Sorong',
      },
      sheets: MASTER_HYMN_TAB_DEFS.map((t) => ({
        properties: { title: t.tabTitle },
      })),
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `Gagal membuat Spreadsheet Master Lagu Rohani (${res.status}).`
    );
  }

  const created = await res.json();
  const spreadsheetId = created.spreadsheetId as string;
  const spreadsheetUrl =
    (created.spreadsheetUrl as string) ||
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  await syncMasterHymnSpreadsheetPush(spreadsheetId, hymns, accessToken);
  return { spreadsheetId, spreadsheetUrl };
}

export async function syncMasterHymnSpreadsheetPush(
  spreadsheetInput: string,
  hymns: Hymn[],
  accessToken: string
): Promise<void> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  const metadata = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
  const existingTitles = new Set(metadata.sheets.map((s) => s.title));

  // Ensure all 5 tabs exist (match either exact tabTitle or existing tab matching book)
  const resolvedTabByBook = new Map<HymnBook, string>();
  const tabsToCreate: string[] = [];

  MASTER_HYMN_TAB_DEFS.forEach((def) => {
    const matched = metadata.sheets.find((s) => detectBookFromTabTitle(s.title) === def.book);
    if (matched) {
      resolvedTabByBook.set(def.book, matched.title);
    } else if (existingTitles.has(def.tabTitle)) {
      resolvedTabByBook.set(def.book, def.tabTitle);
    } else {
      resolvedTabByBook.set(def.book, def.tabTitle);
      tabsToCreate.push(def.tabTitle);
    }
  });

  if (tabsToCreate.length > 0) {
    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: tabsToCreate.map((title) => ({
          addSheet: { properties: { title } },
        })),
      }),
    });
  }

  // Clear old rows in the 5 tabs before writing clean sorted data
  const clearRanges = MASTER_HYMN_TAB_DEFS.map(
    (def) => `'${resolvedTabByBook.get(def.book)!}'!A1:F1000`
  );
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ranges: clearRanges }),
    }
  );

  const dataRanges = MASTER_HYMN_TAB_DEFS.map((def) => {
    const tabTitle = resolvedTabByBook.get(def.book)!;
    const bookHymns = hymns
      .filter((h) => h.book === def.book)
      .slice()
      .sort((a, b) => a.number - b.number);

    const rows = [
      ['Nomor', 'Judul', 'Nada Dasar', 'Lirik Bait', 'Refrein'],
      ...bookHymns.map((h) => [
        String(h.number),
        h.title,
        h.keySignature || '',
        h.verses.map((v) => `${v.number}. ${v.text}`).join('\n\n'),
        h.chorus || '',
      ]),
    ];

    return { range: `'${tabTitle}'!A1`, values: rows };
  });

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: dataRanges,
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `Gagal menulis ke Master Spreadsheet Lagu Rohani (${res.status}).`
    );
  }
}

export async function fetchMasterHymnSpreadsheetPull(
  spreadsheetInput: string,
  accessToken: string
): Promise<Hymn[]> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  const metadata = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);

  const tabsToRead = metadata.sheets
    .map((s) => ({
      title: s.title,
      book: detectBookFromTabTitle(s.title),
    }))
    .filter((item): item is { title: string; book: HymnBook } => item.book !== null);

  if (tabsToRead.length === 0) {
    throw new Error(
      'Tidak ditemukan tab KJ, NKB, PKJ, DSL, atau NR pada Spreadsheet tersebut.'
    );
  }

  const rangesQuery = tabsToRead
    .map((t) => `ranges=${encodeURIComponent(`'${t.title}'!A1:F1000`)}`)
    .join('&');

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `Gagal membaca Master Spreadsheet Lagu Rohani (${res.status}).`
    );
  }

  const payload = await res.json();
  const valueRanges: { values?: string[][] }[] = payload.valueRanges || [];
  const collected: Hymn[] = [];

  valueRanges.forEach((vr, idx) => {
    const targetBook = tabsToRead[idx]?.book;
    const rows = vr.values || [];
    if (rows.length >= 2 && targetBook) {
      collected.push(...parseHymnsFromSheet(rows, targetBook));
    }
  });

  return collected.sort((a, b) => a.book.localeCompare(b.book) || a.number - b.number);
}

export async function createChurchDatabaseSpreadsheet(
  portalData: PortalDataState,
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: 'Database Portal GPI Getsemani Sorong',
      },
      sheets: [
        { properties: { title: 'Statistik' } },
        { properties: { title: 'Jadwal' } },
        { properties: { title: 'Warta' } },
        { properties: { title: 'Keuangan' } },
        { properties: { title: 'Nyanyian' } },
        { properties: { title: 'Kotak Doa' } },
        { properties: { title: 'Log Aktivitas' } },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membuat Google Sheet database (${res.status}).`);
  }

  const created = await res.json();
  const spreadsheetId = created.spreadsheetId as string;
  const spreadsheetUrl =
    (created.spreadsheetUrl as string) ||
    `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;

  await syncChurchDatabaseToSheets(spreadsheetId, portalData, accessToken);
  return { spreadsheetId, spreadsheetUrl };
}

export async function syncChurchDatabaseToSheets(
  spreadsheetInput: string,
  portalData: PortalDataState,
  accessToken: string
): Promise<void> {
  const spreadsheetId = extractSpreadsheetId(spreadsheetInput);
  const metadata = await fetchSpreadsheetMetadata(spreadsheetId, accessToken);
  const existingTitles = new Set(metadata.sheets.map((s) => s.title));

  const targetTabs = ['Statistik', 'Jadwal', 'Warta', 'Keuangan', 'Nyanyian', 'Kotak Doa', 'Log Aktivitas'];
  const missingTabs = targetTabs.filter((t) => !existingTitles.has(t));

  if (missingTabs.length > 0) {
    const addRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: missingTabs.map((title) => ({
            addSheet: { properties: { title } },
          })),
        }),
      }
    );
    if (!addRes.ok) {
      const err = await addRes.json().catch(() => ({}));
      throw new Error(err.error?.message || `Gagal menambahkan tab spreadsheet (${addRes.status}).`);
    }
  }

  const statRows = [
    ['Sektor', 'Unit', 'KK', 'Jiwa', 'PAR', 'PP', 'PERWATA', 'PERPRI', 'LANSIA'],
    ...portalData.statistics.map((s) => [
      s.sektor,
      s.unit,
      String(s.kk),
      String(s.jiwa),
      String(s.par),
      String(s.pp),
      String(s.perwata),
      String(s.perpri),
      String(s.lansia),
    ]),
  ];

  const scheduleRows = [
    ['ID', 'Kategori', 'Sektor/Unsur', 'Unit', 'Judul', 'Tanggal', 'Waktu', 'Lokasi', 'Pelayan'],
    ...portalData.schedules.map((s) => [
      s.id,
      s.category,
      s.sektor || s.unsur || '-',
      s.unit || '-',
      s.title,
      s.date,
      s.time,
      s.location,
      s.leader,
    ]),
  ];

  const wartaRows = [
    ['ID', 'Edisi', 'Judul', 'Tanggal', 'Ringkasan', 'Izinkan PDF', 'URL PDF'],
    ...portalData.warta.map((w) => [
      w.id,
      w.edition,
      w.title,
      w.date,
      w.summary,
      w.allowPdfDownload ? 'YA' : 'TIDAK',
      w.pdfUrl || '-',
    ]),
  ];

  const financeRows = [
    ['ID', 'Tanggal', 'Uraian', 'Kategori', 'Jenis', 'Jumlah (IDR)'],
    ...portalData.finance.map((f) => [
      f.id,
      f.date,
      f.description,
      f.category,
      f.type,
      String(f.amount),
    ]),
  ];

  const hymnRows = [
    ['Buku', 'Nomor', 'Judul', 'Nada Dasar', 'Lirik Bait', 'Refrein'],
    ...portalData.hymns.map((h) => [
      h.book,
      String(h.number),
      h.title,
      h.keySignature || '-',
      h.verses.map((v) => `${v.number}. ${v.text}`).join('\n\n'),
      h.chorus || '',
    ]),
  ];

  const prayerRows = [
    ['ID', 'Waktu Kirim', 'Pemohon', 'Anonim', 'Telepon/WA', 'Kategori', 'Sektor/Unit', 'Permohonan Doa', 'Status', 'Catatan Majelis', 'Ditangani Oleh'],
    ...(portalData.prayerRequests || []).map((p) => [
      p.id,
      new Date(p.createdAt).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
      p.requesterName,
      p.isAnonymous ? 'YA' : 'TIDAK',
      p.phone || '-',
      p.category,
      p.unit || '-',
      p.prayerText,
      p.status,
      p.adminNote || '-',
      p.handledBy || '-',
    ]),
  ];

  const activityLogRows = [
    ['ID', 'Waktu', 'Pengguna', 'Peran', 'Kategori', 'Aksi', 'Keterangan'],
    ...(portalData.activityLogs || []).map((log) => [
      log.id,
      new Date(log.timestamp).toLocaleString('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'medium',
      }),
      log.actor,
      log.role,
      log.category,
      log.action,
      log.detail,
    ]),
  ];

  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ranges: ["'Kotak Doa'!A1:K1000", "'Log Aktivitas'!A1:G1000"],
      }),
    }
  ).catch(() => undefined);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          { range: "'Statistik'!A1", values: statRows },
          { range: "'Jadwal'!A1", values: scheduleRows },
          { range: "'Warta'!A1", values: wartaRows },
          { range: "'Keuangan'!A1", values: financeRows },
          { range: "'Nyanyian'!A1", values: hymnRows },
          { range: "'Kotak Doa'!A1", values: prayerRows },
          { range: "'Log Aktivitas'!A1", values: activityLogRows },
        ],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal menyinkronkan data ke Google Sheets (${res.status}).`);
  }
}
