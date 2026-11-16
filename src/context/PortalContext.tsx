import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { INITIAL_PORTAL_DATA } from '../data/initialData';
import {
  ActivityLogCategory,
  ActivityLogEntry,
  CongregationStatRow,
  Hymn,
  PageRoute,
  PortalDataState,
  UserRole,
  WorkspaceSyncConfig,
} from '../types/church';
import {
  createChurchDatabaseSpreadsheet,
  createMasterHymnSpreadsheet,
  fetchDriveImageAsDataUrl,
  fetchMasterHymnSpreadsheetPull,
  getWorkspaceAccessToken,
  initWorkspaceAuth,
  listDriveFolderFiles,
  signInWithGoogleWorkspace,
  signOutGoogleWorkspace,
  syncChurchDatabaseToSheets,
  syncDatabaseToDrive,
  syncMasterHymnSpreadsheetPush,
} from '../services/googleWorkspace';
import {
  loadSheetsOfflineCache,
  saveSheetsOfflineCache,
} from '../services/googleSheetsService';

const STORAGE_KEY = 'gpi_getsemani_portal_data_v1';
const THEME_KEY = 'gpi_getsemani_theme_v1';
const FONT_KEY = 'gpi_getsemani_font_scale_v1';
const AUTH_SESSION_KEY = 'gpi_getsemani_admin_session_v1';

export type FontScaleLevel = 0 | 1 | 2 | 3;

export interface LogActivityParams {
  category: ActivityLogCategory;
  action: string;
  detail: string;
  actorOverride?: string;
  roleOverride?: UserRole;
}

interface PortalContextValue {
  data: PortalDataState;
  updateData: (updater: (prev: PortalDataState) => PortalDataState) => void;
  resetDemoData: () => void;
  logActivity: (params: LogActivityParams) => void;
  clearActivityLogs: () => void;
  route: PageRoute;
  setRoute: (route: PageRoute) => void;
  isDark: boolean;
  toggleDark: () => void;
  fontScale: FontScaleLevel;
  increaseFont: () => void;
  decreaseFont: () => void;
  readingTextClass: string;
  currentUserRole: UserRole | null;
  currentUsername: string | null;
  loginAdmin: (username: string, password: string) => { ok: boolean; message: string };
  loginDemo: (username: 'superuser' | 'admin1' | 'admin2' | 'jemaat') => void;
  logoutAdmin: () => void;
  // Google Workspace
  googleUser: User | null;
  isGoogleConnected: boolean;
  isSyncingWorkspace: boolean;
  workspaceNotice: string | null;
  clearWorkspaceNotice: () => void;
  connectGoogleWorkspace: () => Promise<void>;
  disconnectGoogleWorkspace: () => Promise<void>;
  syncNowToWorkspace: () => Promise<void>;
  provisionChurchSpreadsheet: () => Promise<void>;
  provisionMasterHymnSpreadsheet: () => Promise<void>;
  pullFromMasterHymnSpreadsheet: () => Promise<number>;
  pushToMasterHymnSpreadsheet: () => Promise<void>;
  applyCachedSheetsData: (payload: {
    hymns?: Hymn[];
    statistics?: CongregationStatRow[];
    syncPatch?: Partial<WorkspaceSyncConfig>;
  }) => void;
  refreshLogoFromDrive: () => Promise<void>;
}

const PortalContext = createContext<PortalContextValue | null>(null);

