'use client';

import React, { useState, useEffect } from 'react';
import {
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  History,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function RegisterPage() {
  const { store, activeShift, formatCurrency, refreshAppData } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);

  // Form states
  const [openFloat, setOpenFloat] = useState('200.00');
  const [openNotes, setOpenNotes] = useState('');

  const [actualCash, setActualCash] = useState('');
  const [closeNotes, setCloseNotes] = useState('');

  const [movementType, setMovementType] = useState<'CASH_IN' | 'CASH_OUT'>('CASH_OUT');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('Petty cash supplies expense');

  const loadData = () => {
    setLoading(true);
    fetch(`/api/register?storeId=${store?.id || ''}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [store?.id]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.registers[0]?.id) return;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'OPEN_SHIFT',
          registerId: data.registers[0].id,
          storeId: store?.id,
          openingCash: parseFloat(openFloat) || 0,
          notes: openNotes,
        }),
      });

      if (res.ok) {
        setShowOpenModal(false);
        await refreshAppData();
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CLOSE_SHIFT',
          shiftId: activeShift.id,
          actualCash: parseFloat(actualCash) || 0,
          notes: closeNotes,
        }),
      });

      if (res.ok) {
        setShowCloseModal(false);
        setActualCash('');
        await refreshAppData();
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CASH_MOVEMENT',
          shiftId: activeShift.id,
          type: movementType,
          amount: parseFloat(movementAmount) || 0,
          reason: movementReason,
        }),
      });

      if (res.ok) {
        setShowMovementModal(false);
        setMovementAmount('');
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const metrics = data?.shiftMetrics;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Cash Register & Shift Balancing
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Cash drawer audit, float opening, petty payouts, and end-of-shift reconciliation
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {activeShift ? (
            <>
              <button
                onClick={() => setShowMovementModal(true)}
                className="px-3 py-2 rounded-xl border border-slate-200  bg-white  text-xs font-semibold text-slate-700  hover:bg-slate-50 flex items-center space-x-1.5 transition-colors"
              >
                <ArrowDownCircle className="w-3.5 h-3.5 text-amber-500" />
                <span>Cash In / Out</span>
              </button>

              <button
                onClick={() => {
                  setActualCash(metrics ? String(metrics.expectedCash) : '');
                  setShowCloseModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center space-x-1.5 transition-colors"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>End Shift & Balance</span>
              </button>
            </>
          ) : (
            <button
              onClick={() => setShowOpenModal(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-1.5 transition-colors"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Open Register Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Shift Dashboard Banner */}
      {activeShift && metrics ? (
        <div className="p-6 bg-white  border border-slate-200  rounded-3xl shadow-xs space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 ">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900 ">
                  Register 01 — Active Shift
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cashier: {activeShift.user?.fullName} • Opened at:{' '}
                {activeShift.startTime ? new Date(activeShift.startTime).toLocaleTimeString() : 'Active Now'}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400">Drawer Expected Cash:</span>
              <p className="text-3xl font-black text-emerald-600  font-mono">
                {formatCurrency(metrics.expectedCash)}
              </p>
            </div>
          </div>

          {/* 4 Shift Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200 ">
              <span className="text-xs font-semibold text-slate-500">Opening Cash Float</span>
              <p className="text-xl font-black text-slate-900  mt-1 font-mono">
                {formatCurrency(metrics.openingCash)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Verified drawer start</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200 ">
              <span className="text-xs font-semibold text-slate-500">Cash Sales Intake</span>
              <p className="text-xl font-black text-emerald-600  mt-1 font-mono">
                +{formatCurrency(metrics.cashSales)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">{metrics.transactionsCount} checkout receipts</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200 ">
              <span className="text-xs font-semibold text-slate-500">EFTPOS / Card Sales</span>
              <p className="text-xl font-black text-sky-600  mt-1 font-mono">
                {formatCurrency(metrics.cardSales)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Processed to bank terminal</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50  border border-slate-200 ">
              <span className="text-xs font-semibold text-slate-500">Net Drawer Movements</span>
              <p className="text-xl font-black text-amber-600  mt-1 font-mono">
                {formatCurrency(metrics.cashInTotal - metrics.cashOutTotal)}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Petty payouts & cash-ins</p>
            </div>
          </div>
        </div>
      ) : (
        /* Register Closed Banner */
        <div className="p-8 bg-white  border border-slate-200  rounded-3xl text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-slate-100  flex items-center justify-center mx-auto text-slate-400">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800 ">
            Cash Register Currently Locked
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Open register with a starting cash float to begin taking payments and scanning barcodes at POS.
          </p>
          <button
            onClick={() => setShowOpenModal(true)}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors inline-block"
          >
            Open Register Shift ($200 Float)
          </button>
        </div>
      )}

      {/* Past Closed Shifts History */}
      <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200  bg-slate-50 ">
          <h3 className="text-sm font-bold text-slate-800 ">
            Reconciled Shifts & Cash Discrepancy History
          </h3>
          <p className="text-xs text-slate-500">
            Audit logs of expected cash vs actual physical drawer counting
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Register</th>
                <th className="py-3 px-3">Cashier</th>
                <th className="py-3 px-3">Ended At</th>
                <th className="py-3 px-3 text-right">Float</th>
                <th className="py-3 px-3 text-right">Expected Cash</th>
                <th className="py-3 px-3 text-right">Counted Cash</th>
                <th className="py-3 px-4 text-right">Discrepancy (Diff)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  font-medium">
              {data?.recentShifts?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No closed shifts recorded yet.
                  </td>
                </tr>
              ) : (
                data?.recentShifts?.map((s: any) => {
                  const diff = s.cashDifference || 0;
                  const isBalanced = Math.abs(diff) < 0.01;
                  return (
                    <tr key={s.id} className="hover:bg-slate-50 ">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900 ">
                        {s.register?.code || 'REG-01'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 ">
                        {s.user?.fullName}
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {s.endTime ? new Date(s.endTime).toLocaleString() : 'N/A'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {formatCurrency(s.openingCash)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-800 ">
                        {formatCurrency(s.expectedCash || 0)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 ">
                        {formatCurrency(s.closingCash || 0)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                            isBalanced
                              ? 'bg-emerald-100 text-emerald-800  '
                              : diff > 0
                              ? 'bg-sky-100 text-sky-800  '
                              : 'bg-rose-100 text-rose-800  '
                          }`}
                        >
                          {isBalanced ? 'Balanced ($0.00)' : diff > 0 ? `+$${diff.toFixed(2)} (Over)` : `-$${Math.abs(diff).toFixed(2)} (Short)`}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      {showOpenModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 ">
                Open Cash Drawer Shift
              </h3>
              <button onClick={() => setShowOpenModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Starting Cash Float ($)
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  autoFocus
                  value={openFloat}
                  onChange={(e) => setOpenFloat(e.target.value)}
                  className="w-full text-lg font-black px-3 py-2 rounded-xl border border-slate-300  bg-slate-50  text-slate-900 "
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Shift Notes
                </label>
                <input
                  type="text"
                  placeholder="Morning shift float checked"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                >
                  Open Drawer & Begin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Shift / Balancing Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-900 ">
                  End Shift & Reconcile Cash
                </h3>
                <p className="text-xs text-slate-500">Perform physical drawer count</p>
              </div>
              <button onClick={() => setShowCloseModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50  rounded-2xl flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">System Expected Cash:</span>
              <span className="text-base font-black text-slate-900  font-mono">
                {formatCurrency(metrics?.expectedCash || 0)}
              </span>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Actual Physically Counted Cash ($)
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  autoFocus
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full text-2xl font-black px-4 py-2.5 rounded-xl border border-slate-300  bg-slate-50  text-slate-900 "
                />
              </div>

              {actualCash && (
                <div
                  className={`p-3 rounded-xl border flex justify-between items-center text-xs font-bold ${
                    Math.abs(parseFloat(actualCash) - (metrics?.expectedCash || 0)) < 0.01
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : parseFloat(actualCash) > (metrics?.expectedCash || 0)
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <span>Difference:</span>
                  <span className="font-mono text-sm">
                    {formatCurrency(parseFloat(actualCash) - (metrics?.expectedCash || 0))}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Closing Notes / Handover
                </label>
                <input
                  type="text"
                  placeholder="Drawer checked and balanced"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-sm"
                >
                  Confirm & Lock Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cash In / Out Movement Modal */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 ">
                Drawer Cash Movement
              </h3>
              <button onClick={() => setShowMovementModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleMovement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Movement Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('CASH_OUT')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      movementType === 'CASH_OUT'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-slate-200  bg-slate-50  text-slate-600'
                    }`}
                  >
                    Cash Out / Payout
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('CASH_IN')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      movementType === 'CASH_IN'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-200  bg-slate-50  text-slate-600'
                    }`}
                  >
                    Cash In / Float Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.05"
                  required
                  autoFocus
                  placeholder="50.00"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  className="w-full text-lg font-black px-3 py-2 rounded-xl border border-slate-300  bg-slate-50  text-slate-900 "
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Reason
                </label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
                >
                  Record Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
