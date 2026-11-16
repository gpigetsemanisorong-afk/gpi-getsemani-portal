import { Hymn, HymnBook } from '../types/church';

const DB_NAME = 'gpi_getsemani_kidung_db';
const DB_VERSION = 1;
const STORE_HYMNS = 'hymns';
const STORE_META = 'meta';

export interface KidungDbStats {
  cachedHymnsCount: number;
  booksCount: Record<HymnBook, number>;
  lastUpdatedAt: string | null;
  isOfflineReady: boolean;
}

// Built-in offline seed pack with rich hymns across KJ, NKB, PKJ, DSL, NR
export const DEFAULT_OFFLINE_HYMNS: Hymn[] = [
  {
    id: 'nr-1',
    book: 'NR',
    number: 1,
    title: 'Haleluya, Pujilah Tuhan',
    keySignature: 'Do = F (4/4)',
    verses: [
      {
        number: 1,
        text: 'Haleluya, pujilah Tuhan, hai jiwaku, pujilah Dia!\nSelama hidupku ku hendak memuji Tuhan Allahku.\nKu bermazmur bagi-Nya selagi ada nyawaku!',
      },
      {
        number: 2,
        text: 'Janganlah harap pada raja atau anak manusia;\ntiada dapat ia menolong bila maut menjelang.\nBerbahagia orang yang Penolongnya Allah Yakub!',
      },
      {
        number: 3,
        text: 'Tuhan yang menjadikan langit, bumi, laut serta isinya;\nIa tetap setia menjaga kebenaran-Nya.\nIa membela orang tertindas, memberi roti kepada yang lapar.',
      },
    ],
  },
  {
    id: 'kj-1',
    book: 'KJ',
    number: 1,
    title: 'Haleluya, Pujilah',
    keySignature: 'Do = G (4/4)',
    chorus: 'Haleluya, pujilah Allah yang Agung, Mahaesa!\nDalam Kristus kita kenal Allah yang hidup, Bapa kekal!',
    verses: [
      {
        number: 1,
        text: 'Langit, buana semesta patut memuji kuasa-Nya,\nkarna berkat-Nya tak henti, limpah kasih-Nya tak terperi.',
      },
      {
        number: 2,
        text: 'Wahai dunia, soraklah! Angkat suaramu, nyanyilah!\nTabuhlah tifa dan gendang, iringi puji dalam tembang!',
      },
    ],
  },
  {
    id: 'kj-2',
    book: 'KJ',
    number: 2,
    title: 'Sembah Sujud pada-Nya',
    keySignature: 'Do = F (3/4)',
    verses: [
      {
        number: 1,
        text: 'Sembah sujud pada-Nya, Tuhan yang Mahakuasa!\nBawa persembahan syukur ke hadirat takhta-Nya.',
      },
      {
        number: 2,
        text: 'Muliakan nama-Nya yang besar di bumi dan di sorga!\nKasih setia-Nya tetap selama-lamanya.',
      },
    ],
  },
  {
    id: 'kj-3',
    book: 'KJ',
    number: 3,
    title: 'Kami Puji dengan Riang',
    keySignature: 'Do = G (4/4)',
    verses: [
      {
        number: 1,
        text: 'Kami puji dengan riang Dikau, Allah yang besar;\nbagai bunga trima siang, hati kami pun mekar.\nKabut dosa dan derita, kebimbangan, tlah lenyap.\nSumber suka yang abadi, bri sinar-Mu menyerap.',
      },
      {
        number: 2,
        text: 'Kau membritakan kasih-Mu lewat karya-Mu megah;\nbintang, bumi, dan samudra turut memuliakan-Nya.\nGunung, lembah, dan hutan, padang hijau berseri,\nmengumandangkan pujian bagi Allah yang suci.',
      },
    ],
  },
  {
    id: 'kj-64',
    book: 'KJ',
    number: 64,
    title: 'Bila Kulihat Bintang Gemerlapan',
    keySignature: 'Do = Bes (4/4)',
    chorus: 'Maka jiwaku pun memuji-Mu: Sungguh besar Kau, Allahku!\nMaka jiwaku pun memuji-Mu: Sungguh besar Kau, Allahku!',
    verses: [
      {
        number: 1,
        text: 'Bila kulihat bintang gemerlapan dan bunyi guruh riuh kudengar,\nya Tuhanku, tak putus aku heran melihat ciptaan-Mu yang besar.',
      },
      {
        number: 2,
        text: 'Ya Tuhanku, pabila kurenungkan pemberian-Mu dalam Penebus,\nku tertegun: bagiku dicurahkan oleh Putra-Mu darah-Nya kudus.',
      },
    ],
  },
  {
    id: 'pkj-1',
    book: 'PKJ',
    number: 1,
    title: 'Abadi Tak Bernora',
    keySignature: 'Do = C (4/4)',
    verses: [
      {
        number: 1,
        text: 'Abadi tak bernora, ya Allah Bapa kami,\nsembah dan puji syukur kami naikkan pada-Mu.',
      },
    ],
  },
  {
    id: 'pkj-2',
    book: 'PKJ',
    number: 2,
    title: 'Mulia, Mulia Nama-Nya',
    keySignature: 'Do = G (4/4)',
    verses: [
      {
        number: 1,
        text: 'Mulia, mulia nama-Nya, bagi Yesus kemuliaan dan puji!\nMulia, nama-Nya yang besar, agungkan Yesus, Raja semesta!',
      },
    ],
  },
  {
    id: 'nkb-3',
    book: 'NKB',
    number: 3,
    title: 'Terpujilah Allah',
    keySignature: 'Do = D (4/4)',
    chorus: 'Terpujilah Allah, hikmat-Nya besar!\nBeri puji kepada-Mu lewat Anak-Mu Penebus.',
    verses: [
      {
        number: 1,
        text: 'Terpujilah Allah, hikmat-Nya besar, karena karunia Putra-Nya benar,\nyang mati menebus dosa dunia dan membuka jalan ke sorga baka.',
      },
    ],
  },
  {
    id: 'dsl-12',
    book: 'DSL',
    number: 12,
    title: 'Yesus Kawan yang Sejati',
    keySignature: 'Do = F (6/8)',
    verses: [
      {
        number: 1,
        text: 'Yesus kawan yang sejati bagi kita yang lemah;\ntiaphari dibawanya s’gala susah pada-Nya.\nB’rapa susah percuma, beban kita t’rus berat,\nkarna kita tak berdoa pada Tuhan yang dekat.',
      },
      {
        number: 2,
        text: 'Jika engkau dicobai dan penanggungmu berat,\njangan kau putus asa: pada Tuhan berseru!\nYesus kawan yang sejati, Ia tahu kelemahanmu;\nla sedia memb’ri rahmat, basuh s’gala dosamu.',
      },
    ],
  },
];

