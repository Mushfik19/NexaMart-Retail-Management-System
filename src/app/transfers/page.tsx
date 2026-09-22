'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeftRight, Plus, Truck, CheckCircle2, Clock, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function TransfersPage() {
  const { stores, refreshAppData } = useApp();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Transfer Modal
  const [showModal, setShowModal] = useState(false);
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId] = useState('');
  const [notes, setNotes] = useState('');
  const [transferItems, setTransferItems] = useState<{ productId: string; quantity: number }[]>([]);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/transfers').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ])
      .then(([trfData, prodData]) => {
        setTransfers(trfData.transfers || []);
        setProducts(prodData.products || []);
        if (stores.length >= 2) {
          setFromStoreId(stores[0].id);
          setToStoreId(stores[1].id);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [stores]);

  const handleAddProduct = (productId: string) => {
    if (!productId) return;
    setTransferItems((prev) => [...prev, { productId, quantity: 10 }]);
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStoreId || !toStoreId || transferItems.length === 0) return;

    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromStoreId,
          toStoreId,
          notes,
          items: transferItems,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTransferItems([]);
        setNotes('');
        await refreshAppData();
        loadData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to initiate transfer');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Multi-Store Stock Transfers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dispatch inventory between Flagship Superstore, Metro Express, and Central Warehouse
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Stock Transfer</span>
        </button>
      </div>

      {/* Transfers Table */}
      <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Transfer Number</th>
                <th className="py-3 px-3">From Branch</th>
                <th className="py-3 px-3">To Branch</th>
                <th className="py-3 px-3">Initiated By</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Items Count</th>
                <th className="py-3 px-4 text-slate-400">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading transfer logs...
                  </td>
                </tr>
              ) : transfers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active stock transfers found.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 ">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900 ">
                      {t.transferNumber}
                    </td>

                    <td className="py-3 px-3 text-slate-800  font-semibold">
                      {t.fromStore.name}
                    </td>

                    <td className="py-3 px-3 text-slate-800  font-semibold">
                      {t.toStore.name}
                    </td>

                    <td className="py-3 px-3 text-slate-600 ">
                      {t.initiatedBy?.fullName || 'Staff'}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800  ">
                        {t.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700 ">
                      {t.items.length} lines
                    </td>

                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(t.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Transfer Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 ">
                Dispatch Stock Transfer
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700  mb-1">
                    Source Branch (Dispatches Stock)
                  </label>
                  <select
                    value={fromStoreId}
                    onChange={(e) => setFromStoreId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700  mb-1">
                    Destination Branch
                  </label>
                  <select
                    value={toStoreId}
                    onChange={(e) => setToStoreId(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Add Item to Transfer
                </label>
                <select
                  onChange={(e) => {
                    handleAddProduct(e.target.value);
                    e.target.value = '';
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                >
                  <option value="">-- Choose item from catalog --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Barcode: {p.barcode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List */}
              <div className="max-h-48 overflow-y-auto space-y-2 border-t border-slate-100  pt-2">
                {transferItems.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 "
                    >
                      <span className="font-semibold text-slate-800 ">
                        {prod?.name}
                      </span>
                      <div className="flex items-center space-x-2">
                        <label className="text-[10px] text-slate-400">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...transferItems];
                            updated[idx].quantity = parseInt(e.target.value) || 1;
                            setTransferItems(updated);
                          }}
                          className="w-16 text-center text-xs font-bold px-1 py-0.5 rounded border border-slate-300 "
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
                >
                  Dispatch Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