function loadStoredData(): PortalDataState {
  const sheetsCache = loadSheetsOfflineCache();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...INITIAL_PORTAL_DATA,
        hymns: sheetsCache.hymns?.data?.length
          ? sheetsCache.hymns.data
          : INITIAL_PORTAL_DATA.hymns,
        statistics: sheetsCache.statistics?.data?.length
          ? sheetsCache.statistics.data
          : INITIAL_PORTAL_DATA.statistics,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PortalDataState>;
    return {
      ...INITIAL_PORTAL_DATA,
      ...parsed,
      profile: {
        ...INITIAL_PORTAL_DATA.profile,
        ...(parsed.profile || {}),
      },
      syncConfig: {
        ...INITIAL_PORTAL_DATA.syncConfig,
        ...(parsed.syncConfig || {}),
      },
      liturgy: {
        ...INITIAL_PORTAL_DATA.liturgy,
        ...(parsed.liturgy || {}),
      },
      unsurLiturgies:
        parsed.unsurLiturgies && parsed.unsurLiturgies.length > 0
          ? parsed.unsurLiturgies
          : INITIAL_PORTAL_DATA.unsurLiturgies,
      hymns:
        parsed.hymns && parsed.hymns.length > 0
          ? parsed.hymns
          : sheetsCache.hymns?.data?.length
          ? sheetsCache.hymns.data
          : INITIAL_PORTAL_DATA.hymns,
      statistics:
        parsed.statistics && parsed.statistics.length > 0
          ? parsed.statistics
          : sheetsCache.statistics?.data?.length
          ? sheetsCache.statistics.data
          : INITIAL_PORTAL_DATA.statistics,
      adminAccounts: (() => {
        const base = INITIAL_PORTAL_DATA.adminAccounts;
        if (!parsed.adminAccounts || parsed.adminAccounts.length === 0) return base;
        const merged = [...parsed.adminAccounts];
        base.forEach((b) => {
          if (!merged.some((m) => m.username.toLowerCase() === b.username.toLowerCase())) {
            merged.push(b);
          }
        });
        return merged;
      })(),
      prayerRequests: Array.isArray(parsed.prayerRequests)
        ? parsed.prayerRequests
        : INITIAL_PORTAL_DATA.prayerRequests,
      activityLogs: Array.isArray(parsed.activityLogs)
        ? parsed.activityLogs
        : INITIAL_PORTAL_DATA.activityLogs,
    };
  } catch {
    return INITIAL_PORTAL_DATA;
  }
}

const MAX_ACTIVITY_LOGS = 300;

