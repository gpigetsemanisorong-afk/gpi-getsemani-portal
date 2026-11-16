import React, { useEffect, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Church,
  Clock,
  Cloud,
  Database,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  FileText,
  Heart,
  History,
  Image as ImageIcon,
  KeyRound,
  Layers,
  Lock,
  LogOut,
  MessageCircle,
  Music,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  Wallet,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useBibleDatabase } from '../hooks/useBibleDatabase';
import { usePrayerBox } from '../hooks/usePrayerBox';
import { PRAYER_CATEGORIES, PRAYER_STATUSES } from '../services/prayerBoxService';
import {
  ActivityLogCategory,
  FinanceEntry,
  Hymn,
  HymnBook,
  LiturgyStep,
  PrayerCategory,
  PrayerRequest,
  PrayerStatus,
  SektorName,
  ServiceSchedule,
  UnitName,
  UnsurLiturgyModel,
  UnsurName,
  WartaItem,
} from '../types/church';
import {
  extractSpreadsheetId,
  fetchSheetValues,
  fetchSpreadsheetMetadata,
  getWorkspaceAccessToken,
  listDriveFolderFiles,
  loadDatabaseFromDrive,
  parseCongregationStatsFromSheet,
  parseHymnsFromSheet,
} from '../services/googleWorkspace';

type AdminTab =
  | 'jadwal'
  | 'warta'
  | 'liturgi'
  | 'nyanyian'
  | 'galeri'
  | 'kotak-doa'
  | 'keuangan'
  | 'statistik'
  | 'akun'
  | 'workspace'
  | 'log';

