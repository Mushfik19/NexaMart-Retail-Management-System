'use client';

import React, { useState, useEffect } from 'react';
import {
  Boxes,
  CalendarClock,
  History,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Minus,
  Edit,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function InventoryPage() {
  const { store, formatCurrency } = useApp();
  const [activeTab, setActiveTab] = useState<'stock' | 'batches' | 'movements'>('stock');
  const [data, setData] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  // Adjustment Modal
  const [adjustItem, setAdjustItem] = useState<any | null>(null);
  const [adjustType, setAdjustType] = useState<'ADD' | 'SUBTRACT' | 'DAMAGE' | 'SET'>('ADD');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('Physical count discrepancy');

  const loadStock = () => {
    setLoading(true);
    fetch(`/api/inventory?storeId=${store?.id || ''}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadBatches = () => {
    setLoading(true);
    fetch(`/api/inventory?view=batches&storeId=${store?.id || ''}`)
      .then((r) => r.json())
      .then((d) => {
        setBatches(d.batches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const loadMovements = () => {
    setLoading(true);
    fetch(`/api/inventory?view=movements&storeId=${store?.id || ''}`)
      .then((r) => r.json())
      .then((d) => {
        setMovements(d.movements || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'stock') loadStock();
    if (activeTab === 'batches') loadBatches();
    if (activeTab === 'movements') loadMovements();
  }, [activeTab, store?.id]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || !adjustQty) return;

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: adjustItem.productId,
          storeId: store?.id,
          adjustmentType: adjustType,
          quantity: parseFloat(adjustQty),
          reason: adjustReason,
        }),
      });

      if (res.ok) {
        setAdjustItem(null);
        setAdjustQty('');
        loadStock();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to adjust stock');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredInventory = (data?.inventory || []).filter((inv: any) =>
    inv.productName.toLowerCase().includes(query.toLowerCase()) ||
    inv.barcode.includes(query) ||
    inv.sku.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Inventory & Expiry Control
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time stock valuation, perishable batch tracking (FEFO), and audit movements for{' '}
            <span className="font-semibold text-slate-700 ">
              {store?.name || 'All Stores'}
            </span>
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-white  p-1 rounded-xl border border-slate-200  text-xs font-semibold shadow-xs">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTab === 'stock'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600  hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Stock on Hand</span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTab === 'batches'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600  hover:text-slate-900'
            }`}
          >
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Expiry Alerts (FEFO)</span>
          </button>

          <button
            onClick={() => setActiveTab('movements')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTab === 'movements'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'text-slate-600  hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Movement Audit</span>
          </button>
        </div>
      </div>

      {/* KPI Banner for Stock Tab */}
      {activeTab === 'stock' && data?.metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Retail Inventory Value</span>
            <p className="text-2xl font-black text-slate-900  mt-1">
              {formatCurrency(data.metrics.totalValuationRetail)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Estimated gross shelf value</p>
          </div>

          <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Inventory Cost Value</span>
            <p className="text-2xl font-black text-slate-900  mt-1">
              {formatCurrency(data.metrics.totalValuationCost)}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Wholesale purchase capital</p>
          </div>

          <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Gross Margin Potential</span>
            <p className="text-2xl font-black text-emerald-600  mt-1">
              {data.metrics.estimatedProfitMargin}%
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Based on selling price spread</p>
          </div>

          <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
            <span className="text-xs font-semibold text-amber-600  flex items-center space-x-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Restock Warnings</span>
            </span>
            <p className="text-2xl font-black text-amber-600  mt-1">
              {data.metrics.lowStockCount} Low / {data.metrics.outOfStockCount} Out
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Products needing reorder</p>
          </div>
        </div>
      )}

      {/* TAB 1: Stock on Hand */}
      {activeTab === 'stock' && (
        <div className="space-y-4">
          <div className="p-3 bg-white  border border-slate-200  rounded-2xl flex items-center">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Filter inventory table by product, barcode, or SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-3 pr-2 py-1 text-xs bg-transparent text-slate-800  focus:outline-none"
            />
          </div>

          <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-3">Barcode</th>
                    <th className="py-3 px-3 text-right">Unit Cost</th>
                    <th className="py-3 px-3 text-right">Retail Price</th>
                    <th className="py-3 px-3 text-center">On Hand</th>
                    <th className="py-3 px-3 text-center">Damaged</th>
                    <th className="py-3 px-3 text-right">Valuation</th>
                    <th className="py-3 px-4 text-right">Stock Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100  font-medium">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Calculating live store inventory...
                      </td>
                    </tr>
                  ) : filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No inventory matching query.
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-slate-50 ">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 ">
                            {inv.productName}
                          </div>
                          <span className="text-[10px] text-slate-400">{inv.category} • {inv.shelfLocation}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600 ">
                          {inv.barcode}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-500">
                          {formatCurrency(inv.costPrice)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 ">
                          {formatCurrency(inv.sellingPrice)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              inv.onHand === 0
                                ? 'bg-rose-100 text-rose-700  '
                                : inv.onHand <= inv.reorderPoint
                                ? 'bg-amber-100 text-amber-800  '
                                : 'bg-emerald-100 text-emerald-700  '
                            }`}
                          >
                            {inv.onHand}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-slate-400">
                          {inv.damaged}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-sky-600  font-mono">
                          {formatCurrency(inv.retailValue)}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setAdjustItem(inv);
                              setAdjustType('ADD');
                              setAdjustQty('');
                            }}
                            className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300  bg-slate-50  text-slate-700  hover:border-sky-500 hover:text-sky-600 transition-colors"
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Expiry & Batch FEFO Tracker */}
      {activeTab === 'batches' && (
        <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200  bg-slate-50 ">
            <h3 className="text-sm font-bold text-slate-800 ">
              Perishable Goods Expiry Schedule (FEFO Engine)
            </h3>
            <p className="text-xs text-slate-500">
              Sorted by First Expiring, First Out. Check shelf rotation and mark markdowns or clearance.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-3">Batch Number</th>
                  <th className="py-3 px-3">Expiry Date</th>
                  <th className="py-3 px-3 text-center">Urgency</th>
                  <th className="py-3 px-3 text-center">Batch Quantity</th>
                  <th className="py-3 px-4">Shelf Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100  font-medium">
                {batches.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No perishable batches currently tracked.
                    </td>
                  </tr>
                ) : (
                  batches.map((b) => {
                    let badgeClass = 'bg-emerald-100 text-emerald-800  ';
                    let label = `${b.daysUntilExpiry} days remaining`;

                    if (b.urgency === 'EXPIRED') {
                      badgeClass = 'bg-rose-600 text-white font-black';
                      label = 'EXPIRED';
                    } else if (b.urgency === 'CRITICAL_3D') {
                      badgeClass = 'bg-rose-100 text-rose-800   font-bold animate-pulse';
                      label = `CRITICAL (${b.daysUntilExpiry} days)`;
                    } else if (b.urgency === 'URGENT_7D') {
                      badgeClass = 'bg-amber-100 text-amber-800   font-bold';
                      label = `Expiring soon (${b.daysUntilExpiry} days)`;
                    }

                    return (
                      <tr key={b.id} className="hover:bg-slate-50 ">
                        <td className="py-3 px-4 font-bold text-slate-900 ">
                          {b.product.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600 ">
                          {b.batchNumber}
                        </td>
                        <td className="py-3 px-3 text-slate-700  font-semibold">
                          {new Date(b.expiryDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] ${badgeClass}`}>
                            {label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900  font-mono">
                          {b.currentQty} units
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {b.product.shelfLocation || 'Cold Storage'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Stock Movement Audit Log */}
      {activeTab === 'movements' && (
        <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200  bg-slate-50 ">
            <h3 className="text-sm font-bold text-slate-800 ">
              Immutable Stock Movement Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Complete transactional history for sales, goods receiving, damages, adjustments, and transfers.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Transaction Type</th>
                  <th className="py-3 px-3 text-right">Quantity Delta</th>
                  <th className="py-3 px-3 text-right">Balance After</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100  font-medium">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map((m) => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id} className="hover:bg-slate-50 ">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                          {new Date(m.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900 ">
                          {m.product.name}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.type === 'SALE'
                                ? 'bg-indigo-100 text-indigo-700  '
                                : m.type === 'PURCHASE' || m.type === 'OPENING'
                                ? 'bg-emerald-100 text-emerald-700  '
                                : m.type === 'DAMAGE'
                                ? 'bg-rose-100 text-rose-700  '
                                : 'bg-slate-100 text-slate-700  '
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td
                          className={`py-3 px-3 text-right font-mono font-bold ${
                            isPositive
                              ? 'text-emerald-600 '
                              : 'text-rose-600 '
                          }`}
                        >
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 ">
                          {m.balanceAfter}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                          {m.reason}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 ">
                  Stock Adjustment
                </h3>
                <p className="text-xs text-slate-500">{adjustItem.productName}</p>
              </div>
              <button
                onClick={() => setAdjustItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50  rounded-xl flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Current Physical On-Hand:</span>
              <span className="font-bold text-slate-900  font-mono text-sm">
                {adjustItem.onHand} units
              </span>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Adjustment Action
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAdjustType('ADD')}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      adjustType === 'ADD'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200  bg-slate-50  text-slate-600'
                    }`}
                  >
                    + Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('SUBTRACT')}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      adjustType === 'SUBTRACT'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'border-slate-200  bg-slate-50  text-slate-600'
                    }`}
                  >
                    - Deduct
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('DAMAGE')}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      adjustType === 'DAMAGE'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-slate-200  bg-slate-50  text-slate-600'
                    }`}
                  >
                    Damage
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('SET')}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                      adjustType === 'SET'
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'border-slate-200  bg-slate-50  text-slate-600'
                    }`}
                  >
                    Set Count
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Quantity
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  autoFocus
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300  bg-slate-50  text-slate-900 "
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Reason for Audit Record
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                >
                  <option value="Physical count discrepancy">Physical count discrepancy</option>
                  <option value="Expired product write-off">Expired product write-off</option>
                  <option value="Damaged packaging in storage">Damaged packaging in storage</option>
                  <option value="Stock found in warehouse">Stock found in warehouse</option>
                  <option value="Theft or unknown shrinkage">Theft or unknown shrinkage</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAdjustItem(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
                >
                  Save Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
