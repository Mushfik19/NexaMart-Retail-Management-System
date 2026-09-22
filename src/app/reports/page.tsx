'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  DollarSign,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useApp } from '@/context/AppContext';

export default function ReportsPage() {
  const { store, formatCurrency } = useApp();
  const [range, setRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('month');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('range', range);
    if (store?.id) params.set('storeId', store.id);

    fetch(`/api/reports?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [range, store?.id]);

  const summary = data?.summary || {};
  const salesTrend = data?.salesTrend || [];

  const handleExport = () => {
    const params = new URLSearchParams();
    params.set('range', range);
    params.set('export', 'csv');
    if (store?.id) params.set('storeId', store.id);
    window.open(`/api/reports?${params.toString()}`, '_blank');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Financial & Sales Analytics (P&L)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Revenue, COGS, gross margins, store overheads, and inventory valuation for{' '}
            <span className="font-semibold text-slate-700 ">
              {store?.name || 'All Stores'}
            </span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Range filter */}
          <div className="flex items-center bg-white  p-1 rounded-xl border border-slate-200  text-xs font-semibold shadow-xs">
            {(['today', 'yesterday', 'week', 'month', 'all'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                  range === r
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600  hover:text-slate-900'
                }`}
              >
                {r === 'week' ? '7 Days' : r === 'month' ? '30 Days' : r}
              </button>
            ))}
          </div>

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Compliance Disclaimer Alert */}
      <div className="p-3.5 rounded-2xl bg-amber-50  border border-amber-200  flex items-center space-x-2 text-xs text-amber-800 ">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>
          <strong>Operational Reporting Notice:</strong> Figures presented reflect store POS and purchasing transactions and are intended for retail operations and management reporting, not official tax advice. Export data to Xero / QuickBooks / MYOB for statutory accounting.
        </span>
      </div>

      {/* Financial Statement P&L Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Sales</span>
          <p className="text-xl font-black text-slate-900  mt-1 font-mono">
            {formatCurrency(summary.totalRevenue || 0)}
          </p>
          <span className="text-[10px] text-slate-400">Total customer receipts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">COGS (Wholesale)</span>
          <p className="text-xl font-black text-slate-700  mt-1 font-mono">
            {formatCurrency(summary.totalCogs || 0)}
          </p>
          <span className="text-[10px] text-slate-400">Cost of goods sold</span>
        </div>

        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Gross Profit</span>
          <p className="text-xl font-black text-emerald-600  mt-1 font-mono">
            {formatCurrency(summary.grossProfit || 0)}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold">{summary.profitMargin}% Margin</span>
        </div>

        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Store Expenses</span>
          <p className="text-xl font-black text-rose-600  mt-1 font-mono">
            {formatCurrency(summary.totalExpenses || 0)}
          </p>
          <span className="text-[10px] text-slate-400">Utilities, rent, packaging</span>
        </div>

        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Estimated Net Profit</span>
          <p className="text-xl font-black text-sky-600  mt-1 font-mono">
            {formatCurrency(summary.netProfit || 0)}
          </p>
          <span className="text-[10px] text-slate-400">Gross profit minus expenses</span>
        </div>
      </div>

      {/* Recharts Bar Chart: Daily Sales vs Gross Profit */}
      <div className="p-6 bg-white  border border-slate-200  rounded-3xl shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 ">
          Daily Revenue vs Gross Profit Comparison
        </h3>

        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesTrend}>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${v}`} />
              <Tooltip
                formatter={(v: any) => [`$${Number(v).toFixed(2)}`, '']}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="sales" name="Sales Revenue" fill="#0284c7" radius={[6, 6, 0, 0]} />
              <Bar dataKey="profit" name="Gross Profit" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
