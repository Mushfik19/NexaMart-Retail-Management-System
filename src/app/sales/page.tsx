'use client';

import React, { useState, useEffect } from 'react';
import { Search, Receipt, Printer, Calendar, ArrowRight } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import ReceiptModal from '@/components/pos/ReceiptModal';
import { SaleReceipt } from '@/lib/types';

export default function SalesPage() {
  const { store, formatCurrency } = useApp();
  const [sales, setSales] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeReceipt, setActiveReceipt] = useState<SaleReceipt | null>(null);

  const loadSales = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (dateRange !== 'all') params.set('dateRange', dateRange);
    if (store?.id) params.set('storeId', store.id);

    fetch(`/api/sales?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setSales(d.sales || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadSales();
  }, [query, dateRange, store?.id]);

  const handleReprint = async (saleId: string) => {
    try {
      const res = await fetch(`/api/sales/${saleId}`);
      const data = await res.json();
      if (data.sale) {
        setActiveReceipt(data.sale);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Sales Ledger & Receipt Reprint
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search completed transactions, reprint receipts, and inspect payment tenders
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center bg-white  p-1 rounded-xl border border-slate-200  text-xs font-semibold shadow-xs">
          {(['today', 'yesterday', 'week', 'month', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                dateRange === r
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600  hover:text-slate-900'
              }`}
            >
              {r === 'week' ? 'Past 7 Days' : r === 'month' ? 'Past 30 Days' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-white  border border-slate-200  rounded-2xl shadow-xs flex items-center">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by receipt # (e.g. RCP-2026-0001), invoice #, or customer phone..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-3 pr-2 py-1 text-xs bg-transparent text-slate-800  focus:outline-none font-medium"
        />
      </div>

      {/* Sales Table */}
      <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Receipt Number</th>
                <th className="py-3 px-3">Date & Time</th>
                <th className="py-3 px-3">Customer</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Payment Method</th>
                <th className="py-3 px-3 text-right">Grand Total</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-4 text-right">Reprint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Loading sales records...
                  </td>
                </tr>
              ) : sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No transactions matching your query.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 ">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 ">
                      {s.receiptNumber}
                    </td>

                    <td className="py-3 px-3 text-slate-500 text-[11px]">
                      {new Date(s.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-semibold text-slate-800 ">
                      {s.customer ? s.customer.name : 'Walk-in / Guest'}
                    </td>

                    <td className="py-3 px-3 text-slate-600 ">
                      {s.user?.fullName || 'Cashier'}
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[11px] font-mono font-semibold text-slate-600 ">
                        {s.payments.map((p: any) => p.method).join(', ') || 'CASH'}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-black font-mono text-slate-900 ">
                      {formatCurrency(s.grandTotal)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800  '
                            : 'bg-rose-100 text-rose-800  '
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleReprint(s.id)}
                        className="px-3 py-1 bg-slate-100  hover:bg-sky-600 hover:text-white text-slate-700  font-bold text-xs rounded-lg border border-slate-200  shadow-xs flex items-center space-x-1 ml-auto transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {activeReceipt && (
        <ReceiptModal receipt={activeReceipt} onClose={() => setActiveReceipt(null)} />
      )}
    </div>
  );
}
