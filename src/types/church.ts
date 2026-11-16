export type UserRole = 'jemaat' | 'admin1' | 'admin2' | 'superuser';

export type PageRoute =
  | 'beranda'
  | 'tata-ibadah'
  | 'liturgi-unsur'
  | 'jadwal'
  | 'warta'
  | 'nyanyian'
  | 'alkitab'
  | 'layanan'
  | 'kotak-doa'
  | 'keuangan'
  | 'statistik'
  | 'profil'
  | 'tentang'
  | 'login'
  | 'dashboard';

export type HymnBook = 'KJ' | 'PKJ' | 'NKB' | 'DSL' | 'NR';

export type SektorName = 'Sektor Filadelfia' | 'Sektor Petra';
export type UnitName = 'Unit Rehoboth' | 'Unit Silo' | 'Unit Pniel' | 'Unit Siloam';
export type UnsurName = 'PAR' | 'PP' | 'PERWATA' | 'PERPRI' | 'LANSIA';

export interface AdminAccount {
  username: string;
  role: UserRole;
  displayName: string;
  title: string;
  password: string;
  permissionsSummary: string;
}

export interface ServiceSchedule {
  id: string;
  category: 'Ibadah Minggu' | 'Unsur' | 'Sektor/Unit';
  unsur?: UnsurName;
  sektor?: SektorName;
  unit?: UnitName;
  title: string;
  date: string;
  time: string;
  location: string;
  mapsQuery: string;
  leader: string;
  liturgos?: string;
  notes?: string;
}

export interface LiturgyHymnRef {
  book: HymnBook;
  number: number;
  title: string;
  versesToSing: string;
}

export interface LiturgyStep {
  id: string;
  order: number;
  section: string;
  instruction?: string;
  leaderText: string;
  congregationText?: string;
  hymnRef?: LiturgyHymnRef;
}

export interface SundayLiturgy {
  id: string;
  title: string;
  sundayName: string;
  date: string;
  theme: string;
  scriptureReading: string;
  preacher: string;
  liturgos: string;
  steps: LiturgyStep[];
}

export interface UnsurLiturgyModel {
  id: string;
  unsur: UnsurName;
  modelCode: string;
  title: string;
  subtitle: string;
  theme: string;
  occasionHint: string;
  steps: LiturgyStep[];
}

export interface WartaBirthday {
  name: string;
  date: string;
  unit: string;
}

export interface WartaPastoralNews {
  type: 'Sakit' | 'Duka' | 'Sukacita';
  name: string;
  detail: string;
}

export interface WartaItem {
  id: string;
  edition: string;
  title: string;
  date: string;
  summary: string;
  announcements: string[];
  birthdays: WartaBirthday[];
  pastoralNews: WartaPastoralNews[];
  allowPdfDownload: boolean;
  pdfUrl: string;
}

export interface HymnVerse {
  number: number;
  text: string;
}

export interface Hymn {
  id: string;
  book: HymnBook;
  number: number;
  title: string;
  keySignature?: string;
  verses: HymnVerse[];
  chorus?: string;
}

export interface BibleVerse {
  verse: number;
  text: string;
}

export interface BibleChapter {
  chapter: number;
  verses: BibleVerse[];
}

export interface BibleBook {
  id: string;
  name: string;
  testament: 'PL' | 'PB';
  chapters: BibleChapter[];
}

export interface FinanceEntry {
  id: string;
  date: string;
  description: string;
  category: 'Persembahan' | 'Aksi Pembangunan' | 'Diakonia' | 'Operasional';
  type: 'Pemasukan' | 'Pengeluaran';
  amount: number;
}

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  date: string;
  imageUrl: string;
}

export interface CongregationStatRow {
  id: string;
  sektor: string;
  unit: string;
  kk: number;
  jiwa: number;
  par: number;
  pp: number;
  perwata: number;
  perpri: number;
  lansia: number;
}

export interface BankAccountInfo {
  bank: string;
  accountNumber: string;
  accountName: string;
  purpose: string;
}

export interface ChurchProfile {
  name: string;
  synod: string;
  klasis: string;
  address: string;
  mapsQuery: string;
  whatsappSekretariat: string;
  email: string;
  history: string;
  vision: string;
  mission: string[];
  bankAccounts: BankAccountInfo[];
  logoDriveFolderId: string;
  logoUrl: string;
  weeklyVerse: {
    ref: string;
    text: string;
  };
  ministryTheme: string;
}

export interface WorkspaceSyncConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  masterHymnsSheetId: string;
  masterHymnsSheetUrl: string;
  externalStatsSheetId: string;
  externalStatsSheetName: string;
  driveFolderId: string;
  driveBackupFileId: string;
  autoSyncEnabled: boolean;
  lastSyncedAt: string | null;
}

export interface ServiceRequestLog {
  id: string;
  type: 'Pokok Doa' | 'Lapor Sakit' | 'Baptis/Sidi/Nikah';
  requesterName: string;
  phone: string;
  unit: string;
  detail: string;
  createdAt: string;
}

export type PrayerCategory =
  | 'Kesembuhan'
  | 'Keluarga & Rumah Tangga'
  | 'Pekerjaan & Usaha'
  | 'Pendidikan & Masa Depan'
  | 'Ucapan Syukur'
  | 'Pelayanan & Gereja'
  | 'Lainnya';

export type PrayerStatus = 'Menunggu' | 'Didoakan' | 'Selesai';

export interface PrayerRequest {
  id: string;
  requesterName: string;
  isAnonymous: boolean;
  phone: string;
  category: PrayerCategory;
  unit: string;
  prayerText: string;
  status: PrayerStatus;
  adminNote: string;
  handledBy: string;
  createdAt: string;
  updatedAt: string;
  source?: 'firestore' | 'local';
}

export type ActivityLogCategory =
  | 'Autentikasi'
  | 'Warta'
  | 'Jadwal'
  | 'Liturgi'
  | 'Nyanyian'
  | 'Galeri'
  | 'Keuangan'
  | 'Statistik'
  | 'Layanan'
  | 'Kotak Doa'
  | 'Akun'
  | 'Sinkronisasi';

export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  role: UserRole;
  category: ActivityLogCategory;
  action: string;
  detail: string;
}

export interface PortalDataState {
  profile: ChurchProfile;
  schedules: ServiceSchedule[];
  liturgy: SundayLiturgy;
  unsurLiturgies: UnsurLiturgyModel[];
  warta: WartaItem[];
  hymns: Hymn[];
  finance: FinanceEntry[];
  gallery: GalleryItem[];
  statistics: CongregationStatRow[];
  adminAccounts: AdminAccount[];
  syncConfig: WorkspaceSyncConfig;
  serviceRequests: ServiceRequestLog[];
  prayerRequests: PrayerRequest[];
  activityLogs: ActivityLogEntry[];
}
