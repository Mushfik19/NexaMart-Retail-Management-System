'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Undo2,
  Package,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ReturnsPage() {
  const { formatCurrency, refreshAppData } = useApp();
  const [searchCode, setSearchCode] = useState('');
  const [searchedSale, setSearchedSale] = useState<any | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, { qty: number; reason: string; restock: boolean }>>({});
  const [refundMethod, setRefundMethod] = useState<'ORIGINAL_PAYMENT' | 'CASH' | 'STORE_CREDIT'>('CASH');
  const [globalReason, setGlobalReason] = useState('CHANGED_MIND');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setLoading(true);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/returns?q=${encodeURIComponent(searchCode.trim())}`);
      const data = await res.json();
      if (res.ok && data.found) {
        setSearchedSale(data.sale);
        // Initialize selection map
        const map: any = {};
        data.sale.items.forEach((item: any) => {
          map[item.id] = { qty: 0, reason: 'CHANGED_MIND', restock: true };
        });
        setSelectedItems(map);
      } else {
        alert('Transaction not found. Try searching with Receipt # e.g. RCP-2026-0001');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalRefund = () => {
    if (!searchedSale) return 0;
    let sum = 0;
    searchedSale.items.forEach((item: any) => {
      const sel = selectedItems[item.id];
      if (sel && sel.qty > 0) {
        sum += sel.qty * item.unitPrice;
      }
    });
    return sum;
  };

  const handleProcessRefund = async () => {
    if (!searchedSale) return;
    const itemsToRefund = searchedSale.items
      .filter((i: any) => selectedItems[i.id]?.qty > 0)
      .map((i: any) => ({
        saleItemId: i.id,
        productId: i.productId,
        quantity: selectedItems[i.id].qty,
        unitPrice: i.unitPrice,
        restock: selectedItems[i.id].restock,
        reason: selectedItems[i.id].reason || globalReason,
      }));

    if (itemsToRefund.length === 0) {
      alert('Please select at least 1 item to return.');
      return;
    }

    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleId: searchedSale.id,
          refundMethod,
          reason: globalReason,
          items: itemsToRefund,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessMessage(`Refund ${data.refund.refundNumber} successfully processed! Inventory restocked.`);
        setSearchedSale(null);
        await refreshAppData();
      } else {
        alert(data.error || 'Refund failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalRefundAmount = calculateTotalRefund();

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto select-none">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
          Returns, Refunds & Item Exchanges
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Look up customer purchase by receipt barcode, select returned lines, and return stock to inventory
        </p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-md">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Lookup Bar */}
      <form onSubmit={handleSearch} className="p-4 bg-white  border border-slate-200  rounded-2xl shadow-xs flex gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            required
            placeholder="Scan or enter Receipt # (e.g. RCP-2026-0001)..."
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300  bg-slate-50  text-slate-900  focus:ring-2 focus:ring-sky-500 font-mono font-medium"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center space-x-1.5 transition-colors"
        >
          <Search className="w-3.5 h-3.5" />
          <span>{loading ? 'Finding...' : 'Find Sale'}</span>
        </button>
      </form>

      {/* Searched Sale Details & Return Form */}
      {searchedSale && (
        <div className="p-6 bg-white  border border-slate-200  rounded-3xl shadow-xs space-y-6 animate-in fade-in">
          {/* Sale Meta */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 ">
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-base font-black text-slate-900 ">
                  {searchedSale.receiptNumber}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800  ">
                  Paid
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Date: {new Date(searchedSale.createdAt).toLocaleString()} • Store:{' '}
                {searchedSale.store?.name}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Original Total:</span>
              <p className="text-xl font-black text-slate-900  font-mono">
                {formatCurrency(searchedSale.grandTotal)}
              </p>
            </div>
          </div>

          {/* Items Selector */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Line Items to Return
            </h3>

            <div className="divide-y divide-slate-100 ">
              {searchedSale.items.map((item: any) => {
                const current = selectedItems[item.id] || { qty: 0, reason: 'CHANGED_MIND', restock: true };
                return (
                  <div key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
                    <div className="min-w-[200px]">
                      <p className="font-bold text-xs text-slate-900 ">
                        {item.productName}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {formatCurrency(item.unitPrice)} each • Original Qty: {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                          Return Qty
                        </label>
                        <input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={current.qty}
                          onChange={(e) => {
                            const val = Math.min(item.quantity, Math.max(0, parseInt(e.target.value) || 0));
                            setSelectedItems({
                              ...selectedItems,
                              [item.id]: { ...current, qty: val },
                            });
                          }}
                          className="w-16 text-center text-xs font-bold px-2 py-1 rounded-lg border border-slate-300  bg-slate-50 "
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 font-semibold mb-0.5">
                          Reason
                        </label>
                        <select
                          value={current.reason}
                          onChange={(e) => {
                            setSelectedItems({
                              ...selectedItems,
                              [item.id]: { ...current, reason: e.target.value },
                            });
                          }}
                          className="text-xs px-2 py-1 rounded-lg border border-slate-300  bg-slate-50 "
                        >
                          <option value="CHANGED_MIND">Customer Changed Mind</option>
                          <option value="DAMAGED">Damaged / Defective</option>
                          <option value="EXPIRED">Expired on Shelf</option>
                          <option value="WRONG_ITEM">Wrong Item Purchased</option>
                        </select>
                      </div>

                      <div className="flex items-center space-x-1.5 pt-4">
                        <input
                          type="checkbox"
                          id={`restock-${item.id}`}
                          checked={current.restock}
                          onChange={(e) => {
                            setSelectedItems({
                              ...selectedItems,
                              [item.id]: { ...current, restock: e.target.checked },
                            });
                          }}
                          className="rounded text-sky-600"
                        />
                        <label htmlFor={`restock-${item.id}`} className="text-xs text-slate-600 ">
                          Restock to Inventory
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Refund Method & Payout */}
          <div className="pt-4 border-t border-slate-200  flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700 ">
                Refund Method:
              </span>
              <select
                value={refundMethod}
                onChange={(e: any) => setRefundMethod(e.target.value)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-300  bg-slate-50 "
              >
                <option value="CASH">Cash Refund</option>
                <option value="ORIGINAL_PAYMENT">Original Card Payment</option>
                <option value="STORE_CREDIT">Store Credit Voucher</option>
              </select>
            </div>

            <div className="flex items-center space-x-4">
              <div>
                <span className="text-xs text-slate-400">Total Refund Due:</span>
                <p className="text-2xl font-black text-rose-600  font-mono">
                  {formatCurrency(totalRefundAmount)}
                </p>
              </div>

              <button
                onClick={handleProcessRefund}
                disabled={totalRefundAmount <= 0}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 disabled:opacity-40 transition-colors flex items-center space-x-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Authorize & Issue Refund</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