export const AdminDashboardPage: React.FC = () => {
  const {
    data,
    updateData,
    resetDemoData,
    logActivity,
    clearActivityLogs,
    setRoute,
    currentUserRole,
    currentUsername,
    logoutAdmin,
    googleUser,
    isGoogleConnected,
    isSyncingWorkspace,
    workspaceNotice,
    clearWorkspaceNotice,
    connectGoogleWorkspace,
    disconnectGoogleWorkspace,
    syncNowToWorkspace,
    provisionChurchSpreadsheet,
    provisionMasterHymnSpreadsheet,
    pullFromMasterHymnSpreadsheet,
    pushToMasterHymnSpreadsheet,
    refreshLogoFromDrive,
  } = usePortal();

  const isSuperUser = currentUserRole === 'superuser';
  const [activeTab, setActiveTab] = useState<AdminTab>('warta');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [logSearch, setLogSearch] = useState('');
  const [logCategoryFilter, setLogCategoryFilter] = useState<'Semua' | ActivityLogCategory>('Semua');
  const [bibleSheetUrl, setBibleSheetUrl] = useState('');

  // Kotak Doa Management State
  const [prayerSearch, setPrayerSearch] = useState('');
  const [prayerStatusFilter, setPrayerStatusFilter] = useState<'Semua' | PrayerStatus>('Semua');
  const [prayerCategoryFilter, setPrayerCategoryFilter] = useState<'Semua' | PrayerCategory>('Semua');
  const [prayerNoteDrafts, setPrayerNoteDrafts] = useState<Record<string, string>>({});
  const [prayerStatusDrafts, setPrayerStatusDrafts] = useState<Record<string, PrayerStatus>>({});
  const [savingPrayerId, setSavingPrayerId] = useState<string | null>(null);

  const {
    firebaseUser,
    isFirebaseReadyForAdmin,
    isLoadingCloud: isLoadingPrayerCloud,
    cloudError: prayerCloudError,
    cloudCount: prayerCloudCount,
    allPrayers,
    updatePrayerStatusAndNote,
    deletePrayer,
  } = usePrayerBox(currentUserRole !== 'jemaat');

  const {
    dbStats: bibleDbStats,
    isDownloadingFull: isDownloadingBible,
    downloadProgress: bibleDownloadProgress,
    downloadFullOffline: downloadBibleOffline,
    importBibleFromGoogleSheet,
    resetBibleOfflineDb,
  } = useBibleDatabase();

  // Confirm Dialog state for mutating Workspace actions
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    destructive?: boolean;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    description: '',
    confirmLabel: 'Lanjutkan',
    onConfirm: () => {},
  });

  // Jadwal Form State
  const [schCat, setSchCat] = useState<ServiceSchedule['category']>('Ibadah Minggu');
  const [schTitle, setSchTitle] = useState('');
  const [schDate, setSchDate] = useState('Minggu, 22 November 2026');
  const [schTime, setSchTime] = useState('09.00 WIT');
  const [schLocation, setSchLocation] = useState('Gedung Gereja GPI Getsemani, Malanu');
  const [schLeader, setSchLeader] = useState('');
  const [schUnsur, setSchUnsur] = useState<UnsurName>('PAR');
  const [schSektor, setSchSektor] = useState<SektorName>('Sektor Filadelfia');
  const [schUnit, setSchUnit] = useState<UnitName>('Unit Rehoboth');

  // Warta Form State
  const [wartaTitle, setWartaTitle] = useState('');
  const [wartaEdition, setWartaEdition] = useState('Edisi 47 / Thn. 2026');
  const [wartaDate, setWartaDate] = useState('22 November 2026');
  const [wartaSummary, setWartaSummary] = useState('');
  const [wartaAnnouncementsText, setWartaAnnouncementsText] = useState('');
  const [wartaAllowPdf, setWartaAllowPdf] = useState(true);
  const [wartaPdfUrl, setWartaPdfUrl] = useState('');

  // Liturgi Form State
  const [litTitle, setLitTitle] = useState(data.liturgy.title);
  const [litSundayName, setLitSundayName] = useState(data.liturgy.sundayName);
  const [litTheme, setLitTheme] = useState(data.liturgy.theme);
  const [litDate, setLitDate] = useState(data.liturgy.date);
  const [litScripture, setLitScripture] = useState(data.liturgy.scriptureReading);
  const [litPreacher, setLitPreacher] = useState(data.liturgy.preacher);
  const [litLiturgos, setLitLiturgos] = useState(data.liturgy.liturgos);
  const [weeklyVerseRef, setWeeklyVerseRef] = useState(data.profile.weeklyVerse.ref);
  const [weeklyVerseText, setWeeklyVerseText] = useState(data.profile.weeklyVerse.text);
  const [litSteps, setLitSteps] = useState<LiturgyStep[]>(() =>
    data.liturgy.steps.slice().sort((a, b) => a.order - b.order)
  );

  // Liturgi Wadah Kategorial Editor State
  const [liturgiSubTab, setLiturgiSubTab] = useState<'minggu' | 'unsur'>('minggu');
  const [adminSelectedUnsur, setAdminSelectedUnsur] = useState<UnsurName>('PERPRI');
  const [editingUnsurModelId, setEditingUnsurModelId] = useState<string>(
    () => data.unsurLiturgies.find((m) => m.unsur === 'PERPRI')?.id || ''
  );
  const [unsurDraft, setUnsurDraft] = useState<UnsurLiturgyModel | null>(() => {
    const first = data.unsurLiturgies.find((m) => m.unsur === 'PERPRI');
    return first ? { ...first, steps: first.steps.map((s) => ({ ...s })) } : null;
  });

  // Galeri Form State
  const [galTitle, setGalTitle] = useState('');
  const [galCaption, setGalCaption] = useState('');
  const [galDate, setGalDate] = useState('November 2026');
  const [galImageUrl, setGalImageUrl] = useState(
    '/src/assets/images/gallery_ibadah_minggu_1794648269888.jpg'
  );

  // Keuangan Form State (Super User)
  const [finDate, setFinDate] = useState('2026-11-15');
  const [finDesc, setFinDesc] = useState('');
  const [finCat, setFinCat] = useState<FinanceEntry['category']>('Persembahan');
  const [finType, setFinType] = useState<FinanceEntry['type']>('Pemasukan');
  const [finAmount, setFinAmount] = useState('');

  // Password Reset State (Super User)
  const [newPassAdmin1, setNewPassAdmin1] = useState('');
  const [newPassAdmin2, setNewPassAdmin2] = useState('');

  // Google Sheets Import & Config State
  const [extSheetUrl, setExtSheetUrl] = useState(data.syncConfig.externalStatsSheetId || '');
  const [dbSheetIdInput, setDbSheetIdInput] = useState(data.syncConfig.spreadsheetId || '');
  const [driveFolderInput, setDriveFolderInput] = useState(data.profile.logoDriveFolderId);
  const [driveFilesList, setDriveFilesList] = useState<{ id: string; name: string; mimeType: string }[]>([]);

  // Nyanyian Rohani Management State
  const [editingHymnId, setEditingHymnId] = useState<string | null>(null);
  const [hymnBook, setHymnBook] = useState<HymnBook>('KJ');
  const [hymnNumber, setHymnNumber] = useState('');
  const [hymnTitle, setHymnTitle] = useState('');
  const [hymnKey, setHymnKey] = useState('');
  const [hymnVersesText, setHymnVersesText] = useState('');
  const [hymnChorus, setHymnChorus] = useState('');
  const [hymnSearchAdmin, setHymnSearchAdmin] = useState('');
  const [hymnSheetUrl, setHymnSheetUrl] = useState('');
  const [masterHymnsSheetIdInput, setMasterHymnsSheetIdInput] = useState(
    data.syncConfig.masterHymnsSheetId || ''
  );

  useEffect(() => {
    setMasterHymnsSheetIdInput(data.syncConfig.masterHymnsSheetId || '');
  }, [data.syncConfig.masterHymnsSheetId]);

  useEffect(() => {
    setDbSheetIdInput(data.syncConfig.spreadsheetId || '');
  }, [data.syncConfig.spreadsheetId]);

  const masterHymnsUrl =
    data.syncConfig.masterHymnsSheetUrl ||
    (data.syncConfig.masterHymnsSheetId
      ? `https://docs.google.com/spreadsheets/d/${data.syncConfig.masterHymnsSheetId}`
      : '');

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 4000);
  };

  if (currentUserRole === 'jemaat' || !currentUserRole) {
    return (
      <div className="mx-auto max-w-md rounded-3xl border border-stone-200 bg-white p-8 text-center dark:border-stone-800 dark:bg-stone-900 shadow-sm">
        <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">
          Anda belum masuk sebagai Majelis / Admin.
        </p>
        <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
          Dashboard ini khusus untuk pengurus Majelis Jemaat (Super User, Admin 1, atau Admin 2).
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setRoute('beranda')}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-stone-200 px-4 text-xs font-semibold text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 cursor-pointer"
          >
            Ke Beranda
          </button>
          <button
            type="button"
            onClick={logoutAdmin}
            className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#7F1D1D] px-4 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
          >
            Ganti Akun Admin
          </button>
        </div>
      </div>
    );
  }

  const tabs: {
    id: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    superOnly?: boolean;
  }[] = [
    { id: 'warta', label: 'Warta Jemaat', icon: FileText },
    { id: 'jadwal', label: 'Jadwal Ibadah', icon: CalendarDays },
    { id: 'liturgi', label: 'Tata Ibadah', icon: Church },
    { id: 'nyanyian', label: 'Kidung Pujian', icon: Music },
    { id: 'galeri', label: 'Galeri', icon: ImageIcon },
    { id: 'kotak-doa', label: 'Kotak Doa', icon: Heart },
    { id: 'keuangan', label: 'Keuangan', icon: Wallet, superOnly: true },
    { id: 'statistik', label: 'Data & Statistik', icon: BarChart3, superOnly: true },
    { id: 'akun', label: 'Akun Admin', icon: KeyRound, superOnly: true },
    { id: 'workspace', label: 'Drive & Sheets', icon: Cloud, superOnly: true },
    { id: 'log', label: 'Log Aktivitas', icon: History },
  ];

  const pendingPrayerCount = allPrayers.filter((p) => p.status === 'Menunggu').length;
  const allowedTabs = tabs.filter((t) => !t.superOnly || isSuperUser);
  const currentAccount = data.adminAccounts.find((a) => a.username === currentUsername);

  // Handlers
  const handleAddSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schTitle.trim() || !schLeader.trim()) return;
    const newSch: ServiceSchedule = {
      id: `sch-${Date.now()}`,
      category: schCat,
      title: schTitle.trim(),
      date: schDate.trim(),
      time: schTime.trim(),
      location: schLocation.trim(),
      mapsQuery: schLocation.trim(),
      leader: schLeader.trim(),
      unsur: schCat === 'Unsur' ? schUnsur : undefined,
      sektor: schCat === 'Sektor/Unit' ? schSektor : undefined,
      unit: schCat === 'Sektor/Unit' ? schUnit : undefined,
    };
    updateData((prev) => ({ ...prev, schedules: [newSch, ...prev.schedules] }));
    logActivity({
      category: 'Jadwal',
      action: 'Tambah Jadwal Ibadah',
      detail: `${newSch.category}: ${newSch.title} (${newSch.date}, ${newSch.time})`,
    });
    setSchTitle('');
    setSchLeader('');
    showToast('Jadwal ibadah berhasil ditambahkan dan langsung tampil di halaman Jemaat.');
  };

  const handleDeleteSchedule = (id: string) => {
    const target = data.schedules.find((s) => s.id === id);
    updateData((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((s) => s.id !== id),
    }));
    logActivity({
      category: 'Jadwal',
      action: 'Hapus Jadwal Ibadah',
      detail: target ? `${target.title} (${target.date})` : `Jadwal ID ${id}`,
    });
    showToast('Jadwal ibadah dihapus.');
  };

  const handleAddWarta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wartaTitle.trim()) return;
    const announcements = wartaAnnouncementsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const newWarta: WartaItem = {
      id: `warta-${Date.now()}`,
      edition: wartaEdition.trim(),
      title: wartaTitle.trim(),
      date: wartaDate.trim(),
      summary: wartaSummary.trim() || 'Warta pelayanan minggu berjalan GPI Getsemani Sorong.',
      announcements: announcements.length ? announcements : ['Ibadah berjalan sesuai jadwal.'],
      birthdays: [],
      pastoralNews: [],
      allowPdfDownload: wartaAllowPdf,
      pdfUrl: wartaPdfUrl.trim(),
    };
    updateData((prev) => ({ ...prev, warta: [newWarta, ...prev.warta] }));
    logActivity({
      category: 'Warta',
      action: 'Terbitkan Warta Jemaat',
      detail: `${newWarta.edition} — ${newWarta.title}`,
    });
    setWartaTitle('');
    setWartaSummary('');
    setWartaAnnouncementsText('');
    setWartaPdfUrl('');
    showToast('Warta Jemaat baru berhasil diterbitkan.');
  };

  const handleToggleWartaPdf = (id: string) => {
    const target = data.warta.find((w) => w.id === id);
    updateData((prev) => ({
      ...prev,
      warta: prev.warta.map((w) =>
        w.id === id ? { ...w, allowPdfDownload: !w.allowPdfDownload } : w
      ),
    }));
    if (target) {
      logActivity({
        category: 'Warta',
        action: 'Ubah Izin Unduh PDF Warta',
        detail: `${target.title}: ${!target.allowPdfDownload ? 'Diizinkan' : 'Dinonaktifkan'}`,
      });
    }
  };

  const handleUpdateWartaPdfUrl = (id: string, url: string) => {
    updateData((prev) => ({
      ...prev,
      warta: prev.warta.map((w) => (w.id === id ? { ...w, pdfUrl: url } : w)),
    }));
  };

  const handleDeleteWarta = (id: string) => {
    const target = data.warta.find((w) => w.id === id);
    updateData((prev) => ({
      ...prev,
      warta: prev.warta.filter((w) => w.id !== id),
    }));
    logActivity({
      category: 'Warta',
      action: 'Hapus Warta Jemaat',
      detail: target ? `${target.edition} — ${target.title}` : `Warta ID ${id}`,
    });
    showToast('Warta Jemaat dihapus.');
  };

  const handleSaveLiturgy = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedSteps = litSteps.map((st, idx) => ({ ...st, order: idx + 1 }));
    setLitSteps(normalizedSteps);
    updateData((prev) => ({
      ...prev,
      liturgy: {
        ...prev.liturgy,
        title: litTitle.trim() || prev.liturgy.title,
        sundayName: litSundayName.trim() || prev.liturgy.sundayName,
        theme: litTheme.trim(),
        date: litDate.trim(),
        scriptureReading: litScripture.trim(),
        preacher: litPreacher.trim(),
        liturgos: litLiturgos.trim(),
        steps: normalizedSteps,
      },
      profile: {
        ...prev.profile,
        weeklyVerse: {
          ref: weeklyVerseRef.trim(),
          text: weeklyVerseText.trim(),
        },
      },
    }));
    logActivity({
      category: 'Liturgi',
      action: 'Perbarui Tata Ibadah Minggu',
      detail: `${litSundayName.trim() || data.liturgy.sundayName} (${litDate.trim()}) · ${normalizedSteps.length} bagian liturgi`,
    });
    showToast('Tata Ibadah Minggu, urutan liturgi & Ayat Minggu Ini diperbarui.');
  };

  const handleUpdateStep = (stepId: string, patch: Partial<LiturgyStep>) => {
    setLitSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, ...patch } : s))
    );
  };

  const handleAddLiturgyStep = () => {
    setLitSteps((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}`,
        order: prev.length + 1,
        section: 'Bagian Liturgi Baru',
        instruction: '',
        leaderText: '',
        congregationText: '',
      },
    ]);
  };

  const handleRemoveLiturgyStep = (stepId: string) => {
    setLitSteps((prev) =>
      prev.filter((s) => s.id !== stepId).map((s, idx) => ({ ...s, order: idx + 1 }))
    );
  };

  const handleMoveLiturgyStep = (index: number, direction: -1 | 1) => {
    setLitSteps((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next.map((s, idx) => ({ ...s, order: idx + 1 }));
    });
  };

  const selectUnsurForEdit = (unsur: UnsurName) => {
    setAdminSelectedUnsur(unsur);
    const first = data.unsurLiturgies.find((m) => m.unsur === unsur);
    if (first) {
      setEditingUnsurModelId(first.id);
      setUnsurDraft({ ...first, steps: first.steps.map((s) => ({ ...s })) });
    } else {
      setEditingUnsurModelId('');
      setUnsurDraft(null);
    }
  };

  const selectUnsurModelForEdit = (model: UnsurLiturgyModel) => {
    setEditingUnsurModelId(model.id);
    setUnsurDraft({ ...model, steps: model.steps.map((s) => ({ ...s })) });
  };

  const handleCreateNewUnsurModel = () => {
    const countForUnsur = data.unsurLiturgies.filter((m) => m.unsur === adminSelectedUnsur).length;
    const nextLetter = String.fromCharCode(65 + Math.min(25, countForUnsur));
    const newModel: UnsurLiturgyModel = {
      id: `lit-${adminSelectedUnsur.toLowerCase()}-${Date.now()}`,
      unsur: adminSelectedUnsur,
      modelCode: `Model ${nextLetter}`,
      title: `Tata Ibadah ${adminSelectedUnsur} — Model ${nextLetter}`,
      subtitle: `Liturgi Ibadah ${adminSelectedUnsur}`,
      theme: 'Bertumbuh dalam Persekutuan Kristus',
      occasionHint: `Digunakan untuk ibadah ${adminSelectedUnsur}.`,
      steps: [
        {
          id: `step-${Date.now()}-1`,
          order: 1,
          section: 'Pujian Pembuka & Votum',
          instruction: 'Peserta berdiri menyanyikan lagu pembuka.',
          leaderText: 'Ibadah ini berlangsung dalam nama Bapa, Putra, dan Roh Kudus.',
          congregationText: 'Amin.',
        },
        {
          id: `step-${Date.now()}-2`,
          order: 2,
          section: 'Pembacaan Firman, Doa Syafaat & Berkat',
          leaderText: 'Tuhan memberkati dan memelihara saudara sekalian.',
          congregationText: 'Amin.',
        },
      ],
    };
    updateData((prev) => ({
      ...prev,
      unsurLiturgies: [...prev.unsurLiturgies, newModel],
    }));
    logActivity({
      category: 'Liturgi',
      action: 'Tambah Model Liturgi Unsur',
      detail: `${newModel.unsur} — ${newModel.modelCode}: ${newModel.title}`,
    });
    setEditingUnsurModelId(newModel.id);
    setUnsurDraft(newModel);
    showToast(`${newModel.modelCode} untuk ${adminSelectedUnsur} berhasil dibuat.`);
  };

  const handleSaveUnsurModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unsurDraft) return;
    const normalized: UnsurLiturgyModel = {
      ...unsurDraft,
      steps: unsurDraft.steps.map((s, idx) => ({ ...s, order: idx + 1 })),
    };
    updateData((prev) => ({
      ...prev,
      unsurLiturgies: prev.unsurLiturgies.map((m) =>
        m.id === normalized.id ? normalized : m
      ),
    }));
    logActivity({
      category: 'Liturgi',
      action: 'Simpan Liturgi Unsur',
      detail: `${normalized.unsur} (${normalized.modelCode}) — ${normalized.title}`,
    });
    setUnsurDraft(normalized);
    showToast(
      `Liturgi ${normalized.unsur} (${normalized.modelCode}) berhasil disimpan.`
    );
  };

  const handleDeleteUnsurModel = (id: string) => {
    const target = data.unsurLiturgies.find((m) => m.id === id);
    const remaining = data.unsurLiturgies.filter((m) => m.id !== id);
    updateData((prev) => ({ ...prev, unsurLiturgies: remaining }));
    logActivity({
      category: 'Liturgi',
      action: 'Hapus Model Liturgi Unsur',
      detail: target ? `${target.unsur} (${target.modelCode}) — ${target.title}` : `ID ${id}`,
    });
    const nextForUnsur = remaining.find((m) => m.unsur === adminSelectedUnsur) || null;
    setEditingUnsurModelId(nextForUnsur?.id || '');
    setUnsurDraft(
      nextForUnsur ? { ...nextForUnsur, steps: nextForUnsur.steps.map((s) => ({ ...s })) } : null
    );
    showToast('Model liturgi unsur dihapus.');
  };

  const handleAddGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!galTitle.trim()) return;
    const titleVal = galTitle.trim();
    updateData((prev) => ({
      ...prev,
      gallery: [
        {
          id: `gal-${Date.now()}`,
          title: titleVal,
          caption: galCaption.trim(),
          date: galDate.trim(),
          imageUrl: galImageUrl.trim(),
        },
        ...prev.gallery,
      ],
    }));
    logActivity({
      category: 'Galeri',
      action: 'Tambah Dokumentasi Galeri',
      detail: `${titleVal} (${galDate.trim()})`,
    });
    setGalTitle('');
    setGalCaption('');
    showToast('Foto galeri berhasil ditambahkan.');
  };

  const handleSaveHymn = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(hymnNumber, 10);
    if (!hymnTitle.trim() || !num || num <= 0) {
      showToast('Isi nomor dan judul nyanyian dengan benar.');
      return;
    }

    const parsedVerses = hymnVersesText
      .split(/\n\s*\n/)
      .map((chunk, idx) => ({
        number: idx + 1,
        text: chunk.replace(/^\d+\.\s*/, '').trim(),
      }))
      .filter((v) => v.text.length > 0);

    const newHymn: Hymn = {
      id: editingHymnId || `${hymnBook.toLowerCase()}-${num}-${Date.now()}`,
      book: hymnBook,
      number: num,
      title: hymnTitle.trim(),
      keySignature: hymnKey.trim() || undefined,
      verses: parsedVerses.length ? parsedVerses : [{ number: 1, text: '(Lirik belum diisi)' }],
      chorus: hymnChorus.trim() || undefined,
    };

    const isUpdate = Boolean(editingHymnId);
    updateData((prev) => {
      const exists = prev.hymns.some((h) => h.id === newHymn.id);
      const nextHymns = exists
        ? prev.hymns.map((h) => (h.id === newHymn.id ? newHymn : h))
        : [...prev.hymns, newHymn];
      nextHymns.sort((a, b) => a.book.localeCompare(b.book) || a.number - b.number);
      return { ...prev, hymns: nextHymns };
    });
    logActivity({
      category: 'Nyanyian',
      action: isUpdate ? 'Edit Lagu Rohani' : 'Tambah Lagu Rohani',
      detail: `${newHymn.book} No. ${newHymn.number} — ${newHymn.title}`,
    });

    setEditingHymnId(null);
    setHymnNumber('');
    setHymnTitle('');
    setHymnKey('');
    setHymnVersesText('');
    setHymnChorus('');
    showToast(`Lagu ${hymnBook} No. ${num} berhasil disimpan ke database.`);
  };

  const handleEditHymnStart = (h: Hymn) => {
    setEditingHymnId(h.id);
    setHymnBook(h.book);
    setHymnNumber(String(h.number));
    setHymnTitle(h.title);
    setHymnKey(h.keySignature || '');
    setHymnVersesText(h.verses.map((v) => `${v.number}. ${v.text}`).join('\n\n'));
    setHymnChorus(h.chorus || '');
  };

  const handleImportHymnsFromSheet = async () => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      showToast('Masuk dengan akun Google terlebih dahulu (tab Drive & Sheets).');
      return;
    }
    if (!hymnSheetUrl.trim()) {
      showToast('Tempelkan URL atau ID Google Spreadsheet daftar lagu.');
      return;
    }
    try {
      const meta = await fetchSpreadsheetMetadata(hymnSheetUrl, token);
      const hymnTab =
        meta.sheets.find((s) => s.title.toLowerCase().includes('nyanyian'))?.title ||
        meta.sheets[0]?.title;
      if (!hymnTab) {
        showToast('Tab sheet lagu tidak ditemukan.');
        return;
      }
      const rows = await fetchSheetValues(meta.spreadsheetId, hymnTab, token);
      const imported = parseHymnsFromSheet(rows);
      if (imported.length === 0) {
        showToast('Tidak ada lagu yang terbaca. Pastikan baris pertama berisi header kolom.');
        return;
      }
      setConfirmAction({
        open: true,
        title: 'Impor Lagu dari Google Sheets?',
        description: `Ditemukan ${imported.length} lagu dari tab "${hymnTab}" (${meta.title}). Lagu baru akan digabungkan ke database Kidung Pujian aplikasi.`,
        confirmLabel: 'Gabungkan ke Database',
        onConfirm: () => {
          updateData((prev) => {
            const byKey = new Map<string, Hymn>();
            prev.hymns.forEach((h) => byKey.set(`${h.book}-${h.number}`, h));
            imported.forEach((h) => byKey.set(`${h.book}-${h.number}`, h));
            const merged = Array.from(byKey.values()).sort(
              (a, b) => a.book.localeCompare(b.book) || a.number - b.number
            );
            return { ...prev, hymns: merged };
          });
          logActivity({
            category: 'Nyanyian',
            action: 'Impor Massal Lagu dari Google Sheets',
            detail: `${imported.length} lagu diimpor dari "${meta.title}" (tab "${hymnTab}").`,
          });
          setConfirmAction((prev) => ({ ...prev, open: false }));
          showToast(`${imported.length} lagu berhasil diimpor dari Google Sheets.`);
        },
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal mengimpor lagu dari Google Sheets.');
    }
  };

  const handleUploadHymnsJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result || '');
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : parsed.hymns;
        if (!Array.isArray(list) || list.length === 0) {
          showToast('Format JSON harus berupa array lagu atau objek dengan properti "hymns".');
          return;
        }
        const validBooks = new Set<HymnBook>(['KJ', 'PKJ', 'NKB', 'DSL', 'NR']);
        const normalized: Hymn[] = list.map((item: Partial<Hymn>, idx: number) => {
          const book = validBooks.has(item.book as HymnBook) ? (item.book as HymnBook) : 'KJ';
          const number = Number(item.number) || idx + 1;
          return {
            id: item.id || `${book.toLowerCase()}-${number}-${Date.now()}-${idx}`,
            book,
            number,
            title: String(item.title || `${book} No. ${number}`),
            keySignature: item.keySignature,
            verses: Array.isArray(item.verses) && item.verses.length
              ? item.verses
              : [{ number: 1, text: '(Lirik belum diisi)' }],
            chorus: item.chorus,
          };
        });
        updateData((prev) => {
          const byKey = new Map<string, Hymn>();
          prev.hymns.forEach((h) => byKey.set(`${h.book}-${h.number}`, h));
          normalized.forEach((h) => byKey.set(`${h.book}-${h.number}`, h));
          return {
            ...prev,
            hymns: Array.from(byKey.values()).sort(
              (a, b) => a.book.localeCompare(b.book) || a.number - b.number
            ),
          };
        });
        logActivity({
          category: 'Nyanyian',
          action: 'Impor Massal Lagu dari File JSON',
          detail: `${normalized.length} lagu diimpor dari berkas "${file.name}".`,
        });
        showToast(`${normalized.length} lagu berhasil diimpor dari file JSON.`);
      } catch {
        showToast('Gagal membaca file JSON. Pastikan format JSON valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAddFinance = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(finAmount.replace(/[^\d]/g, ''));
    if (!finDesc.trim() || !amt) return;
    const desc = finDesc.trim();
    updateData((prev) => ({
      ...prev,
      finance: [
        {
          id: `fin-${Date.now()}`,
          date: finDate,
          description: desc,
          category: finCat,
          type: finType,
          amount: amt,
        },
        ...prev.finance,
      ],
    }));
    logActivity({
      category: 'Keuangan',
      action: `Catat ${finType} Keuangan`,
      detail: `${finCat} — ${desc} (Rp ${amt.toLocaleString('id-ID')})`,
    });
    setFinDesc('');
    setFinAmount('');
    showToast('Transaksi keuangan berhasil dicatat.');
  };

  const handleResetAdminPassword = (targetUsername: 'admin1' | 'admin2', newPassword: string) => {
    if (newPassword.trim().length < 4) {
      showToast('Kata sandi minimal 4 karakter.');
      return;
    }
    updateData((prev) => ({
      ...prev,
      adminAccounts: prev.adminAccounts.map((acc) =>
        acc.username === targetUsername ? { ...acc, password: newPassword.trim() } : acc
      ),
    }));
    logActivity({
      category: 'Akun',
      action: 'Reset Sandi Akun Admin',
      detail: `Kata sandi untuk akun "${targetUsername}" diperbarui.`,
    });
    if (targetUsername === 'admin1') setNewPassAdmin1('');
    if (targetUsername === 'admin2') setNewPassAdmin2('');
    showToast(`Kata sandi akun ${targetUsername} berhasil diatur ulang.`);
  };

  const handleImportExternalStats = async () => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      showToast('Hubungkan akun Google terlebih dahulu pada tab Drive & Sheets.');
      return;
    }
    if (!extSheetUrl.trim()) return;
    try {
      const meta = await fetchSpreadsheetMetadata(extSheetUrl, token);
      const firstTab = meta.sheets[0]?.title;
      if (!firstTab) {
        showToast('Spreadsheet tidak memiliki tab lembar kerja.');
        return;
      }
      const rows = await fetchSheetValues(meta.spreadsheetId, firstTab, token);
      const parsed = parseCongregationStatsFromSheet(rows);
      if (parsed.length === 0) {
        showToast('Tidak ada baris data statistik yang terbaca.');
        return;
      }
      setConfirmAction({
        open: true,
        title: 'Impor Statistik dari Google Sheets?',
        description: `Ditemukan ${parsed.length} unit dari spreadsheet "${meta.title}" (tab "${firstTab}"). Data statistik jemaat di portal akan diganti dengan data ini.`,
        confirmLabel: 'Impor & Simpan',
        onConfirm: () => {
          updateData((prev) => ({
            ...prev,
            statistics: parsed,
            syncConfig: {
              ...prev.syncConfig,
              externalStatsSheetId: meta.spreadsheetId,
              externalStatsSheetName: firstTab,
            },
          }));
          logActivity({
            category: 'Statistik',
            action: 'Impor Statistik Jemaat (Dashboard)',
            detail: `${parsed.length} unit diimpor dari "${meta.title}" (tab "${firstTab}").`,
          });
          setConfirmAction((prev) => ({ ...prev, open: false }));
          showToast('Data Statistik berhasil diimpor dari Google Sheets.');
        },
      });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal membaca Google Sheets.');
    }
  };

  const handleInspectDriveFolder = async () => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      showToast('Silakan masuk dengan Google terlebih dahulu.');
      return;
    }
    try {
      const files = await listDriveFolderFiles(driveFolderInput, token);
      setDriveFilesList(files);
      updateData((prev) => ({
        ...prev,
        profile: { ...prev.profile, logoDriveFolderId: driveFolderInput.trim() },
        syncConfig: { ...prev.syncConfig, driveFolderId: driveFolderInput.trim() },
      }));
      logActivity({
        category: 'Sinkronisasi',
        action: 'Periksa Folder Google Drive',
        detail: `Folder ${driveFolderInput.trim()} diperiksa (${files.length} berkas ditemukan).`,
      });
      showToast(`Ditemukan ${files.length} berkas di folder Google Drive.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal membuka folder Google Drive.');
    }
  };

  const handleRestoreFromDriveFile = (fileId: string, fileName: string) => {
    const token = getWorkspaceAccessToken();
    if (!token) return;
    setConfirmAction({
      open: true,
      title: 'Muat Data dari Google Drive?',
      description: `Data lokal portal saat ini akan ditimpa menggunakan berkas cadangan "${fileName}" dari Google Drive.`,
      confirmLabel: 'Muat Cadangan',
      destructive: true,
      onConfirm: async () => {
        setConfirmAction((prev) => ({ ...prev, open: false }));
        try {
          const restored = await loadDatabaseFromDrive(fileId, token);
          updateData((prev) => ({ ...prev, ...restored }));
          logActivity({
            category: 'Sinkronisasi',
            action: 'Pulihkan Cadangan dari Google Drive',
            detail: `Data portal dipulihkan dari berkas "${fileName}".`,
          });
          showToast('Data portal berhasil dipulihkan dari Google Drive.');
        } catch (err) {
          showToast(err instanceof Error ? err.message : 'Gagal memulihkan data.');
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Dashboard Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900 sm:px-6">
        <div>
          <p className="text-xs font-semibold text-[#7F1D1D] dark:text-amber-400">
            Dashboard Pengurus · {currentAccount?.title || currentUsername}
          </p>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
            Panel Manajemen GPI Getsemani Sorong
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRoute('beranda')}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100 cursor-pointer"
          >
            <Eye className="h-4 w-4" />
            <span>Lihat Tampilan Jemaat</span>
          </button>

          <button
            type="button"
            onClick={logoutAdmin}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#7F1D1D] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </div>

      {/* Feedback & Sync Banner */}
      {(feedback || workspaceNotice) && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>{feedback || workspaceNotice}</span>
          </div>
          {workspaceNotice && (
            <button
              type="button"
              onClick={clearWorkspaceNotice}
              className="text-xs font-semibold underline cursor-pointer"
            >
              Tutup
            </button>
          )}
        </div>
      )}

      {/* Responsive Sidebar (Desktop) + Top Tabs (Mobile/Tablet) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr] lg:items-start">
        <aside className="rounded-2xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900 lg:sticky lg:top-20">
          <nav className="flex gap-1.5 overflow-x-auto lg:flex-col">
            {allowedTabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex min-h-[42px] items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#7F1D1D] text-white dark:bg-amber-500 dark:text-stone-950'
                      : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{tab.label}</span>
                  {tab.id === 'kotak-doa' && pendingPrayerCount > 0 && (
                    <span
                      className={`font-tabular rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                        active
                          ? 'bg-white/20 text-white dark:bg-stone-950/20 dark:text-stone-950'
                          : 'bg-[#7F1D1D]/15 text-[#7F1D1D] dark:bg-amber-500/20 dark:text-amber-300'
                      }`}
                    >
                      {pendingPrayerCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Admin Workspace */}
        <section className="space-y-6">
          {/* TAB 1: WARTA JEMAAT */}
          {activeTab === 'warta' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddWarta}
                className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
              >
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Terbitkan Warta Jemaat Baru
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={wartaTitle}
                    onChange={(e) => setWartaTitle(e.target.value)}
                    placeholder="Judul Warta Minggu..."
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800 sm:col-span-2"
                  />
                  <input
                    type="text"
                    value={wartaEdition}
                    onChange={(e) => setWartaEdition(e.target.value)}
                    placeholder="Edisi 47 / Thn. 2026"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    value={wartaDate}
                    onChange={(e) => setWartaDate(e.target.value)}
                    placeholder="Tanggal terbit"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                  <input
                    type="url"
                    value={wartaPdfUrl}
                    onChange={(e) => setWartaPdfUrl(e.target.value)}
                    placeholder="Tautan PDF / Google Drive (opsional)"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                </div>
                <input
                  type="text"
                  value={wartaSummary}
                  onChange={(e) => setWartaSummary(e.target.value)}
                  placeholder="Ringkasan singkat warta..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                />
                <textarea
                  rows={3}
                  value={wartaAnnouncementsText}
                  onChange={(e) => setWartaAnnouncementsText(e.target.value)}
                  placeholder="Daftar pengumuman (pisahkan tiap poin dengan baris baru)..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={wartaAllowPdf}
                      onChange={(e) => setWartaAllowPdf(e.target.checked)}
                      className="h-4 w-4 accent-[#7F1D1D]"
                    />
                    <span>Izinkan Jemaat Download PDF</span>
                  </label>
                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Simpan Warta</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3">
                {data.warta.map((w) => (
                  <div
                    key={w.id}
                    className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                          {w.edition} · {w.date}
                        </p>
                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {w.title}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteWarta(w.id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                        title="Hapus Warta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3 flex flex-col gap-3 border-t border-stone-100 pt-3 dark:border-stone-800 sm:flex-row sm:items-center">
                      <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={w.allowPdfDownload}
                          onChange={() => handleToggleWartaPdf(w.id)}
                          className="h-4 w-4 accent-[#7F1D1D]"
                        />
                        <span>Izinkan Jemaat Download PDF</span>
                      </label>
                      <input
                        type="url"
                        value={w.pdfUrl}
                        onChange={(e) => handleUpdateWartaPdfUrl(w.id, e.target.value)}
                        placeholder="URL PDF / Google Drive..."
                        className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-800"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: JADWAL IBADAH */}
          {activeTab === 'jadwal' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddSchedule}
                className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
              >
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Tambah Jadwal Ibadah Baru
                </h2>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <select
                    value={schCat}
                    onChange={(e) => setSchCat(e.target.value as ServiceSchedule['category'])}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  >
                    <option value="Ibadah Minggu">Ibadah Minggu</option>
                    <option value="Unsur">Unsur</option>
                    <option value="Sektor/Unit">Sektor/Unit</option>
                  </select>

                  {schCat === 'Unsur' && (
                    <select
                      value={schUnsur}
                      onChange={(e) => setSchUnsur(e.target.value as UnsurName)}
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                    >
                      {(['PAR', 'PP', 'PERWATA', 'PERPRI', 'LANSIA'] as UnsurName[]).map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  )}

                  {schCat === 'Sektor/Unit' && (
                    <>
                      <select
                        value={schSektor}
                        onChange={(e) => {
                          const s = e.target.value as SektorName;
                          setSchSektor(s);
                          setSchUnit(s === 'Sektor Filadelfia' ? 'Unit Rehoboth' : 'Unit Pniel');
                        }}
                        className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                      >
                        <option value="Sektor Filadelfia">Sektor Filadelfia</option>
                        <option value="Sektor Petra">Sektor Petra</option>
                      </select>
                      <select
                        value={schUnit}
                        onChange={(e) => setSchUnit(e.target.value as UnitName)}
                        className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                      >
                        {(schSektor === 'Sektor Filadelfia'
                          ? ['Unit Rehoboth', 'Unit Silo']
                          : ['Unit Pniel', 'Unit Siloam']
                        ).map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    value={schTitle}
                    onChange={(e) => setSchTitle(e.target.value)}
                    placeholder="Nama / Judul Ibadah"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                  <input
                    type="text"
                    required
                    value={schLeader}
                    onChange={(e) => setSchLeader(e.target.value)}
                    placeholder="Pelayan Firman / Pemimpin"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                  <input
                    type="text"
                    value={schDate}
                    onChange={(e) => setSchDate(e.target.value)}
                    placeholder="Hari, Tanggal"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                  <input
                    type="text"
                    value={schTime}
                    onChange={(e) => setSchTime(e.target.value)}
                    placeholder="Waktu (mis. 18.30 WIT)"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={schLocation}
                    onChange={(e) => setSchLocation(e.target.value)}
                    placeholder="Lokasi / Alamat di Sorong"
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Jadwal</span>
                  </button>
                </div>
              </form>

              <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
                {data.schedules.map((sch) => (
                  <div key={sch.id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                        {sch.category} {sch.unit ? `· ${sch.unit}` : sch.unsur ? `· ${sch.unsur}` : ''}
                      </p>
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {sch.title}
                      </p>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        {sch.date} · {sch.time} · {sch.leader}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteSchedule(sch.id)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      title="Hapus Jadwal"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TATA IBADAH MINGGU & LITURGI WADAH KATEGORIAL */}
          {activeTab === 'liturgi' && (
            <div className="space-y-6">
              <div className="flex flex-wrap gap-2 rounded-2xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-900">
                <button
                  type="button"
                  onClick={() => setLiturgiSubTab('minggu')}
                  className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    liturgiSubTab === 'minggu'
                      ? 'bg-[#7F1D1D] text-white dark:bg-amber-500 dark:text-stone-950'
                      : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
                  }`}
                >
                  <Church className="h-4 w-4" />
                  <span>Tata Ibadah Minggu Jemaat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLiturgiSubTab('unsur')}
                  className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    liturgiSubTab === 'unsur'
                      ? 'bg-[#7F1D1D] text-white dark:bg-amber-500 dark:text-stone-950'
                      : 'text-stone-700 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Liturgi Wadah Kategorial (Model A–D)</span>
                </button>
              </div>

              {liturgiSubTab === 'minggu' && (
                <form onSubmit={handleSaveLiturgy} className="space-y-6">
              <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    Informasi Utama Tata Ibadah Minggu & Ayat Minggu Ini
                  </h2>
                  <button
                    type="submit"
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
                  >
                    <span>Simpan Semua Perubahan</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                      Judul Tata Ibadah
                    </label>
                    <input
                      type="text"
                      value={litTitle}
                      onChange={(e) => setLitTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                      Nama Minggu Gerejawi
                    </label>
                    <input
                      type="text"
                      value={litSundayName}
                      onChange={(e) => setLitSundayName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                      Tanggal Minggu
                    </label>
                    <input
                      type="text"
                      value={litDate}
                      onChange={(e) => setLitDate(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                      Bacaan Alkitab
                    </label>
                    <input
                      type="text"
                      value={litScripture}
                      onChange={(e) => setLitScripture(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                      Pelayan Firman
                    </label>
                    <input
                      type="text"
                      value={litPreacher}
                      onChange={(e) => setLitPreacher(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                      Liturgos
                    </label>
                    <input
                      type="text"
                      value={litLiturgos}
                      onChange={(e) => setLitLiturgos(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                    Tema Ibadah Minggu
                  </label>
                  <input
                    type="text"
                    value={litTheme}
                    onChange={(e) => setLitTheme(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                </div>

                <div className="border-t border-stone-100 pt-4 dark:border-stone-800">
                  <p className="text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                    Ayat Minggu Ini (Tampil di Banner Beranda)
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      value={weeklyVerseRef}
                      onChange={(e) => setWeeklyVerseRef(e.target.value)}
                      placeholder="Referensi Ayat"
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                    />
                    <input
                      type="text"
                      value={weeklyVerseText}
                      onChange={(e) => setWeeklyVerseText(e.target.value)}
                      placeholder="Teks Ayat..."
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800 sm:col-span-2"
                    />
                  </div>
                </div>
              </div>

              {/* Editor Urutan Liturgi Langkah Demi Langkah */}
              <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
                      Urutan Langkah Liturgi & Nyanyian Terintegrasi
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400">
                      Ubah urutan, teks Pelayan/Jemaat, petunjuk berdiri/duduk, atau kaitkan nyanyian dari KJ/PKJ/NKB/DSL/NR.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddLiturgyStep}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Bagian Liturgi</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {litSteps.map((step, idx) => (
                    <div
                      key={step.id}
                      className="space-y-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-800/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-tabular text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                          Bagian {String(idx + 1).padStart(2, '0')}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveLiturgyStep(idx, -1)}
                            disabled={idx === 0}
                            className="rounded-lg p-1.5 text-stone-600 hover:bg-white disabled:opacity-30 dark:text-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                            title="Pindah ke atas"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveLiturgyStep(idx, 1)}
                            disabled={idx === litSteps.length - 1}
                            className="rounded-lg p-1.5 text-stone-600 hover:bg-white disabled:opacity-30 dark:text-stone-300 dark:hover:bg-stone-700 cursor-pointer"
                            title="Pindah ke bawah"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveLiturgyStep(step.id)}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                            title="Hapus bagian ini"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={step.section}
                          onChange={(e) => handleUpdateStep(step.id, { section: e.target.value })}
                          placeholder="Judul Bagian (mis. Votum dan Salam)"
                          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-semibold dark:border-stone-700 dark:bg-stone-900"
                        />
                        <input
                          type="text"
                          value={step.instruction || ''}
                          onChange={(e) => handleUpdateStep(step.id, { instruction: e.target.value })}
                          placeholder="Petunjuk (mis. Jemaat berdiri...)"
                          className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={step.leaderText}
                        onChange={(e) => handleUpdateStep(step.id, { leaderText: e.target.value })}
                        placeholder="Teks Pelayan / Pemimpin Ibadah..."
                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
                      />

                      <textarea
                        rows={2}
                        value={step.congregationText || ''}
                        onChange={(e) =>
                          handleUpdateStep(step.id, { congregationText: e.target.value })
                        }
                        placeholder="Respon Jemaat (kosongkan jika tidak ada)..."
                        className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-900"
                      />

                      {/* Hymn Reference Link */}
                      <div className="rounded-xl border border-stone-200 bg-white p-3 dark:border-stone-700 dark:bg-stone-900">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={Boolean(step.hymnRef)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const firstHymn = data.hymns[0];
                                  handleUpdateStep(step.id, {
                                    hymnRef: {
                                      book: firstHymn?.book || 'NR',
                                      number: firstHymn?.number || 1,
                                      title: firstHymn?.title || 'Haleluya, Pujilah Tuhan',
                                      versesToSing: 'Bait 1 & 2',
                                    },
                                  });
                                } else {
                                  handleUpdateStep(step.id, { hymnRef: undefined });
                                }
                              }}
                              className="h-4 w-4 accent-[#7F1D1D]"
                            />
                            <Music className="h-3.5 w-3.5 text-amber-600" />
                            <span>Sertakan Nyanyian Jemaat di Bagian Ini</span>
                          </label>

                          {step.hymnRef && (
                            <select
                              value={`${step.hymnRef.book}-${step.hymnRef.number}`}
                              onChange={(e) => {
                                const [book, numStr] = e.target.value.split('-');
                                const found = data.hymns.find(
                                  (h) => h.book === book && h.number === Number(numStr)
                                );
                                if (found) {
                                  handleUpdateStep(step.id, {
                                    hymnRef: {
                                      book: found.book,
                                      number: found.number,
                                      title: found.title,
                                      versesToSing: step.hymnRef?.versesToSing || 'Bait 1',
                                    },
                                  });
                                }
                              }}
                              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs dark:border-stone-700 dark:bg-stone-800"
                            >
                              <option value="">-- Pilih dari Daftar Lagu --</option>
                              {data.hymns.map((h) => (
                                <option key={h.id} value={`${h.book}-${h.number}`}>
                                  {h.book} No. {h.number} — {h.title}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>

                        {step.hymnRef && (
                          <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <select
                              value={step.hymnRef.book}
                              onChange={(e) =>
                                handleUpdateStep(step.id, {
                                  hymnRef: {
                                    ...step.hymnRef!,
                                    book: e.target.value as HymnBook,
                                  },
                                })
                              }
                              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-800"
                            >
                              {(['KJ', 'PKJ', 'NKB', 'DSL', 'NR'] as HymnBook[]).map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={step.hymnRef.number}
                              onChange={(e) =>
                                handleUpdateStep(step.id, {
                                  hymnRef: {
                                    ...step.hymnRef!,
                                    number: Number(e.target.value) || 1,
                                  },
                                })
                              }
                              placeholder="No."
                              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-800"
                            />
                            <input
                              type="text"
                              value={step.hymnRef.title}
                              onChange={(e) =>
                                handleUpdateStep(step.id, {
                                  hymnRef: { ...step.hymnRef!, title: e.target.value },
                                })
                              }
                              placeholder="Judul Nyanyian"
                              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-800"
                            />
                            <input
                              type="text"
                              value={step.hymnRef.versesToSing}
                              onChange={(e) =>
                                handleUpdateStep(step.id, {
                                  hymnRef: { ...step.hymnRef!, versesToSing: e.target.value },
                                })
                              }
                              placeholder="Bait (mis. Bait 1 & 2)"
                              className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-800"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-6 py-2.5 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
                  >
                    <span>Simpan Perubahan Liturgi</span>
                  </button>
                </div>
              </div>
            </form>
              )}

              {liturgiSubTab === 'unsur' && (
                <div className="space-y-6">
                  <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                          Kelola Model Liturgi Wadah Kategorial
                        </h2>
                        <p className="text-xs text-stone-500 dark:text-stone-400">
                          Pilih unsur dan model (mis. PERPRI Model A, B, C, D) untuk mengedit urutan liturgi atau menambah model baru.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleCreateNewUnsurModel}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-[#7F1D1D] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Tambah Model Baru ({adminSelectedUnsur})</span>
                      </button>
                    </div>

                    {/* Unsur Picker */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {(['PERPRI', 'PERWATA', 'PP', 'PAR', 'LANSIA'] as UnsurName[]).map((u) => {
                        const count = data.unsurLiturgies.filter((m) => m.unsur === u).length;
                        return (
                          <button
                            key={u}
                            type="button"
                            onClick={() => selectUnsurForEdit(u)}
                            className={`min-h-[36px] rounded-xl px-3.5 text-xs font-semibold cursor-pointer ${
                              adminSelectedUnsur === u
                                ? 'bg-[#7F1D1D] text-white dark:bg-amber-500 dark:text-stone-950'
                                : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
                            }`}
                          >
                            {u} ({count})
                          </button>
                        );
                      })}
                    </div>

                    {/* Model Picker for selected Unsur */}
                    <div className="mt-3 flex flex-wrap gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
                      {data.unsurLiturgies
                        .filter((m) => m.unsur === adminSelectedUnsur)
                        .map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => selectUnsurModelForEdit(m)}
                            className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                              editingUnsurModelId === m.id
                                ? 'border-[#7F1D1D] bg-amber-50 text-[#7F1D1D] dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-300'
                                : 'border-stone-200 bg-stone-50 text-stone-700 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300'
                            }`}
                          >
                            {m.modelCode}
                          </button>
                        ))}
                    </div>
                  </div>

                  {unsurDraft && (
                    <form
                      onSubmit={handleSaveUnsurModel}
                      className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          Edit {unsurDraft.unsur} · {unsurDraft.modelCode}
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteUnsurModel(unsurDraft.id)}
                            className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus Model</span>
                          </button>
                          <button
                            type="submit"
                            className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#7F1D1D] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
                          >
                            <span>Simpan Model Liturgi</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <input
                          type="text"
                          value={unsurDraft.modelCode}
                          onChange={(e) =>
                            setUnsurDraft({ ...unsurDraft, modelCode: e.target.value })
                          }
                          placeholder="Kode Model (mis. Model A)"
                          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold dark:border-stone-700 dark:bg-stone-800"
                        />
                        <input
                          type="text"
                          value={unsurDraft.title}
                          onChange={(e) =>
                            setUnsurDraft({ ...unsurDraft, title: e.target.value })
                          }
                          placeholder="Judul Liturgi"
                          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800 sm:col-span-2"
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <input
                          type="text"
                          value={unsurDraft.subtitle}
                          onChange={(e) =>
                            setUnsurDraft({ ...unsurDraft, subtitle: e.target.value })
                          }
                          placeholder="Subjudul / Jenis Ibadah"
                          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                        />
                        <input
                          type="text"
                          value={unsurDraft.theme}
                          onChange={(e) =>
                            setUnsurDraft({ ...unsurDraft, theme: e.target.value })
                          }
                          placeholder="Tema Pelayanan"
                          className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                        />
                      </div>

                      <input
                        type="text"
                        value={unsurDraft.occasionHint}
                        onChange={(e) =>
                          setUnsurDraft({ ...unsurDraft, occasionHint: e.target.value })
                        }
                        placeholder="Catatan penggunaan (opsional)..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                      />

                      <div className="flex items-center justify-between border-t border-stone-100 pt-3 dark:border-stone-800">
                        <span className="text-xs font-bold text-stone-700 dark:text-stone-300">
                          Urutan Bagian Liturgi ({unsurDraft.steps.length})
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setUnsurDraft({
                              ...unsurDraft,
                              steps: [
                                ...unsurDraft.steps,
                                {
                                  id: `ustep-${Date.now()}`,
                                  order: unsurDraft.steps.length + 1,
                                  section: 'Bagian Baru',
                                  instruction: '',
                                  leaderText: '',
                                  congregationText: '',
                                },
                              ],
                            })
                          }
                          className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-stone-300 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Tambah Bagian</span>
                        </button>
                      </div>

                      <div className="space-y-3">
                        {unsurDraft.steps.map((step, sIdx) => (
                          <div
                            key={step.id}
                            className="space-y-2.5 rounded-xl border border-stone-200 bg-stone-50/70 p-3.5 dark:border-stone-800 dark:bg-stone-800/40"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-tabular text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                                Bagian {String(sIdx + 1).padStart(2, '0')}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setUnsurDraft({
                                    ...unsurDraft,
                                    steps: unsurDraft.steps.filter((s) => s.id !== step.id),
                                  })
                                }
                                className="rounded-lg p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                                title="Hapus Bagian"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <input
                                type="text"
                                value={step.section}
                                onChange={(e) =>
                                  setUnsurDraft({
                                    ...unsurDraft,
                                    steps: unsurDraft.steps.map((s) =>
                                      s.id === step.id ? { ...s, section: e.target.value } : s
                                    ),
                                  })
                                }
                                placeholder="Nama Bagian"
                                className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs font-semibold dark:border-stone-700 dark:bg-stone-900"
                              />
                              <input
                                type="text"
                                value={step.instruction || ''}
                                onChange={(e) =>
                                  setUnsurDraft({
                                    ...unsurDraft,
                                    steps: unsurDraft.steps.map((s) =>
                                      s.id === step.id ? { ...s, instruction: e.target.value } : s
                                    ),
                                  })
                                }
                                placeholder="Petunjuk (opsional)"
                                className="rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-900"
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={step.leaderText}
                              onChange={(e) =>
                                setUnsurDraft({
                                  ...unsurDraft,
                                  steps: unsurDraft.steps.map((s) =>
                                    s.id === step.id ? { ...s, leaderText: e.target.value } : s
                                  ),
                                })
                              }
                              placeholder="Teks Pemimpin / Pelayan..."
                              className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-900"
                            />
                            <textarea
                              rows={2}
                              value={step.congregationText || ''}
                              onChange={(e) =>
                                setUnsurDraft({
                                  ...unsurDraft,
                                  steps: unsurDraft.steps.map((s) =>
                                    s.id === step.id
                                      ? { ...s, congregationText: e.target.value }
                                      : s
                                  ),
                                })
                              }
                              placeholder="Respon Peserta / Jemaat (opsional)..."
                              className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-900"
                            />
                          </div>
                        ))}
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: NYANYIAN ROHANI */}
          {activeTab === 'nyanyian' && (
            <div className="space-y-6">
              {/* Master Spreadsheet Lagu Rohani (5 Tab Tersinkron) */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/40 dark:bg-amber-950/20">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                      <FileSpreadsheet className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
                      <span>Master Spreadsheet Lagu Rohani (5 Tab Tersinkron)</span>
                    </h2>
                    <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-300">
                      Membuat & menyinkronkan Google Spreadsheet khusus dengan 5 tab terpisah:{' '}
                      <strong>Kidung Jemaat (KJ)</strong>,{' '}
                      <strong>Nyanyikan Kidung Baru (NKB)</strong>,{' '}
                      <strong>Pelengkap Kidung Jemaat (PKJ)</strong>,{' '}
                      <strong>Dua Sahabat Lama (DSL)</strong>, dan{' '}
                      <strong>Nyanyian Rohani (NR)</strong>. Kolom tiap tab:{' '}
                      <code>Nomor | Judul | Nada Dasar | Lirik Bait | Refrein</code>.
                    </p>
                  </div>

                  {!isGoogleConnected ? (
                    <button
                      type="button"
                      onClick={connectGoogleWorkspace}
                      className="gsi-material-button shrink-0"
                    >
                      <div className="gsi-material-button-content-wrapper">
                        <div className="gsi-material-button-icon">
                          <svg viewBox="0 0 48 48" className="block h-full w-full">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          </svg>
                        </div>
                        <span className="gsi-material-button-contents">Sign in with Google</span>
                      </div>
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      Google Terhubung: {googleUser?.email}
                    </span>
                  )}
                </div>

                <div className="mt-4 space-y-3 border-t border-amber-200/70 pt-4 dark:border-amber-900/40">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={masterHymnsSheetIdInput}
                      onChange={(e) => setMasterHymnsSheetIdInput(e.target.value)}
                      placeholder="Tempel ID atau URL Master Spreadsheet (atau buat otomatis di bawah)..."
                      className="flex-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs dark:border-stone-700 dark:bg-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const cleanId = extractSpreadsheetId(masterHymnsSheetIdInput);
                        if (!cleanId) {
                          showToast('Masukkan ID atau URL Google Spreadsheet terlebih dahulu.');
                          return;
                        }
                        updateData((prev) => ({
                          ...prev,
                          syncConfig: {
                            ...prev.syncConfig,
                            masterHymnsSheetId: cleanId,
                            masterHymnsSheetUrl: `https://docs.google.com/spreadsheets/d/${cleanId}`,
                          },
                        }));
                        showToast('ID Master Spreadsheet Lagu Rohani disimpan.');
                      }}
                      className="min-h-[38px] rounded-xl bg-stone-800 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-900 dark:bg-stone-700 cursor-pointer"
                    >
                      Simpan Tautan Sheet
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    <button
                      type="button"
                      disabled={!isGoogleConnected || isSyncingWorkspace}
                      onClick={provisionMasterHymnSpreadsheet}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#68151B] disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Buat Master Spreadsheet Baru (5 Tab Otomatis)</span>
                    </button>

                    {masterHymnsUrl && (
                      <>
                        <a
                          href={masterHymnsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          <span>Buka Master Spreadsheet</span>
                        </a>

                        <button
                          type="button"
                          disabled={!isGoogleConnected || isSyncingWorkspace}
                          onClick={() =>
                            setConfirmAction({
                              open: true,
                              title: 'Tarik Lagu dari Master Spreadsheet (5 Tab)?',
                              description:
                                'Aplikasi akan membaca seluruh baris lagu dari tab KJ, NKB, PKJ, DSL, dan NR di Master Spreadsheet dan memperbarui daftar lagu di menu Kidung Pujian.',
                              confirmLabel: 'Tarik & Sinkronkan ke Aplikasi',
                              onConfirm: async () => {
                                setConfirmAction((prev) => ({ ...prev, open: false }));
                                await pullFromMasterHymnSpreadsheet();
                              },
                            })
                          }
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Tarik dari Master Sheet</span>
                        </button>

                        <button
                          type="button"
                          disabled={!isGoogleConnected || isSyncingWorkspace}
                          onClick={() =>
                            setConfirmAction({
                              open: true,
                              title: 'Kirim Daftar Lagu Aplikasi ke Master Spreadsheet?',
                              description:
                                `Seluruh ${data.hymns.length} lagu saat ini akan ditulis ke 5 tab (KJ, NKB, PKJ, DSL, NR) pada Master Spreadsheet Google Sheets.`,
                              confirmLabel: 'Kirim ke Master Sheet',
                              onConfirm: async () => {
                                setConfirmAction((prev) => ({ ...prev, open: false }));
                                await pushToMasterHymnSpreadsheet();
                              },
                            })
                          }
                          className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-[#7F1D1D]/40 bg-white px-3.5 py-2 text-xs font-semibold text-[#7F1D1D] hover:bg-red-50 disabled:opacity-50 dark:border-amber-500/40 dark:bg-stone-900 dark:text-amber-400 cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Kirim ke Master Sheet</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Tambah / Edit Lagu */}
              <form
                onSubmit={handleSaveHymn}
                className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                    {editingHymnId ? 'Edit Kidung Pujian' : 'Tambah Lagu ke Database Kidung Pujian'}
                  </h2>
                  {editingHymnId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingHymnId(null);
                        setHymnNumber('');
                        setHymnTitle('');
                        setHymnKey('');
                        setHymnVersesText('');
                        setHymnChorus('');
                      }}
                      className="text-xs font-semibold text-stone-500 hover:underline cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                  <select
                    value={hymnBook}
                    onChange={(e) => setHymnBook(e.target.value as HymnBook)}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold dark:border-stone-700 dark:bg-stone-800"
                  >
                    <option value="KJ">KJ (Kidung Jemaat)</option>
                    <option value="PKJ">PKJ (Pelengkap KJ)</option>
                    <option value="NKB">NKB (Nyanyian Kidung Baru)</option>
                    <option value="DSL">DSL (Dua Sahabat Lama)</option>
                    <option value="NR">NR (Nyanyian Rohani)</option>
                  </select>
                  <input
                    type="number"
                    required
                    min={1}
                    value={hymnNumber}
                    onChange={(e) => setHymnNumber(e.target.value)}
                    placeholder="Nomor Lagu (mis. 1)"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                  <input
                    type="text"
                    required
                    value={hymnTitle}
                    onChange={(e) => setHymnTitle(e.target.value)}
                    placeholder="Judul Lagu"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800 sm:col-span-2"
                  />
                </div>

                <input
                  type="text"
                  value={hymnKey}
                  onChange={(e) => setHymnKey(e.target.value)}
                  placeholder="Nada Dasar / Birama (opsional, mis. Do = G (4/4))"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                />

                <div>
                  <label className="block text-xs font-semibold text-stone-600 dark:text-stone-400">
                    Lirik Bait-Bait (pisahkan tiap bait dengan 1 baris kosong / Enter 2x)
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={hymnVersesText}
                    onChange={(e) => setHymnVersesText(e.target.value)}
                    placeholder={'1. Baris pertama bait 1...\nBaris kedua bait 1...\n\n2. Baris pertama bait 2...'}
                    className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                </div>

                <textarea
                  rows={2}
                  value={hymnChorus}
                  onChange={(e) => setHymnChorus(e.target.value)}
                  placeholder="Refrein / Koor (opsional)..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                />

                <button
                  type="submit"
                  className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#7F1D1D] px-5 py-2 text-xs font-semibold text-white hover:bg-[#68151B] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>{editingHymnId ? 'Perbarui Lagu' : 'Simpan Lagu ke Database'}</span>
                </button>
              </form>

              {/* Impor Massal dari Google Sheets atau File JSON */}
              <div className="grid grid-cols-1 gap-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 md:grid-cols-2">
                <div className="space-y-2.5">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
                    <FileSpreadsheet className="h-4 w-4 text-emerald-700 dark:text-emerald-400" />
                    <span>Impor Massal dari Google Sheets</span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Format kolom header: <code>Buku | Nomor | Judul | Nada Dasar | Lirik Bait | Refrein</code>
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={hymnSheetUrl}
                      onChange={(e) => setHymnSheetUrl(e.target.value)}
                      placeholder="URL atau ID Google Sheet..."
                      className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs dark:border-stone-700 dark:bg-stone-800"
                    />
                    <button
                      type="button"
                      onClick={handleImportHymnsFromSheet}
                      className="rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                    >
                      Impor Sheet
                    </button>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Impor Massal dari File JSON
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Unggah file <code>.json</code> berisi daftar lagu KJ, PKJ, NKB, DSL, atau NR sekaligus.
                  </p>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleUploadHymnsJson}
                    className="block w-full text-xs text-stone-600 file:mr-3 file:rounded-xl file:border-0 file:bg-stone-100 file:px-3.5 file:py-2 file:text-xs file:font-semibold file:text-stone-800 hover:file:bg-stone-200 dark:text-stone-300 dark:file:bg-stone-800 dark:file:text-stone-200"
                  />
                </div>
              </div>

              {/* Daftar Lagu di Database */}
              <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-3 dark:border-stone-800">
                  <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    Database Lagu Tersimpan ({data.hymns.length} Lagu)
                  </h3>
                  <input
                    type="text"
                    value={hymnSearchAdmin}
                    onChange={(e) => setHymnSearchAdmin(e.target.value)}
                    placeholder="Cari nomor atau judul..."
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-800"
                  />
                </div>

                <div className="mt-3 max-h-[380px] divide-y divide-stone-100 overflow-y-auto dark:divide-stone-800">
                  {data.hymns
                    .filter((h) => {
                      const q = hymnSearchAdmin.trim().toLowerCase();
                      if (!q) return true;
                      return (
                        h.title.toLowerCase().includes(q) ||
                        `${h.book.toLowerCase()} ${h.number}`.includes(q) ||
                        String(h.number).includes(q)
                      );
                    })
                    .map((h) => (
                      <div key={h.id} className="flex items-center justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="font-tabular text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                            {h.book} No. {h.number} · {h.verses.length} bait
                          </p>
                          <p className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                            {h.title}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditHymnStart(h)}
                            className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              updateData((prev) => ({
                                ...prev,
                                hymns: prev.hymns.filter((x) => x.id !== h.id),
                              }));
                              logActivity({
                                category: 'Nyanyian',
                                action: 'Hapus Lagu Rohani',
                                detail: `${h.book} No. ${h.number} — ${h.title}`,
                              });
                            }}
                            className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                            title="Hapus Lagu"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GALERI */}
          {activeTab === 'galeri' && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddGallery}
                className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
              >
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Tambah Dokumentasi Galeri
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="text"
                    required
                    value={galTitle}
                    onChange={(e) => setGalTitle(e.target.value)}
                    placeholder="Judul Foto / Kegiatan"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                  <input
                    type="text"
                    value={galDate}
                    onChange={(e) => setGalDate(e.target.value)}
                    placeholder="Bulan / Tahun"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                </div>
                <input
                  type="text"
                  value={galImageUrl}
                  onChange={(e) => setGalImageUrl(e.target.value)}
                  placeholder="URL Gambar"
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                />
                <input
                  type="text"
                  value={galCaption}
                  onChange={(e) => setGalCaption(e.target.value)}
                  placeholder="Keterangan singkat..."
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                />
                <button
                  type="submit"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah ke Galeri</span>
                </button>
              </form>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {data.gallery.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 dark:border-stone-800 dark:bg-stone-900"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-stone-900 dark:text-stone-100">
                        {g.title}
                      </p>
                      <p className="truncate text-xs text-stone-500">{g.date}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        updateData((prev) => ({
                          ...prev,
                          gallery: prev.gallery.filter((x) => x.id !== g.id),
                        }));
                        logActivity({
                          category: 'Galeri',
                          action: 'Hapus Foto Galeri',
                          detail: `${g.title} (${g.date})`,
                        });
                      }}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: KEUANGAN (SUPER USER ONLY) */}
          {activeTab === 'keuangan' && isSuperUser && (
            <div className="space-y-6">
              <form
                onSubmit={handleAddFinance}
                className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
              >
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Catat Transaksi Keuangan (Eksklusif Super User)
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="date"
                    value={finDate}
                    onChange={(e) => setFinDate(e.target.value)}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                  <select
                    value={finCategorySafe(finCat)}
                    onChange={(e) => setFinCat(e.target.value as FinanceEntry['category'])}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  >
                    <option value="Persembahan">Persembahan</option>
                    <option value="Aksi Pembangunan">Aksi Pembangunan</option>
                    <option value="Diakonia">Diakonia</option>
                    <option value="Operasional">Operasional</option>
                  </select>
                  <select
                    value={finType}
                    onChange={(e) => setFinType(e.target.value as FinanceEntry['type'])}
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  >
                    <option value="Pemasukan">Pemasukan</option>
                    <option value="Pengeluaran">Pengeluaran</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <input
                    type="text"
                    required
                    value={finDesc}
                    onChange={(e) => setFinDesc(e.target.value)}
                    placeholder="Uraian transaksi..."
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800 sm:col-span-2"
                  />
                  <input
                    type="number"
                    required
                    value={finAmount}
                    onChange={(e) => setFinAmount(e.target.value)}
                    placeholder="Nominal (Rp)"
                    className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Simpan Transaksi</span>
                </button>
              </form>

              <div className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white dark:divide-stone-800 dark:border-stone-800 dark:bg-stone-900">
                {data.finance.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3 p-4">
                    <div>
                      <p className="text-xs font-semibold text-stone-500">
                        {f.date} · {f.category} · {f.type}
                      </p>
                      <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        {f.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-tabular text-sm font-bold">
                        Rp {f.amount.toLocaleString('id-ID')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          updateData((prev) => ({
                            ...prev,
                            finance: prev.finance.filter((x) => x.id !== f.id),
                          }));
                          logActivity({
                            category: 'Keuangan',
                            action: 'Hapus Transaksi Keuangan',
                            detail: `${f.category}: ${f.description} (Rp ${f.amount.toLocaleString('id-ID')})`,
                          });
                        }}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: DATA & STATISTIK (SUPER USER ONLY) */}
          {activeTab === 'statistik' && isSuperUser && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                  Impor Statistik Jemaat dari Google Sheet Aplikasi Lain
                </h2>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    type="text"
                    value={extSheetUrl}
                    onChange={(e) => setExtSheetUrl(e.target.value)}
                    placeholder="URL atau Spreadsheet ID Google Sheet..."
                    className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                  />
                  <button
                    type="button"
                    onClick={handleImportExternalStats}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    <span>Impor Google Sheet</span>
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                  Edit Cepat Data Statistik Unit
                </h3>
                <div className="mt-3 space-y-3">
                  {data.statistics.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-2 gap-2 rounded-xl border border-stone-100 p-3 dark:border-stone-800 sm:grid-cols-5"
                    >
                      <div className="col-span-2 sm:col-span-2">
                        <p className="text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                          {row.sektor}
                        </p>
                        <p className="text-sm font-semibold">{row.unit}</p>
                      </div>
                      <label className="text-xs">
                        KK
                        <input
                          type="number"
                          value={row.kk}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              statistics: prev.statistics.map((s) =>
                                s.id === row.id ? { ...s, kk: Number(e.target.value) || 0 } : s
                              ),
                            }))
                          }
                          className="mt-0.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-800"
                        />
                      </label>
                      <label className="text-xs">
                        Jiwa
                        <input
                          type="number"
                          value={row.jiwa}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              statistics: prev.statistics.map((s) =>
                                s.id === row.id ? { ...s, jiwa: Number(e.target.value) || 0 } : s
                              ),
                            }))
                          }
                          className="mt-0.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-800"
                        />
                      </label>
                      <label className="text-xs">
                        Lansia
                        <input
                          type="number"
                          value={row.lansia}
                          onChange={(e) =>
                            updateData((prev) => ({
                              ...prev,
                              statistics: prev.statistics.map((s) =>
                                s.id === row.id ? { ...s, lansia: Number(e.target.value) || 0 } : s
                              ),
                            }))
                          }
                          className="mt-0.5 w-full rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-sm dark:border-stone-700 dark:bg-stone-800"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: AKUN ADMIN (SUPER USER ONLY) */}
          {activeTab === 'akun' && isSuperUser && (
            <div className="space-y-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">
                Manajemen & Reset Sandi Akun Admin
              </h2>

              <div className="space-y-4">
                {data.adminAccounts
                  .filter((a) => a.username !== 'superuser')
                  .map((acc) => {
                    const isA1 = acc.username === 'admin1';
                    const val = isA1 ? newPassAdmin1 : newPassAdmin2;
                    const setVal = isA1 ? setNewPassAdmin1 : setNewPassAdmin2;
                    return (
                      <div
                        key={acc.username}
                        className="rounded-xl border border-stone-200 p-4 dark:border-stone-800"
                      >
                        <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                          {acc.title} ({acc.username})
                        </p>
                        <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                          {acc.permissionsSummary}
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                          Sandi aktif saat ini:{' '}
                          <code className="font-tabular font-semibold text-stone-800 dark:text-stone-200">
                            {acc.password}
                          </code>
                        </p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <input
                            type="text"
                            value={val}
                            onChange={(e) => setVal(e.target.value)}
                            placeholder={`Sandi baru untuk ${acc.username}...`}
                            className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm dark:border-stone-700 dark:bg-stone-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleResetAdminPassword(acc.username as 'admin1' | 'admin2', val)}
                            className="min-h-[40px] rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                          >
                            Reset Sandi
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>

              <div className="border-t border-stone-100 pt-4 dark:border-stone-800">
                <button
                  type="button"
                  onClick={() =>
                    setConfirmAction({
                      open: true,
                      title: 'Pulihkan Data Contoh Awal?',
                      description:
                        'Seluruh perubahan di LocalStorage akan dikembalikan ke data awal GPI Getsemani Sorong.',
                      confirmLabel: 'Pulihkan Data Awal',
                      destructive: true,
                      onConfirm: () => {
                        resetDemoData();
                        setConfirmAction((prev) => ({ ...prev, open: false }));
                      },
                    })
                  }
                  className="text-xs font-semibold text-red-600 hover:underline cursor-pointer"
                >
                  Reset Seluruh Data ke Contoh Awal (LocalStorage)
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: GOOGLE DRIVE & SHEETS AUTO-SYNC (SUPER USER ONLY) */}
          {activeTab === 'workspace' && isSuperUser && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                      <Database className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
                      <span>Sinkronisasi Otomatis Google Drive & Google Sheets</span>
                    </h2>
                    <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                      Simpan cadangan aplikasi di Google Drive dan sinkronkan tabel database portal ke Google Sheets.
                    </p>
                  </div>

                  {!isGoogleConnected ? (
                    <button
                      type="button"
                      onClick={connectGoogleWorkspace}
                      className="gsi-material-button"
                    >
                      <div className="gsi-material-button-content-wrapper">
                        <div className="gsi-material-button-icon">
                          <svg viewBox="0 0 48 48" className="block h-full w-full">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          </svg>
                        </div>
                        <span className="gsi-material-button-contents">Sign in with Google</span>
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        Terhubung: {googleUser?.email}
                      </span>
                      <button
                        type="button"
                        onClick={disconnectGoogleWorkspace}
                        className="rounded-xl border border-stone-300 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 cursor-pointer"
                      >
                        Putuskan
                      </button>
                    </div>
                  )}
                </div>

                {/* Auto-Sync Controls */}
                <div className="mt-5 space-y-4 border-t border-stone-100 pt-4 dark:border-stone-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 dark:text-stone-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={data.syncConfig.autoSyncEnabled}
                        onChange={(e) =>
                          updateData((prev) => ({
                            ...prev,
                            syncConfig: {
                              ...prev.syncConfig,
                              autoSyncEnabled: e.target.checked,
                            },
                          }))
                        }
                        className="h-4 w-4 accent-[#7F1D1D]"
                      />
                      <span>Aktifkan Sinkronisasi Otomatis saat data diubah</span>
                    </label>

                    <button
                      type="button"
                      disabled={!isGoogleConnected || isSyncingWorkspace}
                      onClick={() =>
                        setConfirmAction({
                          open: true,
                          title: 'Sinkronkan & Timpa Cadangan Google Drive/Sheets?',
                          description:
                            'Seluruh data portal saat ini akan ditulis ke berkas cadangan Google Drive dan Spreadsheet Database yang terhubung.',
                          confirmLabel: 'Sinkronkan Sekarang',
                          onConfirm: async () => {
                            setConfirmAction((prev) => ({ ...prev, open: false }));
                            await syncNowToWorkspace();
                          },
                        })
                      }
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
                    >
                      <RefreshCw className={`h-4 w-4 ${isSyncingWorkspace ? 'animate-spin' : ''}`} />
                      <span>Sinkronkan Sekarang</span>
                    </button>
                  </div>

                  {data.syncConfig.lastSyncedAt && (
                    <p className="text-xs text-stone-500">
                      Sinkronisasi terakhir:{' '}
                      <span className="font-tabular">
                        {new Date(data.syncConfig.lastSyncedAt).toLocaleString('id-ID')}
                      </span>
                    </p>
                  )}

                  {/* Database Google Sheets Setup */}
                  <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-stone-200 p-4 dark:border-stone-800">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        Database Google Sheets
                      </p>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={dbSheetIdInput}
                          onChange={(e) => setDbSheetIdInput(e.target.value)}
                          placeholder="ID / URL Spreadsheet Database..."
                          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-800"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const id = extractSpreadsheetId(dbSheetIdInput);
                            updateData((prev) => ({
                              ...prev,
                              syncConfig: { ...prev.syncConfig, spreadsheetId: id },
                            }));
                            logActivity({
                              category: 'Sinkronisasi',
                              action: 'Tautkan ID Spreadsheet Database',
                              detail: `Spreadsheet ID diatur ke ${id || '(kosong)'}.`,
                            });
                            showToast('ID Spreadsheet Database disimpan.');
                          }}
                          className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                        >
                          Simpan
                        </button>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          disabled={!isGoogleConnected || isSyncingWorkspace}
                          onClick={provisionChurchSpreadsheet}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7F1D1D] hover:underline disabled:opacity-50 dark:text-amber-400 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          <span>Buat Google Sheet Database Baru Otomatis</span>
                        </button>
                        {data.syncConfig.spreadsheetId && (
                          <a
                            href={
                              data.syncConfig.spreadsheetUrl ||
                              `https://docs.google.com/spreadsheets/d/${data.syncConfig.spreadsheetId}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Buka Sheet</span>
                          </a>
                        )}
                      </div>

                      <div className="mt-3 border-t border-stone-100 pt-3 dark:border-stone-800">
                        <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                          Master Lagu Rohani (5 Tab: KJ, NKB, PKJ, DSL, NR)
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            disabled={!isGoogleConnected || isSyncingWorkspace}
                            onClick={provisionMasterHymnSpreadsheet}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#7F1D1D] hover:underline disabled:opacity-50 dark:text-amber-400 cursor-pointer"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Buat Master Sheet Lagu (5 Tab)</span>
                          </button>
                          {masterHymnsUrl && (
                            <a
                              href={masterHymnsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                            >
                              <ExternalLink className="h-3 w-3" />
                              <span>Buka Master Lagu</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Google Drive Logo & Folder */}
                    <div className="rounded-xl border border-stone-200 p-4 dark:border-stone-800">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        Folder Logo & Penyimpanan Google Drive
                      </p>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={driveFolderInput}
                          onChange={(e) => setDriveFolderInput(e.target.value)}
                          placeholder="ID Folder Drive Logo..."
                          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-800"
                        />
                        <button
                          type="button"
                          disabled={!isGoogleConnected}
                          onClick={handleInspectDriveFolder}
                          className="rounded-lg bg-stone-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 cursor-pointer"
                        >
                          Cek Folder
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={!isGoogleConnected || isSyncingWorkspace}
                        onClick={refreshLogoFromDrive}
                        className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#7F1D1D] hover:underline disabled:opacity-50 dark:text-amber-400 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Muat Ulang Logo Simbol dari Drive</span>
                      </button>
                    </div>
                  </div>

                  {driveFilesList.length > 0 && (
                    <div className="rounded-xl border border-stone-200 p-4 dark:border-stone-800">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        Berkas di Folder Google Drive
                      </p>
                      <ul className="mt-2 divide-y divide-stone-100 dark:divide-stone-800">
                        {driveFilesList.map((file) => (
                          <li key={file.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                            <span className="truncate font-medium">{file.name}</span>
                            {file.mimeType === 'application/json' && (
                              <button
                                type="button"
                                onClick={() => handleRestoreFromDriveFile(file.id, file.name)}
                                className="font-semibold text-[#7F1D1D] hover:underline dark:text-amber-400 cursor-pointer"
                              >
                                Pulihkan Data
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {/* Database Alkitab TB Offline (IndexedDB & Impor Google Sheets) */}
                  <div className="rounded-xl border border-stone-200 p-4 dark:border-stone-800">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                          <BookOpen className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
                          <span>Database Alkitab Offline (IndexedDB)</span>
                        </p>
                        <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                          Tersimpan lokal:{' '}
                          <strong className="font-tabular text-stone-800 dark:text-stone-200">
                            {bibleDbStats.cachedChaptersCount.toLocaleString('id-ID')}
                          </strong>{' '}
                          dari{' '}
                          <span className="font-tabular">
                            {bibleDbStats.totalCanonicalChapters.toLocaleString('id-ID')}
                          </span>{' '}
                          pasal ({bibleDbStats.cachedBooksCount} kitab).
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={isDownloadingBible}
                          onClick={async () => {
                            const res = await downloadBibleOffline();
                            if (res) {
                              logActivity({
                                category: 'Sinkronisasi',
                                action: 'Unduh Database Alkitab Offline',
                                detail: `${res.chaptersSaved} pasal (${res.versesSaved.toLocaleString('id-ID')} ayat) disimpan ke IndexedDB.`,
                              });
                              showToast(
                                `Database Alkitab lengkap (${res.chaptersSaved} pasal) berhasil disimpan offline.`
                              );
                            }
                          }}
                          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-[#7F1D1D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#68151B] disabled:opacity-50 cursor-pointer"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>
                            {isDownloadingBible ? 'Mengunduh...' : 'Unduh 66 Kitab Offline'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setConfirmAction({
                              open: true,
                              title: 'Reset Cache Offline Alkitab?',
                              description:
                                'Pasal Alkitab yang diunduh di IndexedDB akan dihapus dan dikembalikan ke data awal bawaan.',
                              confirmLabel: 'Reset Cache Alkitab',
                              destructive: true,
                              onConfirm: async () => {
                                setConfirmAction((prev) => ({ ...prev, open: false }));
                                await resetBibleOfflineDb();
                                logActivity({
                                  category: 'Sinkronisasi',
                                  action: 'Reset Cache Offline Alkitab',
                                  detail: 'Database IndexedDB Alkitab dikembalikan ke data awal.',
                                });
                                showToast('Cache offline Alkitab direset.');
                              },
                            })
                          }
                          className="min-h-[36px] rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 cursor-pointer"
                        >
                          Reset Cache
                        </button>
                      </div>
                    </div>

                    {bibleDownloadProgress && (
                      <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400">
                        {bibleDownloadProgress.detail} ({bibleDownloadProgress.percent}%)
                      </p>
                    )}

                    <div className="mt-3 border-t border-stone-100 pt-3 dark:border-stone-800">
                      <p className="text-[11px] font-semibold text-stone-600 dark:text-stone-400">
                        Impor Ayat Alkitab dari Google Sheets (Kolom: Kitab | Pasal | Ayat | Teks)
                      </p>
                      <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
                        <input
                          type="text"
                          value={bibleSheetUrl}
                          onChange={(e) => setBibleSheetUrl(e.target.value)}
                          placeholder="URL atau ID Google Spreadsheet Alkitab..."
                          className="flex-1 rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1.5 text-xs dark:border-stone-700 dark:bg-stone-800"
                        />
                        <button
                          type="button"
                          disabled={!isGoogleConnected || !bibleSheetUrl.trim()}
                          onClick={async () => {
                            try {
                              const res = await importBibleFromGoogleSheet(bibleSheetUrl);
                              logActivity({
                                category: 'Sinkronisasi',
                                action: 'Impor Alkitab dari Google Sheets',
                                detail: `${res.chaptersSaved} pasal (${res.versesSaved} ayat) dari "${res.spreadsheetTitle}" (${res.tabTitle}).`,
                              });
                              showToast(
                                `${res.chaptersSaved} pasal (${res.versesSaved} ayat) Alkitab berhasil diimpor ke database offline.`
                              );
                            } catch (err) {
                              showToast(
                                err instanceof Error
                                  ? err.message
                                  : 'Gagal mengimpor Alkitab dari Google Sheets.'
                              );
                            }
                          }}
                          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                        >
                          Impor ke DB Offline
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: KOTAK DOA JEMAAT */}
          {activeTab === 'kotak-doa' && (() => {
            const totalCount = allPrayers.length;
            const menungguCount = allPrayers.filter((p) => p.status === 'Menunggu').length;
            const didoakanCount = allPrayers.filter((p) => p.status === 'Didoakan').length;
            const selesaiCount = allPrayers.filter((p) => p.status === 'Selesai').length;

            const q = prayerSearch.trim().toLowerCase();
            const filteredPrayers = allPrayers.filter((p) => {
              if (prayerStatusFilter !== 'Semua' && p.status !== prayerStatusFilter) return false;
              if (prayerCategoryFilter !== 'Semua' && p.category !== prayerCategoryFilter) return false;
              if (!q) return true;
              return (
                p.requesterName.toLowerCase().includes(q) ||
                p.prayerText.toLowerCase().includes(q) ||
                p.unit.toLowerCase().includes(q) ||
                p.category.toLowerCase().includes(q) ||
                p.adminNote.toLowerCase().includes(q)
              );
            });

            const formatWaLink = (rawPhone: string, prayer: PrayerRequest) => {
              const digits = rawPhone.replace(/[^\d]/g, '');
              if (!digits) return null;
              const normalized = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
              const text = `Shalom ${prayer.requesterName}, kami dari Majelis Jemaat ${data.profile.name} telah menerima permohonan doa Anda (${prayer.category}) dan sedang mendoakannya.`;
              return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
            };

            const handleSavePrayer = async (prayer: PrayerRequest) => {
              const nextStatus = prayerStatusDrafts[prayer.id] ?? prayer.status;
              const nextNote = prayerNoteDrafts[prayer.id] ?? prayer.adminNote;
              setSavingPrayerId(prayer.id);
              try {
                const res = await updatePrayerStatusAndNote(prayer, {
                  status: nextStatus,
                  adminNote: nextNote,
                });
                if (res.errorMsg) {
                  showToast(res.errorMsg);
                } else {
                  showToast(
                    res.syncedToCloud
                      ? `Status doa "${prayer.requesterName}" (${nextStatus}) disimpan ke Firestore & portal.`
                      : `Status doa "${prayer.requesterName}" (${nextStatus}) disimpan.`
                  );
                }
              } finally {
                setSavingPrayerId(null);
              }
            };

            return (
              <div className="space-y-6">
                {/* Status Koneksi Database Firestore */}
                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                        <Heart className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
                        <span>Manajemen Kotak Doa Jemaat</span>
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                        Kelola setiap permohonan doa jemaat dari database cloud Firestore maupun perangkat lokal, tandai progres doa, dan catat tindak lanjut pastoral Majelis.
                      </p>
                    </div>

                    {!isFirebaseReadyForAdmin ? (
                      <button
                        type="button"
                        onClick={connectGoogleWorkspace}
                        className="gsi-material-button"
                      >
                        <div className="gsi-material-button-content-wrapper">
                          <div className="gsi-material-button-icon">
                            <svg viewBox="0 0 48 48" className="block h-full w-full">
                              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                            </svg>
                          </div>
                          <span className="gsi-material-button-contents">Hubungkan Google Majelis</span>
                        </div>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                        <Lock className="h-3.5 w-3.5" />
                        <span>
                          Firestore Aktif ({firebaseUser?.email}) ·{' '}
                          <span className="font-tabular">{prayerCloudCount}</span> data cloud
                        </span>
                      </div>
                    )}
                  </div>

                  {!isFirebaseReadyForAdmin && (
                    <div className="mt-3 rounded-xl border border-amber-200/80 bg-amber-50/70 px-3.5 py-2.5 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                      Masuk dengan akun Google Majelis (<code className="font-semibold">gpigetsemanisorong@gmail.com</code>) untuk menarik permohonan doa jemaat dari database cloud Firestore lintas perangkat secara real-time.
                    </div>
                  )}

                  {prayerCloudError && (
                    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                      {prayerCloudError}
                    </div>
                  )}
                </div>

                {/* Ringkasan Statistik Kotak Doa */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <button
                    type="button"
                    onClick={() => setPrayerStatusFilter('Semua')}
                    className={`rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                      prayerStatusFilter === 'Semua'
                        ? 'border-[#7F1D1D] bg-[#7F1D1D]/5 dark:border-amber-500 dark:bg-amber-500/10'
                        : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                      Total Masuk
                    </p>
                    <p className="font-tabular mt-1 text-2xl font-bold text-stone-900 dark:text-stone-100">
                      {totalCount}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrayerStatusFilter('Menunggu')}
                    className={`rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                      prayerStatusFilter === 'Menunggu'
                        ? 'border-amber-500 bg-amber-50 dark:border-amber-500 dark:bg-amber-950/30'
                        : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                      Menunggu Doa
                    </p>
                    <p className="font-tabular mt-1 text-2xl font-bold text-amber-800 dark:text-amber-300">
                      {menungguCount}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrayerStatusFilter('Didoakan')}
                    className={`rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                      prayerStatusFilter === 'Didoakan'
                        ? 'border-sky-500 bg-sky-50 dark:border-sky-500 dark:bg-sky-950/30'
                        : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-sky-700 dark:text-sky-400">
                      Sedang Didoakan
                    </p>
                    <p className="font-tabular mt-1 text-2xl font-bold text-sky-800 dark:text-sky-300">
                      {didoakanCount}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrayerStatusFilter('Selesai')}
                    className={`rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                      prayerStatusFilter === 'Selesai'
                        ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/30'
                        : 'border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900'
                    }`}
                  >
                    <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                      Selesai / Terjawab
                    </p>
                    <p className="font-tabular mt-1 text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                      {selesaiCount}
                    </p>
                  </button>
                </div>

                {/* Filter & Daftar Permohonan Doa */}
                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <div className="flex flex-col gap-2.5 border-b border-stone-100 pb-4 dark:border-stone-800 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={prayerSearch}
                        onChange={(e) => setPrayerSearch(e.target.value)}
                        placeholder="Cari nama pemohon, unit, atau isi pokok doa..."
                        className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 pl-9 text-xs dark:border-stone-700 dark:bg-stone-800"
                      />
                    </div>
                    <select
                      value={prayerStatusFilter}
                      onChange={(e) =>
                        setPrayerStatusFilter(e.target.value as 'Semua' | PrayerStatus)
                      }
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold dark:border-stone-700 dark:bg-stone-800"
                    >
                      <option value="Semua">Semua Status</option>
                      {PRAYER_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <select
                      value={prayerCategoryFilter}
                      onChange={(e) =>
                        setPrayerCategoryFilter(e.target.value as 'Semua' | PrayerCategory)
                      }
                      className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold dark:border-stone-700 dark:bg-stone-800"
                    >
                      <option value="Semua">Semua Kategori</option>
                      {PRAYER_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {isLoadingPrayerCloud && (
                    <p className="py-4 text-center text-xs text-stone-500">
                      Memuat Kotak Doa dari database cloud Firestore...
                    </p>
                  )}

                  {filteredPrayers.length === 0 ? (
                    <p className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
                      Tidak ada permohonan doa yang sesuai dengan filter saat ini.
                    </p>
                  ) : (
                    <div className="mt-4 space-y-4">
                      {filteredPrayers.map((prayer) => {
                        const draftStatus = prayerStatusDrafts[prayer.id] ?? prayer.status;
                        const draftNote = prayerNoteDrafts[prayer.id] ?? prayer.adminNote;
                        const waLink = prayer.phone ? formatWaLink(prayer.phone, prayer) : null;
                        const hasChanges =
                          draftStatus !== prayer.status ||
                          draftNote.trim() !== prayer.adminNote.trim();

                        const statusBadgeClass =
                          prayer.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : prayer.status === 'Didoakan'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300';

                        return (
                          <div
                            key={prayer.id}
                            className="rounded-2xl border border-stone-200 bg-stone-50/50 p-4 dark:border-stone-800 dark:bg-stone-800/30"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${statusBadgeClass}`}
                                >
                                  {prayer.status}
                                </span>
                                <span className="rounded-md bg-[#7F1D1D]/10 px-2 py-0.5 text-[11px] font-semibold text-[#7F1D1D] dark:bg-amber-500/15 dark:text-amber-300">
                                  {prayer.category}
                                </span>
                                {prayer.isAnonymous && (
                                  <span className="rounded-md bg-stone-200 px-2 py-0.5 text-[11px] font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-200">
                                    Anonim
                                  </span>
                                )}
                                <span className="rounded-md border border-stone-200 bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-500 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400">
                                  {prayer.source === 'firestore' ? 'Cloud DB' : 'Lokal'}
                                </span>
                              </div>

                              <span className="font-tabular inline-flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                                <Clock className="h-3 w-3" />
                                {new Date(prayer.createdAt).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>

                            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-bold text-stone-900 dark:text-stone-100">
                                  {prayer.requesterName}
                                </p>
                                <p className="text-xs text-stone-500 dark:text-stone-400">
                                  {prayer.unit || 'Umum'}
                                  {prayer.phone ? ` · Telp/WA: ${prayer.phone}` : ''}
                                </p>
                              </div>

                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                                >
                                  <MessageCircle className="h-3.5 w-3.5" />
                                  <span>Sapa via WhatsApp</span>
                                </a>
                              )}
                            </div>

                            <p className="mt-3 whitespace-pre-line rounded-xl border border-stone-200/80 bg-white p-3.5 text-sm leading-relaxed text-stone-800 dark:border-stone-700/80 dark:bg-stone-900 dark:text-stone-200">
                              {prayer.prayerText}
                            </p>

                            {/* Kontrol Tindak Lanjut Majelis */}
                            <div className="mt-3 space-y-2.5 border-t border-stone-200/70 pt-3 dark:border-stone-800">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                                    Status:
                                  </span>
                                  {PRAYER_STATUSES.map((st) => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() =>
                                        setPrayerStatusDrafts((prev) => ({
                                          ...prev,
                                          [prayer.id]: st,
                                        }))
                                      }
                                      className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer ${
                                        draftStatus === st
                                          ? 'bg-[#7F1D1D] text-white dark:bg-amber-500 dark:text-stone-950'
                                          : 'border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300'
                                      }`}
                                    >
                                      {st}
                                    </button>
                                  ))}
                                </div>

                                {prayer.handledBy && (
                                  <span className="text-[11px] text-stone-500 dark:text-stone-400">
                                    Ditangani: <strong>{prayer.handledBy}</strong>
                                  </span>
                                )}
                              </div>

                              <textarea
                                rows={2}
                                maxLength={600}
                                value={draftNote}
                                onChange={(e) =>
                                  setPrayerNoteDrafts((prev) => ({
                                    ...prev,
                                    [prayer.id]: e.target.value,
                                  }))
                                }
                                placeholder="Catatan pastoral Majelis (mis. Didoakan dalam ibadah Minggu / jadwal perkunjungan)..."
                                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs text-stone-900 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100"
                              />

                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmAction({
                                      open: true,
                                      title: 'Hapus Permohonan Doa?',
                                      description: `Permohonan doa dari "${prayer.requesterName}" akan dihapus dari Kotak Doa.`,
                                      confirmLabel: 'Hapus Doa',
                                      destructive: true,
                                      onConfirm: async () => {
                                        setConfirmAction((prev) => ({ ...prev, open: false }));
                                        await deletePrayer(prayer);
                                        showToast('Permohonan doa dihapus.');
                                      },
                                    })
                                  }
                                  className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Hapus</span>
                                </button>

                                <button
                                  type="button"
                                  disabled={savingPrayerId === prayer.id || (!hasChanges && prayer.status === draftStatus)}
                                  onClick={() => handleSavePrayer(prayer)}
                                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>
                                    {savingPrayerId === prayer.id
                                      ? 'Menyimpan...'
                                      : 'Simpan Status & Catatan'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* TAB 9: LOG AKTIVITAS (APLIKASI & GOOGLE SHEETS) */}
          {activeTab === 'log' && (() => {
            const allLogs = data.activityLogs || [];
            const categories: ('Semua' | ActivityLogCategory)[] = [
              'Semua',
              'Autentikasi',
              'Warta',
              'Jadwal',
              'Liturgi',
              'Nyanyian',
              'Galeri',
              'Keuangan',
              'Statistik',
              'Layanan',
              'Kotak Doa',
              'Akun',
              'Sinkronisasi',
            ];
            const query = logSearch.trim().toLowerCase();
            const filteredLogs = allLogs.filter((item) => {
              const matchesCategory =
                logCategoryFilter === 'Semua' || item.category === logCategoryFilter;
              if (!matchesCategory) return false;
              if (!query) return true;
              return (
                item.action.toLowerCase().includes(query) ||
                item.detail.toLowerCase().includes(query) ||
                item.actor.toLowerCase().includes(query) ||
                item.category.toLowerCase().includes(query)
              );
            });
            const dbSheetUrl =
              data.syncConfig.spreadsheetUrl ||
              (data.syncConfig.spreadsheetId
                ? `https://docs.google.com/spreadsheets/d/${data.syncConfig.spreadsheetId}`
                : '');

            return (
              <div className="space-y-6">
                {/* Ringkasan & Status Sinkronisasi Spreadsheet */}
                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
                        <History className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
                        <span>Catatan Log Aktivitas Portal</span>
                      </h2>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600 dark:text-stone-400">
                        Setiap aktivitas pengurus dan pengajuan layanan jemaat dicatat di aplikasi (<strong className="font-tabular">{allLogs.length}</strong> catatan) dan otomatis tersinkron ke tab{' '}
                        <code className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-semibold dark:bg-stone-800">
                          Log Aktivitas
                        </code>{' '}
                        pada Spreadsheet Database Portal.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!isGoogleConnected ? (
                        <button
                          type="button"
                          onClick={connectGoogleWorkspace}
                          className="gsi-material-button"
                        >
                          <div className="gsi-material-button-content-wrapper">
                            <div className="gsi-material-button-icon">
                              <svg viewBox="0 0 48 48" className="block h-full w-full">
                                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                              </svg>
                            </div>
                            <span className="gsi-material-button-contents">Sign in with Google</span>
                          </div>
                        </button>
                      ) : data.syncConfig.spreadsheetId ? (
                        <>
                          <a
                            href={dbSheetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-stone-300 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            <span>Buka Tab Log Aktivitas di Sheets</span>
                          </a>
                          <button
                            type="button"
                            disabled={isSyncingWorkspace}
                            onClick={() =>
                              setConfirmAction({
                                open: true,
                                title: 'Sinkronkan Log Aktivitas ke Google Sheets?',
                                description: `Seluruh ${allLogs.length} catatan log aktivitas saat ini akan ditulis ke tab "Log Aktivitas" pada Spreadsheet Database Portal yang terhubung.`,
                                confirmLabel: 'Sinkronkan ke Sheets',
                                onConfirm: async () => {
                                  setConfirmAction((prev) => ({ ...prev, open: false }));
                                  await syncNowToWorkspace();
                                },
                              })
                            }
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                          >
                            <RefreshCw className={`h-3.5 w-3.5 ${isSyncingWorkspace ? 'animate-spin' : ''}`} />
                            <span>Sinkronkan Log ke Sheets</span>
                          </button>
                        </>
                      ) : (
                        isSuperUser && (
                          <button
                            type="button"
                            disabled={isSyncingWorkspace}
                            onClick={provisionChurchSpreadsheet}
                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#7F1D1D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#68151B] disabled:opacity-50 cursor-pointer"
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                            <span>Buat Google Sheet Database & Tab Log</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {dbSheetUrl && !isGoogleConnected && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs text-stone-500 dark:border-stone-800 dark:text-stone-400">
                      <span>Spreadsheet terhubung: Database Portal GPI Getsemani Sorong</span>
                      <a
                        href={dbSheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Buka Spreadsheet</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Filter & Daftar Log */}
                <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
                  <div className="flex flex-col gap-3 border-b border-stone-100 pb-4 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                      <div className="relative flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                          type="text"
                          value={logSearch}
                          onChange={(e) => setLogSearch(e.target.value)}
                          placeholder="Cari aktivitas, pengguna, atau detail..."
                          className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2 pr-3 pl-9 text-xs dark:border-stone-700 dark:bg-stone-800"
                        />
                      </div>
                      <select
                        value={logCategoryFilter}
                        onChange={(e) =>
                          setLogCategoryFilter(e.target.value as 'Semua' | ActivityLogCategory)
                        }
                        className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold dark:border-stone-700 dark:bg-stone-800"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat === 'Semua' ? 'Semua Kategori' : cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {isSuperUser && allLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmAction({
                            open: true,
                            title: 'Bersihkan Riwayat Log Aktivitas?',
                            description:
                              'Seluruh catatan log aktivitas sebelumnya akan dihapus dari portal (dan diperbarui di tab Log Aktivitas pada sinkronisasi berikutnya).',
                            confirmLabel: 'Bersihkan Log',
                            destructive: true,
                            onConfirm: () => {
                              clearActivityLogs();
                              setConfirmAction((prev) => ({ ...prev, open: false }));
                              showToast('Riwayat log aktivitas telah dibersihkan.');
                            },
                          })
                        }
                        className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Bersihkan Log</span>
                      </button>
                    )}
                  </div>

                  {filteredLogs.length === 0 ? (
                    <p className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
                      Belum ada catatan log aktivitas yang cocok dengan filter.
                    </p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[640px] text-left text-xs">
                        <thead>
                          <tr className="border-b border-stone-200 text-stone-500 dark:border-stone-800 dark:text-stone-400">
                            <th className="py-2.5 pr-3 font-semibold">Waktu</th>
                            <th className="py-2.5 px-3 font-semibold">Pengguna</th>
                            <th className="py-2.5 px-3 font-semibold">Kategori</th>
                            <th className="py-2.5 pl-3 font-semibold">Aksi & Keterangan</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                          {filteredLogs.map((log) => (
                            <tr
                              key={log.id}
                              className="align-top hover:bg-stone-50/70 dark:hover:bg-stone-800/40"
                            >
                              <td className="font-tabular whitespace-nowrap py-3 pr-3 text-stone-500 dark:text-stone-400">
                                {new Date(log.timestamp).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="whitespace-nowrap py-3 px-3">
                                <p className="font-semibold text-stone-900 dark:text-stone-100">
                                  {log.actor}
                                </p>
                                <p className="text-[11px] uppercase tracking-wide text-stone-500 dark:text-stone-400">
                                  {log.role}
                                </p>
                              </td>
                              <td className="whitespace-nowrap py-3 px-3 font-semibold text-[#7F1D1D] dark:text-amber-400">
                                {log.category}
                              </td>
                              <td className="py-3 pl-3">
                                <p className="font-semibold text-stone-900 dark:text-stone-100">
                                  {log.action}
                                </p>
                                <p className="mt-0.5 text-stone-600 dark:text-stone-400">
                                  {log.detail}
                                </p>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </section>
      </div>

      <ConfirmDialog
        open={confirmAction.open}
        title={confirmAction.title}
        description={confirmAction.description}
        confirmLabel={confirmAction.confirmLabel}
        destructive={confirmAction.destructive}
        onConfirm={confirmAction.onConfirm}
        onCancel={() => setConfirmAction((prev) => ({ ...prev, open: false }))}
      />
    </div>
  );
};

function finCategorySafe(cat: FinanceEntry['category']) {
  return cat;
}