let dbPromise: Promise<IDBDatabase | null> | null = null;
let memoryFallbackHymns: Hymn[] = [...DEFAULT_OFFLINE_HYMNS];

function openKidungDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') {
    return Promise.resolve(null);
  }
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_HYMNS)) {
          db.createObjectStore(STORE_HYMNS, { keyPath: 'id' });
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

export async function getAllHymnsFromDb(): Promise<Hymn[]> {
  const db = await openKidungDb();
  if (!db) {
    return memoryFallbackHymns;
  }
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_HYMNS, 'readonly');
      const req = tx.objectStore(STORE_HYMNS).getAll();
      req.onsuccess = () => {
        const result = (req.result || []) as Hymn[];
        if (result.length === 0) {
          resolve(DEFAULT_OFFLINE_HYMNS);
        } else {
          resolve(result);
        }
      };
      req.onerror = () => resolve(memoryFallbackHymns);
    } catch {
      resolve(memoryFallbackHymns);
    }
  });
}

export async function saveHymnsToDb(hymns: Hymn[]): Promise<void> {
  memoryFallbackHymns = [...hymns];
  const db = await openKidungDb();
  if (!db) return;

  return new Promise((resolve) => {
    try {
      const tx = db.transaction([STORE_HYMNS, STORE_META], 'readwrite');
      const store = tx.objectStore(STORE_HYMNS);
      store.clear();
      hymns.forEach((h) => store.put(h));

      const metaStore = tx.objectStore(STORE_META);
      metaStore.put({ key: 'lastUpdatedAt', value: new Date().toISOString() });

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export async function addOrUpdateHymnInDb(hymn: Hymn): Promise<void> {
  const all = await getAllHymnsFromDb();
  const idx = all.findIndex((x) => x.id === hymn.id);
  if (idx >= 0) {
    all[idx] = hymn;
  } else {
    all.push(hymn);
  }
  await saveHymnsToDb(all);
}

export async function deleteHymnFromDb(id: string): Promise<void> {
  const all = await getAllHymnsFromDb();
  const filtered = all.filter((x) => x.id !== id);
  await saveHymnsToDb(filtered);
}

export async function getKidungDbStats(): Promise<KidungDbStats> {
  const hymns = await getAllHymnsFromDb();
  const booksCount: Record<HymnBook, number> = {
    KJ: 0,
    PKJ: 0,
    NKB: 0,
    DSL: 0,
    NR: 0,
  };

  hymns.forEach((h) => {
    if (booksCount[h.book] !== undefined) {
      booksCount[h.book]++;
    }
  });

  let lastUpdatedAt: string | null = null;
  const db = await openKidungDb();
  if (db) {
    lastUpdatedAt = await new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_META, 'readonly');
        const req = tx.objectStore(STORE_META).get('lastUpdatedAt');
        req.onsuccess = () => resolve(req.result ? (req.result.value as string) : null);
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  return {
    cachedHymnsCount: hymns.length,
    booksCount,
    lastUpdatedAt,
    isOfflineReady: hymns.length >= 5,
  };
}

export async function importKidungFromJsonString(jsonStr: string): Promise<{ count: number; error?: string }> {
  try {
    const parsed = JSON.parse(jsonStr);
    let items: Hymn[] = [];
    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (parsed && Array.isArray(parsed.hymns)) {
      items = parsed.hymns;
    } else {
      return { count: 0, error: 'Format JSON tidak valid (harus berupa array lagu atau objek dengan properti hymns).' };
    }

    const validated: Hymn[] = items.map((h, idx) => ({
      id: h.id || `${(h.book || 'KJ').toLowerCase()}-${h.number || idx + 1}`,
      book: (h.book || 'KJ').toUpperCase() as HymnBook,
      number: Number(h.number) || idx + 1,
      title: h.title || `Kidung Tanpa Judul ${idx + 1}`,
      keySignature: h.keySignature || 'Do = C',
      chorus: h.chorus,
      verses: Array.isArray(h.verses) && h.verses.length > 0 ? h.verses : [{ number: 1, text: (h as any).text || '' }],
    }));

    const existing = await getAllHymnsFromDb();
    const map = new Map<string, Hymn>();
    existing.forEach((h) => map.set(h.id, h));
    validated.forEach((h) => map.set(h.id, h));

    const merged = Array.from(map.values()).sort((a, b) => {
      if (a.book !== b.book) return a.book.localeCompare(b.book);
      return a.number - b.number;
    });

    await saveHymnsToDb(merged);
    return { count: validated.length };
  } catch (err: any) {
    return { count: 0, error: err?.message || 'Gagal mem-parsing file JSON.' };
  }
}

export async function exportKidungAsJsonString(): Promise<string> {
  const hymns = await getAllHymnsFromDb();
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      source: 'GPI Getsemani Sorong - Kidung Pujian Offline Pack',
      totalCount: hymns.length,
      hymns,
    },
    null,
    2
  );
}

// Generate extended offline sample hymn pack if downloading full offline pack
export async function downloadFullKidungPackOffline(): Promise<{ count: number }> {
  const existing = await getAllHymnsFromDb();
  const map = new Map<string, Hymn>();
  existing.forEach((h) => map.set(h.id, h));

  // Add more sample hymns for KJ, NKB, PKJ, DSL, NR to ensure comprehensive offline coverage
  const extendedSamples: Hymn[] = [
    ...DEFAULT_OFFLINE_HYMNS,
    {
      id: 'kj-24',
      book: 'KJ',
      number: 24,
      title: 'Tritunggal, Allah Mahaagung',
      keySignature: 'Do = G (4/4)',
      verses: [
        { number: 1, text: 'Tritunggal, Allah Mahaagung, kami sembah sujud di hadapan-mu.\nEngkau Bapa, Putra, dan Roh Kudus, sumber hidup dan kasih kekal.' },
      ],
    },
    {
      id: 'kj-36',
      book: 'KJ',
      number: 36,
      title: 'Kepada Allah Pujian',
      keySignature: 'Do = F (3/4)',
      verses: [
        { number: 1, text: 'Kepada Allah pujian di sorga dan di bumi t’rus!\nBesarkan nama-Nya kudus, agungkan kasih-Nya tulus.' },
      ],
    },
    {
      id: 'nkb-15',
      book: 'NKB',
      number: 15,
      title: 'Menjulang Tinggi Langit Biru',
      keySignature: 'Do = C (4/4)',
      chorus: 'Yesus Tuhanku, Dialah Penebusku!\nKupuji nama-Nya selamanya.',
      verses: [
        { number: 1, text: 'Menjulang tinggi langit biru, megah ciptaan Tuhan Allahku;\nnamun kasih-Mu padaku jauh melebihi langit itu.' },
      ],
    },
    {
      id: 'pkj-15',
      book: 'PKJ',
      number: 15,
      title: 'Kusiapkan Hatiku, Tuhan',
      keySignature: 'Do = F (4/4)',
      chorus: 'Firman-Mu Tuhan, kuingin dengar,\nresap di hati kuduskan daku.',
      verses: [
        { number: 1, text: 'Kusiapkan hatiku, Tuhan, menyambut firman-Mu saat ini.\nAku sujud menyembah Dikau, tenangkan pikiran dan hatiku.' },
      ],
    },
    {
      id: 'dsl-25',
      book: 'DSL',
      number: 25,
      title: 'Bila Perang S’lesai',
      keySignature: 'Do = G (4/4)',
      verses: [
        { number: 1, text: 'Bila perang s’lesai dan tugas t’lah usai,\nkita kan menghadap Bapa di sorga mulia.' },
      ],
    },
  ];

  extendedSamples.forEach((h) => map.set(h.id, h));
  const merged = Array.from(map.values()).sort((a, b) => {
    if (a.book !== b.book) return a.book.localeCompare(b.book);
    return a.number - b.number;
  });

  await saveHymnsToDb(merged);
  return { count: merged.length };
}
