'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  PackageCheck,
  CheckCircle2,
  Clock,
  Search,
  Building,
  AlertCircle,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function PurchasingPage() {
  const { store, formatCurrency } = useApp();
  const [activeTab, setActiveTab] = useState<'orders' | 'receive' | 'suppliers'>('orders');

  const [orders, setOrders] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New PO Modal
  const [showPoModal, setShowPoModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [poItems, setPoItems] = useState<{ productId: string; quantity: number; unitCost: number }[]>([]);
  const [poNotes, setPoNotes] = useState('');

  // Goods Receiving Terminal
  const [selectedPoForReceive, setSelectedPoForReceive] = useState<any | null>(null);
  const [receivedItems, setReceivedItems] = useState<any[]>([]);
  const [supplierInvoice, setSupplierInvoice] = useState('');
  const [receiveSuccessNotice, setReceiveSuccessNotice] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetch(`/api/purchasing/orders?storeId=${store?.id || ''}`).then((r) => r.json()),
      fetch('/api/suppliers').then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ])
      .then(([ordData, supData, prodData]) => {
        setOrders(ordData.orders || []);
        setSuppliers(supData.suppliers || []);
        setProducts(prodData.products || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [store?.id]);

  const handleOpenReceive = (order: any) => {
    setSelectedPoForReceive(order);
    setReceivedItems(
      order.items.map((i: any) => ({
        productId: i.productId,
        productName: i.product.name,
        barcode: i.product.barcode,
        orderedQty: i.orderedQty,
        receivedQty: i.orderedQty,
        damagedQty: 0,
        unitCost: i.unitCost,
        batchNumber: `B-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
      }))
    );
    setActiveTab('receive');
  };

  const handleCompleteReceive = async () => {
    if (!selectedPoForReceive) return;
    try {
      const res = await fetch('/api/purchasing/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseOrderId: selectedPoForReceive.id,
          storeId: store?.id,
          supplierInvoice,
          items: receivedItems,
        }),
      });

      if (res.ok) {
        setReceiveSuccessNotice('Goods verified and inventory physically incremented!');
        setSelectedPoForReceive(null);
        setReceivedItems([]);
        loadData();
        setTimeout(() => {
          setReceiveSuccessNotice(null);
          setActiveTab('orders');
        }, 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddPoItem = (productId: string) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod) return;
    setPoItems((prev) => [
      ...prev,
      { productId: prod.id, quantity: 20, unitCost: prod.costPrice },
    ]);
  };

  const handleCreatePo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || poItems.length === 0) return;

    try {
      const res = await fetch('/api/purchasing/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: selectedSupplierId,
          storeId: store?.id,
          notes: poNotes,
          items: poItems,
        }),
      });

      if (res.ok) {
        setShowPoModal(false);
        setPoItems([]);
        setPoNotes('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Purchasing & Goods Receiving
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supplier purchase orders, delivery validation, and automated inventory intake
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Tabs */}
          <div className="flex items-center bg-white  p-1 rounded-xl border border-slate-200  text-xs font-semibold shadow-xs">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                activeTab === 'orders'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 '
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Purchase Orders ({orders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('receive')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                activeTab === 'receive'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 '
              }`}
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>Goods Receiving</span>
            </button>

            <button
              onClick={() => setActiveTab('suppliers')}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
                activeTab === 'suppliers'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 '
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Suppliers ({suppliers.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              setSelectedSupplierId(suppliers[0]?.id || '');
              setShowPoModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>New PO</span>
          </button>
        </div>
      </div>

      {receiveSuccessNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500 text-white font-bold text-xs flex items-center space-x-2 shadow-md">
          <CheckCircle2 className="w-4 h-4" />
          <span>{receiveSuccessNotice}</span>
        </div>
      )}

      {/* TAB 1: Purchase Orders */}
      {activeTab === 'orders' && (
        <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-3">Supplier</th>
                  <th className="py-3 px-3">Order Date</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-right">Items Count</th>
                  <th className="py-3 px-3 text-right">Total Cost</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100  font-medium">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No purchase orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50 ">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 ">
                        {o.poNumber}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800 ">
                        {o.supplier.name}
                      </td>
                      <td className="py-3 px-3 text-slate-500">
                        {new Date(o.orderDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            o.status === 'RECEIVED'
                              ? 'bg-emerald-100 text-emerald-800  '
                              : 'bg-sky-100 text-sky-800  '
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600 ">
                        {o.items.length} items
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 ">
                        {formatCurrency(o.grandTotal)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {o.status !== 'RECEIVED' ? (
                          <button
                            onClick={() => handleOpenReceive(o)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1 ml-auto"
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Receive Stock</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 font-semibold">Stock Ingested</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Goods Receiving Terminal */}
      {activeTab === 'receive' && (
        <div className="p-6 bg-white  border border-slate-200  rounded-2xl shadow-xs space-y-4">
          {!selectedPoForReceive ? (
            <div className="text-center py-12 space-y-3">
              <PackageCheck className="w-12 h-12 text-slate-400 mx-auto stroke-1" />
              <h3 className="text-sm font-bold text-slate-700 ">
                No Purchase Order Selected for Goods Receiving
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Go to the Purchase Orders tab and click &quot;Receive Stock&quot; on an open order to verify physical deliveries.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 ">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 ">
                    Verify Goods for {selectedPoForReceive.poNumber} ({selectedPoForReceive.supplier.name})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Compare physical delivery against ordered quantities. Damaged units will not increase available stock.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Supplier Invoice # (optional)"
                    value={supplierInvoice}
                    onChange={(e) => setSupplierInvoice(e.target.value)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-300  bg-slate-50 "
                  />
                  <button
                    onClick={handleCompleteReceive}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Ingest Stock</span>
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100  space-y-3">
                {receivedItems.map((item, idx) => (
                  <div key={idx} className="pt-3 grid grid-cols-12 gap-3 items-center">
                    <div className="col-span-4">
                      <p className="font-bold text-xs text-slate-900 ">{item.productName}</p>
                      <span className="text-[10px] text-slate-400 font-mono">Barcode: {item.barcode}</span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-500">Ordered</span>
                      <p className="font-mono font-bold text-xs">{item.orderedQty} units</p>
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 block">Delivered Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={item.receivedQty}
                        onChange={(e) => {
                          const updated = [...receivedItems];
                          updated[idx].receivedQty = parseInt(e.target.value) || 0;
                          setReceivedItems(updated);
                        }}
                        className="w-20 text-xs font-bold px-2 py-1 rounded border border-slate-300  bg-slate-50 "
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-rose-500 block">Damaged Qty</label>
                      <input
                        type="number"
                        min="0"
                        value={item.damagedQty}
                        onChange={(e) => {
                          const updated = [...receivedItems];
                          updated[idx].damagedQty = parseInt(e.target.value) || 0;
                          setReceivedItems(updated);
                        }}
                        className="w-20 text-xs font-bold px-2 py-1 rounded border border-slate-300  bg-slate-50  text-rose-600"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="text-[10px] text-slate-500 block">Batch Code</label>
                      <input
                        type="text"
                        value={item.batchNumber}
                        onChange={(e) => {
                          const updated = [...receivedItems];
                          updated[idx].batchNumber = e.target.value;
                          setReceivedItems(updated);
                        }}
                        className="w-full text-xs font-mono px-2 py-1 rounded border border-slate-300  bg-slate-50 "
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Suppliers Directory */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 ">{s.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-sky-50  text-sky-600">
                  {s.paymentTerms || 'Net 30'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Contact: {s.contactPerson || 'Sales Team'}</p>
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <p>Phone: {s.phone || 'N/A'}</p>
                <p>Email: {s.email || 'N/A'}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New PO Modal */}
      {showPoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 ">
                Create Supplier Purchase Order
              </h3>
              <button onClick={() => setShowPoModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Select Supplier
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.paymentTerms})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Add Product to PO
                </label>
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleAddPoItem(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                >
                  <option value="">-- Choose item from catalog --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Cost: ${p.costPrice})
                    </option>
                  ))}
                </select>
              </div>

              {/* PO Items List */}
              <div className="max-h-48 overflow-y-auto space-y-2 border-t border-slate-100  pt-2">
                {poItems.map((item, idx) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 ">
                      <span className="font-semibold text-slate-800 ">{prod?.name}</span>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...poItems];
                            updated[idx].quantity = parseInt(e.target.value) || 1;
                            setPoItems(updated);
                          }}
                          className="w-16 text-center text-xs font-bold px-1 py-0.5 rounded border border-slate-300 "
                        />
                        <span className="font-mono font-bold">${(item.quantity * item.unitCost).toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowPoModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
                >
                  Dispatch Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
