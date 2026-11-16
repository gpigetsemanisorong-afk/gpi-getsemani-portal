import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  RefreshCw,
  WifiOff,
} from 'lucide-react';
import { usePortal } from '../context/PortalContext';
import { useGoogleSheetsSync } from '../hooks/useGoogleSheetsSync';
import {
  fetchSheetValues,
  fetchSpreadsheetMetadata,
  getWorkspaceAccessToken,
  parseCongregationStatsFromSheet,
  SheetMetadata,
} from '../services/googleWorkspace';
import { saveSheetsOfflineCache } from '../services/googleSheetsService';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { StatistikJemaatCharts } from '../components/StatistikJemaatCharts';
import { CongregationStatRow } from '../types/church';

export const DataStatistikPage: React.FC = () => {
  const {
    data,
    updateData,
    logActivity,
    isGoogleConnected,
    connectGoogleWorkspace,
    currentUserRole,
  } = usePortal();
  const {
    isOnline,
    isFetchingStats,
    offlineCache,
    fetchAndCacheStatistics,
    statusMessage: hookStatusMsg,
    error: hookError,
  } = useGoogleSheetsSync();

  const [sheetInput, setSheetInput] = useState(data.syncConfig.externalStatsSheetId || '');
  const [sheetMeta, setSheetMeta] = useState<SheetMetadata | null>(null);
  const [selectedTab, setSelectedTab] = useState(data.syncConfig.externalStatsSheetName || '');
  const [previewRows, setPreviewRows] = useState<CongregationStatRow[] | null>(null);
  const [previewOnChart, setPreviewOnChart] = useState(true);
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const [confirmImportOpen, setConfirmImportOpen] = useState(false);

  const isPreviewActive = Boolean(previewRows && previewRows.length > 0 && previewOnChart);
  const displayedRows = isPreviewActive && previewRows ? previewRows : data.statistics;

  const totals = useMemo(() => {
    return displayedRows.reduce(
      (acc, r) => ({
        kk: acc.kk + r.kk,
        jiwa: acc.jiwa + r.jiwa,
        par: acc.par + r.par,
        pp: acc.pp + r.pp,
        perwata: acc.perwata + r.perwata,
        perpri: acc.perpri + r.perpri,
        lansia: acc.lansia + r.lansia,
      }),
      { kk: 0, jiwa: 0, par: 0, pp: 0, perwata: 0, perpri: 0, lansia: 0 }
    );
  }, [displayedRows]);

  const sectorCount = useMemo(
    () => new Set(displayedRows.map((r) => r.sektor).filter(Boolean)).size,
    [displayedRows]
  );

  const unitSummaryText = useMemo(() => {
    const names = displayedRows.map((r) => r.unit.replace(/^Unit\s+/i, ''));
    if (names.length <= 4) return names.join(', ') || 'Belum ada unit';
    return `${names.slice(0, 3).join(', ')} +${names.length - 3} lainnya`;
  }, [displayedRows]);

  const loadFromSpreadsheet = async (targetInput: string, preferredTab?: string) => {
    setSheetError(null);
    setImportSuccessMsg(null);
    const token = getWorkspaceAccessToken();
    if (!token) {
      setSheetError('Silakan hubungkan akun Google terlebih dahulu untuk membaca Google Sheet.');
      return;
    }
    if (!targetInput.trim()) {
      setSheetError('Masukkan URL atau ID Google Spreadsheet.');
      return;
    }
    setLoadingSheet(true);
    try {
      const meta = await fetchSpreadsheetMetadata(targetInput, token);
      setSheetMeta(meta);
      if (meta.sheets.length > 0) {
        const matchedTab =
          (preferredTab && meta.sheets.find((s) => s.title === preferredTab)?.title) ||
          meta.sheets[0].title;
        setSelectedTab(matchedTab);
        const rows = await fetchSheetValues(meta.spreadsheetId, matchedTab, token);
        const parsed = parseCongregationStatsFromSheet(rows);
        if (parsed.length === 0) {
          setSheetError(
            `Tab "${matchedTab}" belum memiliki baris data statistik yang terbaca. Periksa baris header kolom.`
          );
          setPreviewRows(null);
        } else {
          setPreviewRows(parsed);
          setPreviewOnChart(true);
        }
      }
    } catch (err) {
      setSheetError(err instanceof Error ? err.message : 'Gagal memuat metadata Google Sheet.');
    } finally {
      setLoadingSheet(false);
    }
  };

  const handleFetchTabPreview = async (tabTitle: string) => {
    setSelectedTab(tabTitle);
    const token = getWorkspaceAccessToken();
    if (!token || !sheetMeta) return;
    setLoadingSheet(true);
    setSheetError(null);
    setImportSuccessMsg(null);
    try {
      const rows = await fetchSheetValues(sheetMeta.spreadsheetId, tabTitle, token);
      const parsed = parseCongregationStatsFromSheet(rows);
      setPreviewRows(parsed);
      if (parsed.length === 0) {
        setSheetError(`Tab "${tabTitle}" tidak memiliki baris statistik yang valid.`);
      } else {
        setPreviewOnChart(true);
      }
    } catch (err) {
      setSheetError(err instanceof Error ? err.message : 'Gagal membaca isi tab sheet.');
    } finally {
      setLoadingSheet(false);
    }
  };

  const applyImportedStats = () => {
    if (!previewRows || previewRows.length === 0 || !sheetMeta) return;
    const count = previewRows.length;
    const now = new Date().toISOString();
    saveSheetsOfflineCache({
      statistics: {
        data: previewRows,
        spreadsheetId: sheetMeta.spreadsheetId,
        spreadsheetTitle: sheetMeta.title,
        tabTitle: selectedTab,
        cachedAt: now,
      },
    });
    updateData((prev) => ({
      ...prev,
      statistics: previewRows,
      syncConfig: {
        ...prev.syncConfig,
        externalStatsSheetId: sheetMeta.spreadsheetId,
        externalStatsSheetName: selectedTab,
        lastSyncedAt: now,
      },
    }));
    logActivity({
      category: 'Statistik',
      action: 'Impor Statistik Jemaat dari Google Sheets',
      detail: `${count} unit statistik diterapkan dari "${sheetMeta.title}" (tab "${selectedTab}").`,
    });
    setConfirmImportOpen(false);
    setPreviewRows(null);
    setImportSuccessMsg(
      `${count} baris statistik dari "${sheetMeta.title}" (tab "${selectedTab}") berhasil diterapkan dan disimpan ke cache offline.`
    );
  };

  const linkedSheetUrl = data.syncConfig.externalStatsSheetId
    ? `https://docs.google.com/spreadsheets/d/${data.syncConfig.externalStatsSheetId}`
    : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
            Data & Statistik Jemaat
          </h1>
          <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
            Visualisasi interaktif data warga jemaat per Sektor, Unit, dan Wadah Kategorial yang terintegrasi dengan Google Sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isOnline && (
            <span className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <WifiOff className="h-3.5 w-3.5" />
              <span>Mode Offline (Cache Tersimpan)</span>
            </span>
          )}
          {data.syncConfig.externalStatsSheetId && isGoogleConnected && (
            <button
              type="button"
              disabled={loadingSheet || isFetchingStats || !isOnline}
              onClick={() => fetchAndCacheStatistics()}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 cursor-pointer"
            >
              <RefreshCw
                className={`h-4 w-4 ${loadingSheet || isFetchingStats ? 'animate-spin' : ''}`}
              />
              <span>Tarik Ulang & Cache Offline</span>
            </button>
          )}
        </div>
      </div>

      {(hookStatusMsg || hookError || offlineCache.statistics?.cachedAt) && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-2.5 text-xs text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
          <div>
            {offlineCache.statistics?.cachedAt && (
              <span>
                Cache offline statistik:{' '}
                <strong className="font-tabular">
                  {offlineCache.statistics.data.length} unit
                </strong>{' '}
                (diperbarui {new Date(offlineCache.statistics.cachedAt).toLocaleString('id-ID')})
              </span>
            )}
            {hookStatusMsg && (
              <span className="ml-2 font-medium text-emerald-700 dark:text-emerald-400">
                · {hookStatusMsg}
              </span>
            )}
            {hookError && (
              <span className="ml-2 font-medium text-red-600 dark:text-red-400">
                · {hookError}
              </span>
            )}
          </div>
        </div>
      )}

      {isPreviewActive && sheetMeta && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          <div>
            <span className="font-bold">Mode Pratinjau Grafik Google Sheets:</span> Menampilkan{' '}
            <strong className="font-tabular">{previewRows?.length}</strong> unit dari{' '}
            <strong>{sheetMeta.title}</strong> (tab <em>{selectedTab}</em>). Data resmi portal belum ditimpa.
          </div>
          <button
            type="button"
            onClick={() => setPreviewOnChart(false)}
            className="rounded-lg border border-amber-400/70 bg-white px-3 py-1 font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-700 dark:bg-stone-900 dark:text-amber-200 cursor-pointer"
          >
            Kembali ke Data Aktif Portal
          </button>
        </div>
      )}

      {/* Ringkasan Angka */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            Total Kepala Keluarga
          </p>
          <p className="font-tabular mt-1.5 text-3xl font-bold text-[#7F1D1D] dark:text-amber-400">
            {totals.kk.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">KK Terdaftar</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            Total Warga Jemaat
          </p>
          <p className="font-tabular mt-1.5 text-3xl font-bold text-stone-900 dark:text-stone-100">
            {totals.jiwa.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">Jiwa Aktif</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            Sektor Pelayanan
          </p>
          <p className="font-tabular mt-1.5 text-3xl font-bold text-stone-900 dark:text-stone-100">
            {sectorCount}
          </p>
          <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">
            {Array.from(new Set(displayedRows.map((r) => r.sektor).filter(Boolean))).join(' & ') ||
              '-'}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <p className="text-xs font-semibold text-stone-500 dark:text-stone-400">
            Unit Pelayanan
          </p>
          <p className="font-tabular mt-1.5 text-3xl font-bold text-stone-900 dark:text-stone-100">
            {displayedRows.length}
          </p>
          <p className="mt-1 truncate text-xs text-stone-500 dark:text-stone-400">
            {unitSummaryText}
          </p>
        </div>
      </div>

      {/* Komponen Visualisasi Interaktif Recharts */}
      <StatistikJemaatCharts
        rows={displayedRows}
        title={
          isPreviewActive && sheetMeta
            ? `Pratinjau Grafik: ${sheetMeta.title} (${selectedTab})`
            : 'Visualisasi Ringkasan Jemaat'
        }
        subtitle={
          isPreviewActive
            ? 'Menampilkan grafik pratinjau langsung dari Google Sheets sebelum diterapkan ke portal.'
            : data.syncConfig.externalStatsSheetName
            ? `Sumber tersinkron: Google Sheets tab "${data.syncConfig.externalStatsSheetName}".`
            : 'Filter berdasarkan sektor atau ubah tampilan grafik per unit dan wadah kategorial.'
        }
      />

      {/* Tabel Rincian Sektor & Unit */}
      <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100">
            <BarChart3 className="h-4 w-4 text-amber-600" />
            <span>
              {isPreviewActive
                ? 'Tabel Pratinjau Data Google Sheets'
                : 'Tabel Rincian Statistik per Sektor & Unit'}
            </span>
          </h2>
          {linkedSheetUrl && (
            <a
              href={linkedSheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Buka Spreadsheet Terhubung</span>
            </a>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-semibold text-stone-500 dark:border-stone-800 dark:text-stone-400">
                <th className="py-2.5 pr-3">Sektor</th>
                <th className="py-2.5 pr-3">Unit</th>
                <th className="py-2.5 px-2 text-right">KK</th>
                <th className="py-2.5 px-2 text-right">Jiwa</th>
                <th className="py-2.5 px-2 text-right">PAR</th>
                <th className="py-2.5 px-2 text-right">PP</th>
                <th className="py-2.5 px-2 text-right">PRW</th>
                <th className="py-2.5 px-2 text-right">PRP</th>
                <th className="py-2.5 pl-2 text-right">Lansia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {displayedRows.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                  <td className="py-3 pr-3 font-medium text-stone-900 dark:text-stone-100">
                    {row.sektor}
                  </td>
                  <td className="py-3 pr-3 text-stone-700 dark:text-stone-300">{row.unit}</td>
                  <td className="font-tabular py-3 px-2 text-right">
                    {row.kk.toLocaleString('id-ID')}
                  </td>
                  <td className="font-tabular py-3 px-2 text-right font-bold text-[#7F1D1D] dark:text-amber-400">
                    {row.jiwa.toLocaleString('id-ID')}
                  </td>
                  <td className="font-tabular py-3 px-2 text-right">
                    {row.par.toLocaleString('id-ID')}
                  </td>
                  <td className="font-tabular py-3 px-2 text-right">
                    {row.pp.toLocaleString('id-ID')}
                  </td>
                  <td className="font-tabular py-3 px-2 text-right">
                    {row.perwata.toLocaleString('id-ID')}
                  </td>
                  <td className="font-tabular py-3 px-2 text-right">
                    {row.perpri.toLocaleString('id-ID')}
                  </td>
                  <td className="font-tabular py-3 pl-2 text-right">
                    {row.lansia.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-200 bg-stone-50/80 font-bold text-stone-900 dark:border-stone-700 dark:bg-stone-800/50 dark:text-stone-100">
                <td colSpan={2} className="py-3 pr-3">
                  Total Keseluruhan ({displayedRows.length} Unit)
                </td>
                <td className="font-tabular py-3 px-2 text-right">
                  {totals.kk.toLocaleString('id-ID')}
                </td>
                <td className="font-tabular py-3 px-2 text-right text-[#7F1D1D] dark:text-amber-400">
                  {totals.jiwa.toLocaleString('id-ID')}
                </td>
                <td className="font-tabular py-3 px-2 text-right">
                  {totals.par.toLocaleString('id-ID')}
                </td>
                <td className="font-tabular py-3 px-2 text-right">
                  {totals.pp.toLocaleString('id-ID')}
                </td>
                <td className="font-tabular py-3 px-2 text-right">
                  {totals.perwata.toLocaleString('id-ID')}
                </td>
                <td className="font-tabular py-3 px-2 text-right">
                  {totals.perpri.toLocaleString('id-ID')}
                </td>
                <td className="font-tabular py-3 pl-2 text-right">
                  {totals.lansia.toLocaleString('id-ID')}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Impor Data Statistik dari Google Sheet Aplikasi Lain */}
      <section className="rounded-3xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900 dark:text-stone-100">
              <FileSpreadsheet className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
              <span>Impor dari Database Google Sheets</span>
            </h2>
            <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
              Hubungkan Google Sheets untuk mengimpor data statistik jemaat dari aplikasi pendataan eksternal dan langsung memvisualisasikannya di grafik.
            </p>
            <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
              Kolom header yang didukung:{' '}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 dark:bg-stone-800">
                Sektor | Unit | KK | Jiwa | PAR | PP | PERWATA | PERPRI | LANSIA
              </code>
            </p>
          </div>

          {!isGoogleConnected && (
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
          )}
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={sheetInput}
            onChange={(e) => setSheetInput(e.target.value)}
            placeholder="Tempel URL atau ID Google Spreadsheet (mis. https://docs.google.com/spreadsheets/d/...)"
            className="flex-1 rounded-xl border border-stone-200 bg-stone-50 px-3.5 py-2.5 text-sm text-stone-900 focus:border-[#7F1D1D] focus:outline-none dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100"
          />
          <button
            type="button"
            onClick={() => loadFromSpreadsheet(sheetInput)}
            disabled={loadingSheet || !isGoogleConnected}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#7F1D1D] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#68151B] disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loadingSheet ? 'animate-spin' : ''}`} />
            <span>Ambil Daftar Sheet</span>
          </button>
        </div>

        {sheetError && (
          <p className="mt-3 text-xs font-medium text-red-600 dark:text-red-400">{sheetError}</p>
        )}

        {importSuccessMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-medium text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        {sheetMeta && (
          <div className="mt-5 space-y-4 border-t border-stone-100 pt-4 dark:border-stone-800">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                Spreadsheet: {sheetMeta.title}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sheetMeta.sheets.map((tab) => (
                  <button
                    key={tab.sheetId}
                    type="button"
                    onClick={() => handleFetchTabPreview(tab.title)}
                    className={`min-h-[34px] rounded-lg px-3 text-xs font-semibold cursor-pointer ${
                      selectedTab === tab.title
                        ? 'bg-amber-500 text-stone-950'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
                    }`}
                  >
                    {tab.title}
                  </button>
                ))}
              </div>
            </div>

            {previewRows && previewRows.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-800/40">
                <p className="text-xs text-stone-700 dark:text-stone-300">
                  Ditemukan <strong className="font-tabular">{previewRows.length}</strong> baris statistik dari tab{' '}
                  <strong>"{selectedTab}"</strong>.
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewOnChart((prev) => !prev)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 cursor-pointer"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>
                      {previewOnChart ? 'Lihat Data Portal Aktif' : 'Pratinjau di Grafik'}
                    </span>
                  </button>

                  {currentUserRole === 'superuser' ? (
                    <button
                      type="button"
                      onClick={() => setConfirmImportOpen(true)}
                      className="inline-flex min-h-[38px] items-center gap-2 rounded-xl bg-emerald-700 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800 cursor-pointer"
                    >
                      <Download className="h-4 w-4" />
                      <span>Terapkan ke Statistik Portal</span>
                    </button>
                  ) : (
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      Masuk sebagai Super User untuk menyimpan sebagai data resmi portal.
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={confirmImportOpen}
        title="Terapkan Impor Data Google Sheets?"
        description={`Tindakan ini akan memperbarui ${previewRows?.length || 0} baris Data & Statistik Jemaat di portal menggunakan data dari tab "${selectedTab}".`}
        confirmLabel="Ya, Terapkan Data"
        onConfirm={applyImportedStats}
        onCancel={() => setConfirmImportOpen(false)}
      />
    </div>
  );
};

