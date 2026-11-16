import React, { useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Building2, Wallet } from 'lucide-react';
import { usePortal } from '../context/PortalContext';

function formatRupiah(amount: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const LaporanKeuanganPage: React.FC = () => {
  const { data } = usePortal();
  const [filterCat, setFilterCat] = useState<string>('Semua');

  const summary = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let pembangunanIn = 0;
    let pembangunanOut = 0;
    let persembahanTotal = 0;

    data.finance.forEach((f) => {
      if (f.type === 'Pemasukan') {
        totalIn += f.amount;
        if (f.category === 'Aksi Pembangunan') pembangunanIn += f.amount;
        if (f.category === 'Persembahan') persembahanTotal += f.amount;
      } else {
        totalOut += f.amount;
        if (f.category === 'Aksi Pembangunan') pembangunanOut += f.amount;
      }
    });

    return {
      saldoKas: totalIn - totalOut,
      persembahanTotal,
      saldoPembangunan: pembangunanIn - pembangunanOut,
      totalOut,
    };
  }, [data.finance]);

  const filtered = useMemo(() => {
    return data.finance.filter((f) => filterCat === 'Semua' || f.category === filterCat);
  }, [data.finance, filterCat]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 sm:text-3xl">
          Laporan Keuangan Jemaat
        </h1>
        <p className="mt-1 text-sm text-stone-600 dark:text-stone-400">
          Ringkasan transparan kas jemaat, persembahan minggu berjalan, diakonia, dan aksi pembangunan.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span>Saldo Kas Jemaat</span>
            <Wallet className="h-4 w-4 text-[#7F1D1D] dark:text-amber-400" />
          </div>
          <p className="font-tabular mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">
            {formatRupiah(summary.saldoKas)}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span>Persembahan Terhimpun</span>
            <ArrowDownLeft className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="font-tabular mt-2 text-2xl font-bold text-emerald-700 dark:text-emerald-400">
            {formatRupiah(summary.persembahanTotal)}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span>Dana Aksi Pembangunan</span>
            <Building2 className="h-4 w-4 text-amber-600" />
          </div>
          <p className="font-tabular mt-2 text-2xl font-bold text-amber-700 dark:text-amber-400">
            {formatRupiah(summary.saldoPembangunan)}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-center justify-between text-xs font-semibold text-stone-500 dark:text-stone-400">
            <span>Total Pengeluaran</span>
            <ArrowUpRight className="h-4 w-4 text-[#7F1D1D] dark:text-red-400" />
          </div>
          <p className="font-tabular mt-2 text-2xl font-bold text-stone-900 dark:text-stone-100">
            {formatRupiah(summary.totalOut)}
          </p>
        </div>
      </div>

      {/* Filter & Ledger */}
      <section className="rounded-3xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4 dark:border-stone-800">
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
            Rincian Mutasi Keuangan
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {['Semua', 'Persembahan', 'Aksi Pembangunan', 'Diakonia', 'Operasional'].map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFilterCat(cat)}
                  className={`min-h-[34px] rounded-lg px-3 text-xs font-semibold transition-colors cursor-pointer ${
                    filterCat === cat
                      ? 'bg-[#7F1D1D] text-white dark:bg-amber-500 dark:text-stone-950'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-xs font-semibold text-stone-500 dark:border-stone-800 dark:text-stone-400">
                <th className="py-3 pr-4">Tanggal</th>
                <th className="py-3 pr-4">Uraian Transaksi</th>
                <th className="py-3 pr-4">Kategori</th>
                <th className="py-3 pr-4">Jenis</th>
                <th className="py-3 text-right">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
              {filtered.map((row) => (
                <tr key={row.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                  <td className="font-tabular py-3.5 pr-4 text-xs text-stone-500 dark:text-stone-400 whitespace-nowrap">
                    {row.date}
                  </td>
                  <td className="py-3.5 pr-4 font-medium text-stone-900 dark:text-stone-100">
                    {row.description}
                  </td>
                  <td className="py-3.5 pr-4 text-xs text-stone-600 dark:text-stone-300 whitespace-nowrap">
                    {row.category}
                  </td>
                  <td className="py-3.5 pr-4 text-xs font-semibold whitespace-nowrap">
                    <span
                      className={
                        row.type === 'Pemasukan'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-[#7F1D1D] dark:text-red-400'
                      }
                    >
                      {row.type}
                    </span>
                  </td>
                  <td className="font-tabular py-3.5 text-right font-semibold whitespace-nowrap text-stone-900 dark:text-stone-100">
                    {row.type === 'Pemasukan' ? '+' : '-'} {formatRupiah(row.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