function makeActivityEntry(
  params: LogActivityParams,
  fallbackActor: string | null,
  fallbackRole: UserRole | null
): ActivityLogEntry {
  const role = params.roleOverride || fallbackRole || 'jemaat';
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    actor: params.actorOverride || fallbackActor || (role === 'jemaat' ? 'Jemaat' : role),
    role,
    category: params.category,
    action: params.action,
    detail: params.detail,
  };
}

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<PortalDataState>(() => loadStoredData());
  const [route, setRouteState] = useState<PageRoute>('beranda');

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  const [fontScale, setFontScale] = useState<FontScaleLevel>(() => {
    try {
      const saved = Number(localStorage.getItem(FONT_KEY));
      if (saved === 0 || saved === 1 || saved === 2 || saved === 3) return saved;
      return 1;
    } catch {
      return 1;
    }
  });

  const [currentUserRole, setCurrentUserRole] = useState<UserRole | null>(() => {
    try {
      const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.role || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [currentUsername, setCurrentUsername] = useState<string | null>(() => {
    try {
      const raw = sessionStorage.getItem(AUTH_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.username || null;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncingWorkspace, setIsSyncingWorkspace] = useState(false);
  const [workspaceNotice, setWorkspaceNotice] = useState<string | null>(null);

  const syncTimerRef = useRef<number | null>(null);

  // Apply Dark Mode class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  // Persist fontScale
  useEffect(() => {
    try {
      localStorage.setItem(FONT_KEY, String(fontScale));
    } catch {
      // ignore
    }
  }, [fontScale]);

  // Cross-tab real-time localStorage sync
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setData(loadStoredData());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Firebase Auth listener for Google Workspace OAuth token
  useEffect(() => {
    const unsub = initWorkspaceAuth(
      (user) => {
        setGoogleUser(user);
        setIsGoogleConnected(true);
      },
      (user) => {
        setGoogleUser(user);
        setIsGoogleConnected(false);
      }
    );
    return () => unsub();
  }, []);

  const setRoute = useCallback((nextRoute: PageRoute) => {
    setRouteState(nextRoute);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const persistData = useCallback((nextData: PortalDataState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    } catch {
      // ignore quota issues
    }
  }, []);

  const performBackgroundSync = useCallback(
    async (latestData: PortalDataState) => {
      const token = getWorkspaceAccessToken();
      if (!token || !latestData.syncConfig.autoSyncEnabled) return;
      try {
        setIsSyncingWorkspace(true);
        const driveRes = await syncDatabaseToDrive(
          latestData,
          latestData.syncConfig.driveBackupFileId || undefined,
          token
        );
        if (latestData.syncConfig.spreadsheetId) {
          await syncChurchDatabaseToSheets(latestData.syncConfig.spreadsheetId, latestData, token);
        }
        if (latestData.syncConfig.masterHymnsSheetId) {
          await syncMasterHymnSpreadsheetPush(
            latestData.syncConfig.masterHymnsSheetId,
            latestData.hymns,
            token
          );
        }
        setData((curr) => {
          const updated: PortalDataState = {
            ...curr,
            syncConfig: {
              ...curr.syncConfig,
              driveBackupFileId: driveRes.fileId,
              lastSyncedAt: new Date().toISOString(),
            },
          };
          persistData(updated);
          return updated;
        });
      } catch (err) {
        console.error('Auto-sync error:', err);
      } finally {
        setIsSyncingWorkspace(false);
      }
    },
    [persistData]
  );

  const updateData = useCallback(
    (updater: (prev: PortalDataState) => PortalDataState) => {
      setData((prev) => {
        const next = updater(prev);
        persistData(next);
        if (getWorkspaceAccessToken() && next.syncConfig.autoSyncEnabled) {
          if (syncTimerRef.current) window.clearTimeout(syncTimerRef.current);
          syncTimerRef.current = window.setTimeout(() => {
            performBackgroundSync(next);
          }, 1800);
        }
        return next;
      });
    },
    [persistData, performBackgroundSync]
  );

  const logActivity = useCallback(
    (params: LogActivityParams) => {
      const entry = makeActivityEntry(params, currentUsername, currentUserRole);
      updateData((prev) => ({
        ...prev,
        activityLogs: [entry, ...(prev.activityLogs || [])].slice(0, MAX_ACTIVITY_LOGS),
      }));
    },
    [currentUserRole, currentUsername, updateData]
  );

  const clearActivityLogs = useCallback(() => {
    const entry = makeActivityEntry(
      {
        category: 'Sinkronisasi',
        action: 'Bersihkan Riwayat Log Aktivitas',
        detail: 'Riwayat log sebelumnya telah dibersihkan oleh Super User.',
      },
      currentUsername,
      currentUserRole
    );
    updateData((prev) => ({
      ...prev,
      activityLogs: [entry],
    }));
  }, [currentUserRole, currentUsername, updateData]);

  const resetDemoData = useCallback(() => {
    const entry = makeActivityEntry(
      {
        category: 'Akun',
        action: 'Pulihkan Data Awal Portal',
        detail: 'Data LocalStorage dikembalikan ke data awal GPI Getsemani Sorong.',
      },
      currentUsername,
      currentUserRole
    );
    const restored: PortalDataState = {
      ...INITIAL_PORTAL_DATA,
      activityLogs: [entry, ...INITIAL_PORTAL_DATA.activityLogs].slice(0, MAX_ACTIVITY_LOGS),
    };
    persistData(restored);
    setData(restored);
    setWorkspaceNotice('Data contoh jemaat berhasil dipulihkan.');
  }, [currentUserRole, currentUsername, persistData]);

  const toggleDark = useCallback(() => setIsDark((d) => !d), []);

  const increaseFont = useCallback(() => {
    setFontScale((prev) => (prev < 3 ? ((prev + 1) as FontScaleLevel) : prev));
  }, []);

  const decreaseFont = useCallback(() => {
    setFontScale((prev) => (prev > 0 ? ((prev - 1) as FontScaleLevel) : prev));
  }, []);

  const readingTextClass =
    fontScale === 0
      ? 'text-[15px] leading-[1.65]'
      : fontScale === 1
      ? 'text-[17px] leading-[1.75]'
      : fontScale === 2
      ? 'text-[20px] leading-[1.8]'
      : 'text-[23px] leading-[1.85]';

  const loginAdmin = useCallback(
    (username: string, password: string) => {
      const normalized = username.trim().toLowerCase();
      const trimmedPass = password.trim();
      if (!normalized || !trimmedPass) {
        return { ok: false, message: 'Harap masukkan nama pengguna dan kata sandi.' };
      }
      const account = data.adminAccounts.find(
        (acc) => acc.username.toLowerCase() === normalized
      );
      if (!account) {
        return { ok: false, message: 'Nama pengguna tidak terdaftar dalam sistem.' };
      }
      const isPasswordMatch =
        account.password === trimmedPass ||
        (account.username === 'jemaat' && (trimmedPass === 'getsemani' || trimmedPass === 'jemaat123'));
      if (!isPasswordMatch) {
        return { ok: false, message: 'Kata sandi tidak sesuai. Silakan coba lagi.' };
      }
      setCurrentUserRole(account.role);
      setCurrentUsername(account.username);
      sessionStorage.setItem(
        AUTH_SESSION_KEY,
        JSON.stringify({ role: account.role, username: account.username })
      );
      logActivity({
        category: 'Autentikasi',
        action: 'Login Berhasil',
        detail: `${account.displayName} (${account.username}) berhasil masuk ke sistem portal.`,
        actorOverride: account.username,
        roleOverride: account.role,
      });
      setRoute('beranda');
      return { ok: true, message: `Selamat datang, ${account.displayName}.` };
    },
    [data.adminAccounts, logActivity, setRoute]
  );

  const loginDemo = useCallback(
    (username: 'superuser' | 'admin1' | 'admin2' | 'jemaat') => {
      const account = data.adminAccounts.find((a) => a.username === username);
      if (!account) return;
      setCurrentUserRole(account.role);
      setCurrentUsername(account.username);
      sessionStorage.setItem(
        AUTH_SESSION_KEY,
        JSON.stringify({ role: account.role, username: account.username })
      );
      logActivity({
        category: 'Autentikasi',
        action: 'Login Cepat',
        detail: `${account.displayName} (${account.username}) masuk ke sistem portal.`,
        actorOverride: account.username,
        roleOverride: account.role,
      });
      setRoute('beranda');
    },
    [data.adminAccounts, logActivity, setRoute]
  );

  const logoutAdmin = useCallback(() => {
    const prevUser = currentUsername || 'Pengguna';
    const prevRole = currentUserRole;
    logActivity({
      category: 'Autentikasi',
      action: 'Logout',
      detail: `Pengguna ${prevUser} keluar dari sistem portal.`,
      actorOverride: prevUser,
      roleOverride: prevRole || 'jemaat',
    });
    setCurrentUserRole(null);
    setCurrentUsername(null);
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setRoute('login');
  }, [currentUserRole, currentUsername, logActivity, setRoute]);

  const refreshLogoFromDriveInternal = useCallback(
    async (folderId: string, token: string) => {
      const files = await listDriveFolderFiles(folderId, token);
      const imageFile = files.find((f) => f.mimeType.startsWith('image/'));
      if (imageFile) {
        const dataUrl = await fetchDriveImageAsDataUrl(imageFile.id, token);
        setData((prev) => {
          const next: PortalDataState = {
            ...prev,
            profile: { ...prev.profile, logoUrl: dataUrl },
          };
          persistData(next);
          return next;
        });
        return imageFile.name;
      }
      return null;
    },
    [persistData]
  );

  const connectGoogleWorkspace = useCallback(async () => {
    setIsSyncingWorkspace(true);
    try {
      const { user, accessToken } = await signInWithGoogleWorkspace();
      setGoogleUser(user);
      setIsGoogleConnected(true);
      let logoMsg = '';
      try {
        const foundLogo = await refreshLogoFromDriveInternal(
          data.profile.logoDriveFolderId,
          accessToken
        );
        if (foundLogo) logoMsg = ` Logo "${foundLogo}" dimuat dari Drive.`;
      } catch {
        // Folder might not be shared with the currently logged-in Google user; keep fallback emblem
      }
      logActivity({
        category: 'Sinkronisasi',
        action: 'Hubungkan Akun Google Workspace',
        detail: `Terhubung dengan akun ${user.email || 'Google'}.${logoMsg}`,
      });
      setWorkspaceNotice(`Terhubung dengan Google (${user.email}).${logoMsg}`);
    } catch (err) {
      setWorkspaceNotice(
        err instanceof Error ? err.message : 'Gagal menghubungkan Google Workspace.'
      );
    } finally {
      setIsSyncingWorkspace(false);
    }
  }, [data.profile.logoDriveFolderId, logActivity, refreshLogoFromDriveInternal]);

  const disconnectGoogleWorkspace = useCallback(async () => {
    const email = googleUser?.email || 'Google';
    await signOutGoogleWorkspace();
    setGoogleUser(null);
    setIsGoogleConnected(false);
    logActivity({
      category: 'Sinkronisasi',
      action: 'Putuskan Koneksi Google Workspace',
      detail: `Koneksi akun ${email} diputuskan dari sesi portal.`,
    });
    setWorkspaceNotice('Koneksi Google Drive & Sheets telah diputus.');
  }, [googleUser?.email, logActivity]);

  const syncNowToWorkspace = useCallback(async () => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      setWorkspaceNotice('Silakan hubungkan akun Google terlebih dahulu.');
      return;
    }
    setIsSyncingWorkspace(true);
    try {
      const syncEntry = makeActivityEntry(
        {
          category: 'Sinkronisasi',
          action: 'Sinkronisasi Manual ke Drive & Sheets',
          detail: `Sinkronisasi database portal (${data.hymns.length} lagu, ${data.statistics.length} unit, ${(data.activityLogs?.length || 0) + 1} log aktivitas).`,
        },
        currentUsername,
        currentUserRole
      );
      const nextLogs = [syncEntry, ...(data.activityLogs || [])].slice(0, MAX_ACTIVITY_LOGS);
      const dataWithLog: PortalDataState = { ...data, activityLogs: nextLogs };

      const driveRes = await syncDatabaseToDrive(
        dataWithLog,
        dataWithLog.syncConfig.driveBackupFileId || undefined,
        token
      );
      if (dataWithLog.syncConfig.spreadsheetId) {
        await syncChurchDatabaseToSheets(dataWithLog.syncConfig.spreadsheetId, dataWithLog, token);
      }
      if (dataWithLog.syncConfig.masterHymnsSheetId) {
        await syncMasterHymnSpreadsheetPush(
          dataWithLog.syncConfig.masterHymnsSheetId,
          dataWithLog.hymns,
          token
        );
      }
      const syncedTime = new Date().toISOString();
      setData((prev) => {
        const updated: PortalDataState = {
          ...prev,
          activityLogs: [syncEntry, ...(prev.activityLogs || [])].slice(0, MAX_ACTIVITY_LOGS),
          syncConfig: {
            ...prev.syncConfig,
            driveBackupFileId: driveRes.fileId,
            lastSyncedAt: syncedTime,
          },
        };
        persistData(updated);
        return updated;
      });
      setWorkspaceNotice('Data portal & Log Aktivitas berhasil disinkronkan ke Google Drive dan Google Sheets.');
    } catch (err) {
      setWorkspaceNotice(
        err instanceof Error ? err.message : 'Sinkronisasi ke Google Workspace gagal.'
      );
    } finally {
      setIsSyncingWorkspace(false);
    }
  }, [currentUserRole, currentUsername, data, persistData]);

  const provisionChurchSpreadsheet = useCallback(async () => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      setWorkspaceNotice('Silakan masuk dengan Google terlebih dahulu.');
      return;
    }
    setIsSyncingWorkspace(true);
    try {
      const provisionEntry = makeActivityEntry(
        {
          category: 'Sinkronisasi',
          action: 'Buat Spreadsheet Database Portal',
          detail: 'Membuat Google Spreadsheet Database Portal (Statistik, Jadwal, Warta, Keuangan, Nyanyian, Log Aktivitas).',
        },
        currentUsername,
        currentUserRole
      );
      const nextLogs = [provisionEntry, ...(data.activityLogs || [])].slice(0, MAX_ACTIVITY_LOGS);
      const dataWithLog: PortalDataState = { ...data, activityLogs: nextLogs };
      const created = await createChurchDatabaseSpreadsheet(dataWithLog, token);
      setData((prev) => {
        const updated: PortalDataState = {
          ...prev,
          activityLogs: [provisionEntry, ...(prev.activityLogs || [])].slice(0, MAX_ACTIVITY_LOGS),
          syncConfig: {
            ...prev.syncConfig,
            spreadsheetId: created.spreadsheetId,
            spreadsheetUrl: created.spreadsheetUrl,
            lastSyncedAt: new Date().toISOString(),
          },
        };
        persistData(updated);
        return updated;
      });
      setWorkspaceNotice('Spreadsheet Database Gereja (termasuk tab Log Aktivitas) berhasil dibuat dan disinkronkan.');
    } catch (err) {
      setWorkspaceNotice(
        err instanceof Error ? err.message : 'Gagal membuat Spreadsheet Google Sheets.'
      );
    } finally {
      setIsSyncingWorkspace(false);
    }
  }, [currentUserRole, currentUsername, data, persistData]);

  const provisionMasterHymnSpreadsheet = useCallback(async () => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      setWorkspaceNotice('Silakan masuk dengan Google terlebih dahulu.');
      return;
    }
    setIsSyncingWorkspace(true);
    try {
      const created = await createMasterHymnSpreadsheet(data.hymns, token);
      const entry = makeActivityEntry(
        {
          category: 'Nyanyian',
          action: 'Buat Master Spreadsheet Lagu Rohani',
          detail: `Spreadsheet 5 tab (KJ, NKB, PKJ, DSL, NR) dibuat (${created.spreadsheetId}).`,
        },
        currentUsername,
        currentUserRole
      );
      setData((prev) => {
        const updated: PortalDataState = {
          ...prev,
          activityLogs: [entry, ...(prev.activityLogs || [])].slice(0, MAX_ACTIVITY_LOGS),
          syncConfig: {
            ...prev.syncConfig,
            masterHymnsSheetId: created.spreadsheetId,
            masterHymnsSheetUrl: created.spreadsheetUrl,
            lastSyncedAt: new Date().toISOString(),
          },
        };
        persistData(updated);
        return updated;
      });
      setWorkspaceNotice(
        'Master Spreadsheet Lagu Rohani (5 Tab: KJ, NKB, PKJ, DSL, NR) berhasil dibuat dan disinkronkan.'
      );
    } catch (err) {
      setWorkspaceNotice(
        err instanceof Error
          ? err.message
          : 'Gagal membuat Master Spreadsheet Lagu Rohani.'
      );
    } finally {
      setIsSyncingWorkspace(false);
    }
  }, [currentUserRole, currentUsername, data.hymns, persistData]);

  const pullFromMasterHymnSpreadsheet = useCallback(async (): Promise<number> => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      setWorkspaceNotice('Silakan masuk dengan Google terlebih dahulu.');
      return 0;
    }
    if (!data.syncConfig.masterHymnsSheetId) {
      setWorkspaceNotice('Belum ada Master Spreadsheet Lagu Rohani yang terhubung.');
      return 0;
    }
    setIsSyncingWorkspace(true);
    try {
      const pulledHymns = await fetchMasterHymnSpreadsheetPull(
        data.syncConfig.masterHymnsSheetId,
        token
      );
      if (pulledHymns.length === 0) {
        setWorkspaceNotice(
          'Tidak ada baris lagu yang ditemukan pada ke-5 tab Master Spreadsheet.'
        );
        return 0;
      }
      const syncedTime = new Date().toISOString();
      saveSheetsOfflineCache({
        hymns: {
          data: pulledHymns,
          spreadsheetId: data.syncConfig.masterHymnsSheetId,
          cachedAt: syncedTime,
        },
      });
      const entry = makeActivityEntry(
        {
          category: 'Nyanyian',
          action: 'Tarik Lagu dari Master Spreadsheet',
          detail: `${pulledHymns.length} lagu disinkronkan dari ke-5 tab Master Spreadsheet ke portal & cache offline.`,
        },
        currentUsername,
        currentUserRole
      );
      setData((prev) => {
        const updated: PortalDataState = {
          ...prev,
          hymns: pulledHymns,
          activityLogs: [entry, ...(prev.activityLogs || [])].slice(0, MAX_ACTIVITY_LOGS),
          syncConfig: {
            ...prev.syncConfig,
            lastSyncedAt: syncedTime,
          },
        };
        persistData(updated);
        return updated;
      });
      setWorkspaceNotice(
        `${pulledHymns.length} lagu berhasil ditarik dari Master Spreadsheet (5 Tab) dan disimpan ke cache offline.`
      );
      return pulledHymns.length;
    } catch (err) {
      setWorkspaceNotice(
        err instanceof Error
          ? err.message
          : 'Gagal menarik lagu dari Master Spreadsheet.'
      );
      return 0;
    } finally {
      setIsSyncingWorkspace(false);
    }
  }, [currentUserRole, currentUsername, data.syncConfig.masterHymnsSheetId, persistData]);

  const pushToMasterHymnSpreadsheet = useCallback(async () => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      setWorkspaceNotice('Silakan masuk dengan Google terlebih dahulu.');
      return;
    }
    if (!data.syncConfig.masterHymnsSheetId) {
      setWorkspaceNotice('Belum ada Master Spreadsheet Lagu Rohani yang terhubung.');
      return;
    }
    setIsSyncingWorkspace(true);
    try {
      await syncMasterHymnSpreadsheetPush(
        data.syncConfig.masterHymnsSheetId,
        data.hymns,
        token
      );
      const entry = makeActivityEntry(
        {
          category: 'Nyanyian',
          action: 'Kirim Lagu ke Master Spreadsheet',
          detail: `${data.hymns.length} lagu dikirim ke 5 tab Master Spreadsheet (KJ, NKB, PKJ, DSL, NR).`,
        },
        currentUsername,
        currentUserRole
      );
      setData((prev) => {
        const updated: PortalDataState = {
          ...prev,
          activityLogs: [entry, ...(prev.activityLogs || [])].slice(0, MAX_ACTIVITY_LOGS),
          syncConfig: {
            ...prev.syncConfig,
            lastSyncedAt: new Date().toISOString(),
          },
        };
        persistData(updated);
        return updated;
      });
      setWorkspaceNotice(
        `${data.hymns.length} lagu berhasil disinkronkan ke Master Spreadsheet Lagu Rohani (5 Tab).`
      );
    } catch (err) {
      setWorkspaceNotice(
        err instanceof Error
          ? err.message
          : 'Gagal mengirim lagu ke Master Spreadsheet.'
      );
    } finally {
      setIsSyncingWorkspace(false);
    }
  }, [currentUserRole, currentUsername, data.hymns, data.syncConfig.masterHymnsSheetId, persistData]);

  const refreshLogoFromDrive = useCallback(async () => {
    const token = getWorkspaceAccessToken();
    if (!token) {
      setWorkspaceNotice('Hubungkan akun Google untuk mengambil logo dari folder Drive.');
      return;
    }
    setIsSyncingWorkspace(true);
    try {
      const name = await refreshLogoFromDriveInternal(data.profile.logoDriveFolderId, token);
      if (name) {
        logActivity({
          category: 'Sinkronisasi',
          action: 'Perbarui Logo Gereja dari Drive',
          detail: `Logo "${name}" dimuat ulang dari folder Google Drive.`,
        });
        setWorkspaceNotice(`Logo "${name}" berhasil diperbarui dari Google Drive.`);
      } else {
        setWorkspaceNotice('Tidak ditemukan berkas gambar di folder Drive tersebut.');
      }
    } catch (err) {
      setWorkspaceNotice(
        err instanceof Error ? err.message : 'Gagal membaca folder Google Drive.'
      );
    } finally {
      setIsSyncingWorkspace(false);
    }
  }, [data.profile.logoDriveFolderId, logActivity, refreshLogoFromDriveInternal]);

  const applyCachedSheetsData = useCallback(
    (payload: {
      hymns?: Hymn[];
      statistics?: CongregationStatRow[];
      syncPatch?: Partial<WorkspaceSyncConfig>;
    }) => {
      setData((prev) => {
        const updated: PortalDataState = {
          ...prev,
          hymns: payload.hymns ?? prev.hymns,
          statistics: payload.statistics ?? prev.statistics,
          syncConfig: payload.syncPatch
            ? { ...prev.syncConfig, ...payload.syncPatch }
            : prev.syncConfig,
        };
        persistData(updated);
        return updated;
      });
    },
    [persistData]
  );

  return (
    <PortalContext.Provider
      value={{
        data,
        updateData,
        resetDemoData,
        logActivity,
        clearActivityLogs,
        route,
        setRoute,
        isDark,
        toggleDark,
        fontScale,
        increaseFont,
        decreaseFont,
        readingTextClass,
        currentUserRole,
        currentUsername,
        loginAdmin,
        loginDemo,
        logoutAdmin,
        googleUser,
        isGoogleConnected,
        isSyncingWorkspace,
        workspaceNotice,
        clearWorkspaceNotice: () => setWorkspaceNotice(null),
        connectGoogleWorkspace,
        disconnectGoogleWorkspace,
        syncNowToWorkspace,
        provisionChurchSpreadsheet,
        provisionMasterHymnSpreadsheet,
        pullFromMasterHymnSpreadsheet,
        pushToMasterHymnSpreadsheet,
        applyCachedSheetsData,
        refreshLogoFromDrive,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error('usePortal must be used inside PortalProvider');
  return ctx;
}
