import React, { useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Share2,
} from 'lucide-react';
import { ServiceSchedule } from '../types/church';

interface KalenderKegiatanWidgetProps {
  schedules: ServiceSchedule[];
  onSelectSchedule?: (schedule: ServiceSchedule) => void;
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

// Helper to parse date strings like "Minggu, 15 November 2026" or "2026-11-15" into a Date object or day/month/year
function parseScheduleDate(dateStr: string): { day: number; month: number; year: number } | null {
  if (!dateStr) return null;

  // Try ISO format "YYYY-MM-DD"
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10) - 1,
      day: parseInt(isoMatch[3], 10),
    };
  }

  // Try Indonesian format "15 November 2026" or similar
  const parts = dateStr.split(/[\s,]+/);
  let day: number | null = null;
  let monthIndex = -1;
  let year = new Date().getFullYear();

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!isNaN(num)) {
      if (num > 31) {
        year = num;
      } else if (day === null && num >= 1 && num <= 31) {
        day = num;
      }
    } else {
      const lower = part.toLowerCase();
      const mIdx = MONTH_NAMES.findIndex((m) => m.toLowerCase().startsWith(lower.slice(0, 3)));
      if (mIdx >= 0) {
        monthIndex = mIdx;
      }
    }
  }

  if (day !== null && monthIndex >= 0) {
    return { day, month: monthIndex, year };
  }

  return null;
}

