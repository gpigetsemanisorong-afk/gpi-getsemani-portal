import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart3, Layers, PieChart as PieChartIcon } from 'lucide-react';
import { CongregationStatRow } from '../types/church';
import { usePortal } from '../context/PortalContext';

interface StatistikJemaatChartsProps {
  rows: CongregationStatRow[];
  title?: string;
  subtitle?: string;
}

type UnitChartMode = 'jiwa_kk' | 'unsur';

const UNSUR_SERIES = [
  { key: 'par', label: 'PAR (Anak & Remaja)', short: 'PAR', color: '#F59E0B' },
  { key: 'pp', label: 'PP (Pemuda)', short: 'PP', color: '#7F1D1D' },
  { key: 'perwata', label: 'PERWATA (Wanita)', short: 'PERWATA', color: '#D97706' },
  { key: 'perpri', label: 'PERPRI (Pria)', short: 'PERPRI', color: '#44403C' },
  { key: 'lansia', label: 'LANSIA', short: 'Lansia', color: '#047857' },
] as const;

interface CustomTooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: {
    unit?: string;
    sektor?: string;
    jiwa?: number;
    kk?: number;
    pct?: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: CustomTooltipPayloadItem[];
  label?: string;
}

const ChartTooltipCard: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload || payload.length === 0) return null;
  const rowMeta = payload[0]?.payload;

  return (
    <div className="rounded-xl border border-stone-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:border-stone-700 dark:bg-stone-900/95">
      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
        {label || rowMeta?.unit || payload[0]?.name}
      </p>
      {rowMeta?.sektor && (
        <p className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
          {rowMeta.sektor}
        </p>
      )}
      <div className="mt-2 space-y-1 border-t border-stone-100 pt-2 dark:border-stone-800">
        {payload.map((entry, idx) => (
          <div key={`${entry.name}-${idx}`} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-stone-600 dark:text-stone-300">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: entry.color || '#7F1D1D' }}
              />
              <span>{entry.name}</span>
            </span>
            <span className="font-tabular font-bold text-stone-900 dark:text-stone-100">
              {Number(entry.value || 0).toLocaleString('id-ID')}
              {rowMeta?.pct !== undefined ? ` jiwa (${rowMeta.pct}%)` : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const StatistikJemaatCharts: React.FC<StatistikJemaatChartsProps> = ({
  rows,
  title = 'Visualisasi Statistik Jemaat',
  subtitle = 'Grafik interaktif sebaran jiwa, KK, dan wadah kategorial per unit pelayanan.',
}) => {
  const { isDark } = usePortal();
  const [selectedSektor, setSelectedSektor] = useState<string>('Semua');
  const [chartMode, setChartMode] = useState<UnitChartMode>('jiwa_kk');
  const [activeUnsurKey, setActiveUnsurKey] = useState<string | null>(null);

  const sectors = useMemo(() => {
    const unique = Array.from(new Set(rows.map((r) => r.sektor).filter(Boolean)));
    return ['Semua', ...unique];
  }, [rows]);

  const effectiveSektor = sectors.includes(selectedSektor) ? selectedSektor : 'Semua';

  const filteredRows = useMemo(() => {
    if (effectiveSektor === 'Semua') return rows;
    return rows.filter((r) => r.sektor === effectiveSektor);
  }, [rows, effectiveSektor]);

  const unitChartData = useMemo(() => {
    return filteredRows.map((r) => ({
      unit: r.unit.replace(/^Unit\s+/i, ''),
      fullUnit: r.unit,
      sektor: r.sektor,
      kk: r.kk,
      jiwa: r.jiwa,
      par: r.par,
      pp: r.pp,
      perwata: r.perwata,
      perpri: r.perpri,
      lansia: r.lansia,
    }));
  }, [filteredRows]);

  const filteredTotals = useMemo(() => {
    return filteredRows.reduce(
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
  }, [filteredRows]);

  const unsurPieData = useMemo(() => {
    const sumUnsur =
      filteredTotals.par +
      filteredTotals.pp +
      filteredTotals.perwata +
      filteredTotals.perpri +
      filteredTotals.lansia;
    const base = sumUnsur > 0 ? sumUnsur : filteredTotals.jiwa;

    return UNSUR_SERIES.map((u) => {
      const value = filteredTotals[u.key];
      const pct = base > 0 ? Math.round((value / base) * 100) : 0;
      const fill = isDark && u.key === 'perpri' ? '#A8A29E' : u.color;
      return {
        key: u.key,
        name: u.label,
        short: u.short,
        value,
        pct,
        fill,
      };
    });
  }, [filteredTotals, isDark]);

  const sectorComparisonData = useMemo(() => {
    const map = new Map<string, { sektor: string; kk: number; jiwa: number; unitCount: number }>();
    rows.forEach((r) => {
      const key = r.sektor || 'Sektor Umum';
      const prev = map.get(key) || { sektor: key, kk: 0, jiwa: 0, unitCount: 0 };
      map.set(key, {
        sektor: key,
        kk: prev.kk + r.kk,
        jiwa: prev.jiwa + r.jiwa,
        unitCount: prev.unitCount + 1,
      });
    });
    return Array.from(map.values());
  }, [rows]);

  const activeUnsur = unsurPieData.find((u) => u.key === activeUnsurKey) || null;
  const gridColor = isDark ? '#292524' : '#E7E5E4';
  const axisTickColor = isDark ? '#A8A29E' : '#57534E';
  const maroonColor = isDark ? '#F59E0B' : '#7F1D1D';
  const goldColor = isDark ? '#D97706' : '#F59E0B';

  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-500 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400">
        Belum ada data statistik jemaat untuk divisualisasikan.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Interactive Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold text-stone-900 dark:text-stone-100 sm:text-lg">
            <BarChart3 className="h-5 w-5 text-[#7F1D1D] dark:text-amber-400" />
            <span>{title}</span>
          </h2>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {sectors.map((sektor) => {
            const active = effectiveSektor === sektor;
            return (
              <button
                key={sektor}
                type="button"
                onClick={() => setSelectedSektor(sektor)}
                className={`min-h-[36px] rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#7F1D1D] text-white dark:bg-amber-500 dark:text-stone-950'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700'
                }`}
              >
                {sektor}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Chart 1: Interactive Unit Bar Chart */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                {chartMode === 'jiwa_kk'
                  ? 'Perbandingan Jiwa & Kepala Keluarga per Unit'
                  : 'Sebaran Wadah Kategorial per Unit'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {effectiveSektor === 'Semua'
                  ? `Menampilkan ${filteredRows.length} unit pelayanan`
                  : `Filter aktif: ${effectiveSektor} (${filteredRows.length} unit)`}
              </p>
            </div>

            <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1 dark:border-stone-700 dark:bg-stone-800">
              <button
                type="button"
                onClick={() => setChartMode('jiwa_kk')}
                className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  chartMode === 'jiwa_kk'
                    ? 'bg-white text-[#7F1D1D] shadow-xs dark:bg-stone-900 dark:text-amber-400'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Jiwa & KK</span>
              </button>
              <button
                type="button"
                onClick={() => setChartMode('unsur')}
                className={`inline-flex min-h-[32px] items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  chartMode === 'unsur'
                    ? 'bg-white text-[#7F1D1D] shadow-xs dark:bg-stone-900 dark:text-amber-400'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Per Unsur</span>
              </button>
            </div>
          </div>

          <div className="mt-4 h-[300px] w-full sm:h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartMode === 'jiwa_kk' ? (
                <BarChart
                  data={unitChartData}
                  margin={{ top: 10, right: 12, left: -12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="unit"
                    tick={{ fill: axisTickColor, fontSize: 12 }}
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: axisTickColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltipCard />}
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(127,29,29,0.05)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  <Bar
                    dataKey="jiwa"
                    name="Total Jiwa"
                    fill={maroonColor}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                  <Bar
                    dataKey="kk"
                    name="Kepala Keluarga (KK)"
                    fill={goldColor}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              ) : (
                <BarChart
                  data={unitChartData}
                  margin={{ top: 10, right: 12, left: -12, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis
                    dataKey="unit"
                    tick={{ fill: axisTickColor, fontSize: 12 }}
                    axisLine={{ stroke: gridColor }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: axisTickColor, fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={<ChartTooltipCard />}
                    cursor={{ fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(127,29,29,0.05)' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                  {UNSUR_SERIES.map((u) => (
                    <Bar
                      key={u.key}
                      dataKey={u.key}
                      name={u.short}
                      stackId="unsur"
                      fill={isDark && u.key === 'perpri' ? '#A8A29E' : u.color}
                      maxBarSize={48}
                    />
                  ))}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </section>

        {/* Chart 2: Interactive Donut Chart Komposisi Unsur */}
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <h3 className="flex items-center gap-2 text-sm font-bold text-stone-900 dark:text-stone-100">
            <PieChartIcon className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
            <span>Proporsi Wadah Kategorial</span>
          </h3>
          <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
            Sorot atau klik unsur untuk melihat rincian jumlah jiwa.
          </p>

          <div className="relative mt-2 h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={unsurPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={86}
                  paddingAngle={2}
                  onMouseEnter={(_, idx) => {
                    const item = unsurPieData[idx];
                    if (item) setActiveUnsurKey(item.key);
                  }}
                  onMouseLeave={() => setActiveUnsurKey(null)}
                  onClick={(_, idx) => {
                    const item = unsurPieData[idx];
                    if (item) {
                      setActiveUnsurKey((prev) => (prev === item.key ? null : item.key));
                    }
                  }}
                >
                  {unsurPieData.map((entry) => {
                    const dimmed = activeUnsurKey !== null && activeUnsurKey !== entry.key;
                    return (
                      <Cell
                        key={entry.key}
                        fill={entry.fill}
                        fillOpacity={dimmed ? 0.35 : 1}
                        stroke={isDark ? '#1C1917' : '#FFFFFF'}
                        strokeWidth={2}
                        className="cursor-pointer outline-none"
                      />
                    );
                  })}
                </Pie>
                <Tooltip content={<ChartTooltipCard />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center KPI overlay */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                {activeUnsur ? activeUnsur.short : 'Total Jiwa'}
              </span>
              <span className="font-tabular text-xl font-bold text-stone-900 dark:text-stone-100">
                {(activeUnsur ? activeUnsur.value : filteredTotals.jiwa).toLocaleString('id-ID')}
              </span>
              {activeUnsur && (
                <span className="font-tabular text-[11px] font-semibold text-[#7F1D1D] dark:text-amber-400">
                  {activeUnsur.pct}%
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 space-y-1.5">
            {unsurPieData.map((item) => {
              const isSelected = activeUnsurKey === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onMouseEnter={() => setActiveUnsurKey(item.key)}
                  onMouseLeave={() => setActiveUnsurKey(null)}
                  onClick={() => setActiveUnsurKey((prev) => (prev === item.key ? null : item.key))}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/30'
                      : 'hover:bg-stone-50 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2 text-stone-700 dark:text-stone-300">
                    <span
                      className="h-2.5 w-2.5 rounded-sm shrink-0"
                      style={{ backgroundColor: item.fill }}
                    />
                    <span className="font-medium">{item.name}</span>
                  </span>
                  <span className="font-tabular font-semibold text-stone-900 dark:text-stone-100">
                    {item.value.toLocaleString('id-ID')} ({item.pct}%)
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Sector Comparison Strip (when more than 1 sector exists) */}
      {sectorComparisonData.length > 1 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Ringkasan Perbandingan Antar Sektor
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sectorComparisonData.map((sec) => {
              const totalAllJiwa = sectorComparisonData.reduce((s, c) => s + c.jiwa, 0);
              const sharePct = totalAllJiwa > 0 ? Math.round((sec.jiwa / totalAllJiwa) * 100) : 0;
              return (
                <button
                  key={sec.sektor}
                  type="button"
                  onClick={() =>
                    setSelectedSektor((prev) => (prev === sec.sektor ? 'Semua' : sec.sektor))
                  }
                  className={`rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                    effectiveSektor === sec.sektor
                      ? 'border-[#7F1D1D] bg-amber-50/60 dark:border-amber-500 dark:bg-amber-950/20'
                      : 'border-stone-200 bg-stone-50/50 hover:border-stone-300 dark:border-stone-800 dark:bg-stone-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-bold text-[#7F1D1D] dark:text-amber-400">
                      {sec.sektor}
                    </p>
                    <span className="font-tabular text-xs font-semibold text-stone-500 dark:text-stone-400">
                      {sec.unitCount} unit · {sharePct}%
                    </span>
                  </div>
                  <div className="mt-2 flex items-baseline gap-4">
                    <div>
                      <span className="font-tabular text-xl font-bold text-stone-900 dark:text-stone-100">
                        {sec.jiwa.toLocaleString('id-ID')}
                      </span>{' '}
                      <span className="text-xs text-stone-500 dark:text-stone-400">jiwa</span>
                    </div>
                    <div>
                      <span className="font-tabular text-base font-bold text-stone-700 dark:text-stone-300">
                        {sec.kk.toLocaleString('id-ID')}
                      </span>{' '}
                      <span className="text-xs text-stone-500 dark:text-stone-400">KK</span>
                    </div>
                  </div>
                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                    <div
                      className="h-full rounded-full bg-[#7F1D1D] dark:bg-amber-500"
                      style={{ width: `${Math.min(100, sharePct)}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