export const KalenderKegiatanWidget: React.FC<KalenderKegiatanWidgetProps> = ({
  schedules,
}) => {
  const currentDate = new Date();
  const [activeYear, setActiveYear] = useState<number>(currentDate.getFullYear());
  const [activeMonth, setActiveMonth] = useState<number>(currentDate.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(currentDate.getDate());

  const handlePrevMonth = () => {
    if (activeMonth === 0) {
      setActiveMonth(11);
      setActiveYear((y) => y - 1);
    } else {
      setActiveMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (activeMonth === 11) {
      setActiveMonth(0);
      setActiveYear((y) => y + 1);
    } else {
      setActiveMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  // Map schedules to their parsed dates
  const scheduleMap = useMemo(() => {
    const map = new Map<number, ServiceSchedule[]>();
    schedules.forEach((sch) => {
      const parsed = parseScheduleDate(sch.date);
      if (parsed && parsed.year === activeYear && parsed.month === activeMonth) {
        const list = map.get(parsed.day) || [];
        list.push(sch);
        map.set(parsed.day, list);
      }
    });
    return map;
  }, [schedules, activeYear, activeMonth]);

  // Days in month
  const daysInMonth = new Date(activeYear, activeMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(activeYear, activeMonth, 1).getDay();
  // Adjust so Monday is 0 (Mon=0, Tue=1, ..., Sun=6)
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const calendarDays = useMemo(() => {
    const items: { day: number | null; key: string }[] = [];
    for (let i = 0; i < adjustedFirstDay; i++) {
      items.push({ day: null, key: `empty-${i}` });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      items.push({ day: d, key: `day-${d}` });
    }
    return items;
  }, [adjustedFirstDay, daysInMonth]);

  const selectedDaySchedules = useMemo(() => {
    if (selectedDay === null) return [];
    return scheduleMap.get(selectedDay) || [];
  }, [scheduleMap, selectedDay]);

  const monthSchedulesCount = useMemo(() => {
    let count = 0;
    scheduleMap.forEach((list) => {
      count += list.length;
    });
    return count;
  }, [scheduleMap]);

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 sm:p-6">
      {/* Header with Title and Month Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-100 pb-4 dark:border-stone-800">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#7F1D1D] dark:text-amber-400">
            <CalendarIcon className="h-4 w-4" />
            <span>Kalender Kegiatan Jemaat</span>
          </div>
          <h2 className="mt-1 text-lg font-bold text-stone-900 dark:text-stone-100">
            {MONTH_NAMES[activeMonth]} {activeYear}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600 dark:bg-stone-800 dark:text-stone-300">
            {monthSchedulesCount} Agenda Bulan Ini
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="rounded-xl border border-stone-200 bg-stone-50 p-2 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="rounded-xl border border-stone-200 bg-stone-50 p-2 text-stone-700 hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-200 dark:hover:bg-stone-700 cursor-pointer"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid & Selected Day Events */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Calendar Grid (7 cols) */}
        <div className="lg:col-span-7">
          {/* Day Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-stone-400 dark:text-stone-500 pb-2">
            {DAY_NAMES.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map(({ day, key }) => {
              if (day === null) {
                return <div key={key} className="h-10 sm:h-12" />;
              }

              const hasSchedules = scheduleMap.has(day);
              const isSelected = selectedDay === day;
              const isToday =
                day === currentDate.getDate() &&
                activeMonth === currentDate.getMonth() &&
                activeYear === currentDate.getFullYear();

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`group relative flex h-10 sm:h-12 flex-col items-center justify-center rounded-2xl border text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#7F1D1D] bg-[#7F1D1D] text-white shadow-md dark:border-amber-500 dark:bg-amber-500 dark:text-stone-950'
                      : isToday
                      ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                      : hasSchedules
                      ? 'border-stone-300 bg-stone-50 text-stone-900 hover:border-[#7F1D1D] dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100'
                      : 'border-transparent bg-stone-50/50 text-stone-600 hover:bg-stone-100 dark:bg-stone-800/40 dark:text-stone-400 dark:hover:bg-stone-800'
                  }`}
                >
                  <span className="font-tabular">{day}</span>
                  {hasSchedules && (
                    <span
                      className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                        isSelected ? 'bg-white dark:bg-stone-950' : 'bg-[#7F1D1D] dark:bg-amber-400'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Agenda Panel */}
        <div className="lg:col-span-5 rounded-2xl border border-stone-200 bg-stone-50/70 p-4 dark:border-stone-800 dark:bg-stone-800/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 dark:border-stone-700">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                {selectedDay !== null
                  ? `Agenda ${selectedDay} ${MONTH_NAMES[activeMonth]} ${activeYear}`
                  : 'Pilih Tanggal pada Kalender'}
              </h3>
              <span className="rounded-full bg-stone-200/80 px-2.5 py-0.5 text-[11px] font-semibold text-stone-700 dark:bg-stone-700 dark:text-stone-300">
                {selectedDaySchedules.length} Event
              </span>
            </div>

            <div className="mt-3 max-h-[220px] space-y-2.5 overflow-y-auto pr-1">
              {selectedDay === null ? (
                <p className="py-8 text-center text-xs text-stone-400">
                  Klik salah satu tanggal pada kalender untuk melihat jadwal kegiatan gereja.
                </p>
              ) : selectedDaySchedules.length === 0 ? (
                <p className="py-8 text-center text-xs text-stone-500 dark:text-stone-400">
                  Tidak ada jadwal ibadah atau kegiatan pada tanggal ini.
                </p>
              ) : (
                selectedDaySchedules.map((sch) => (
                  <div
                    key={sch.id}
                    className="rounded-xl border border-stone-200 bg-white p-3 shadow-xs dark:border-stone-700 dark:bg-stone-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="inline-flex items-center rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                        {sch.category} {sch.unsur ? `• ${sch.unsur}` : ''}
                      </span>
                      <span className="font-tabular text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                        {sch.time}
                      </span>
                    </div>
                    <h4 className="mt-1.5 text-xs font-bold text-stone-900 dark:text-stone-100">
                      {sch.title}
                    </h4>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-stone-500 dark:text-stone-400">
                      <MapPin className="h-3 w-3 shrink-0 text-[#7F1D1D] dark:text-amber-400" />
                      <span className="truncate">{sch.location}</span>
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-stone-200 dark:border-stone-700 text-center">
            <p className="text-[10px] text-stone-400">
              Jadwal disinkronkan otomatis dari Google Spreadsheet Jemaat.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
