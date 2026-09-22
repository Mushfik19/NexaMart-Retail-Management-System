'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { Lock, Unlock, AlertTriangle, CheckCircle2, FileText, ArrowRight } from 'lucide-react';

export default function EndOfDayPage() {
  const { store, formatCurrency, user } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  
  // Checklists
  const [openChecklist, setOpenChecklist] = useState({ alarm: false, floors: false, doors: false });
  const [closeChecklist, setCloseChecklist] = useState({ safe: false, trash: false, doors: false });

  const isOpenChecklistComplete = openChecklist.alarm && openChecklist.floors && openChecklist.doors;
  const isCloseChecklistComplete = closeChecklist.safe && closeChecklist.trash && closeChecklist.doors;

  const loadData = () => {
    setLoading(true);
    fetch(`/api/store-day?storeId=${store?.id || ''}`)
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

  const handleOpenDay = async () => {
    if (!isOpenChecklistComplete) {
      alert('Please complete the Store Opening Checklist.');
      return;
    }
    
    try {
      const res = await fetch('/api/store-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'OPEN_DAY', storeId: store?.id, notes: `[Checklist Verified] ${notes}` })
      });
      if (res.ok) {
        setNotes('');
        setOpenChecklist({ alarm: false, floors: false, doors: false });
        loadData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to open day');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCloseDay = async () => {
    if (!data?.metrics?.allShiftsClosed) {
      alert('Cannot close Business Day. Some registers are still open!');
      return;
    }
    if (!isCloseChecklistComplete) {
      alert('Please complete the Store Closing Checklist.');
      return;
    }
    
    try {
      const res = await fetch('/api/store-day', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'CLOSE_DAY', 
          storeId: store?.id, 
          notes: `[Checklist Verified] ${notes}`,
          metrics: data?.metrics
        })
      });
      if (res.ok) {
        setNotes('');
        setCloseChecklist({ safe: false, trash: false, doors: false });
        loadData();
      } else {
        const errorData = await res.json();
        alert(errorData.error || 'Failed to close day');
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-6">Loading Business Day...</div>;
  }

  const { activeDay, lastDay, metrics, shifts } = data || {};

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto select-none text-slate-900">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            Business Day Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Store-wide aggregation, End-of-Day reconciliation, and manager approvals.
          </p>
        </div>
      </div>

      {!activeDay ? (
        <div className="p-8 bg-white border border-slate-200 rounded-3xl space-y-6">
          <div className="text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              Business Day is Closed
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Open a new business day to start recording store-wide transactions and allow registers to be opened.
            </p>
          </div>
          
          <div className="max-w-sm mx-auto space-y-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-3">
              <h4 className="text-xs font-bold text-slate-700">Store Opening Checklist</h4>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input type="checkbox" checked={openChecklist.alarm} onChange={e => setOpenChecklist({...openChecklist, alarm: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                <span>Alarm system deactivated</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input type="checkbox" checked={openChecklist.floors} onChange={e => setOpenChecklist({...openChecklist, floors: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                <span>Store front & floors clean</span>
              </label>
              <label className="flex items-center space-x-2 text-sm cursor-pointer">
                <input type="checkbox" checked={openChecklist.doors} onChange={e => setOpenChecklist({...openChecklist, doors: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                <span>Main doors unlocked</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Opening Notes</label>
              <input 
                type="text" 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Manager on duty, weather, etc." 
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
              />
            </div>
            <button
              onClick={handleOpenDay}
              className="w-full px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors"
            >
              Open Business Day
            </button>
          </div>

          {lastDay && (
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs">
              <span className="font-semibold text-slate-700">Last Closed Day: </span>
              <span className="text-slate-500">{new Date(lastDay.closedAt).toLocaleString()} by {lastDay.closedBy?.fullName}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-6 bg-white border border-slate-200 rounded-3xl flex justify-between items-center shadow-xs">
            <div>
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-base font-bold text-slate-900">
                  Business Day is OPEN
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Opened At: {new Date(activeDay.openedAt).toLocaleString()} by {activeDay.openedBy?.fullName}
              </p>
            </div>
            <button
              onClick={handleCloseDay}
              disabled={!metrics?.allShiftsClosed}
              className={`px-5 py-2.5 font-bold text-xs rounded-xl shadow-md transition-colors flex items-center space-x-2 ${
                metrics?.allShiftsClosed 
                ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Close Business Day</span>
            </button>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Gross Sales</span>
              <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                {formatCurrency(metrics?.grossSales || 0)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Net Sales</span>
              <p className="text-xl font-black text-emerald-600 mt-1 font-mono">
                {formatCurrency(metrics?.netSales || 0)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Refunds Total</span>
              <p className="text-xl font-black text-rose-600 mt-1 font-mono">
                {formatCurrency(metrics?.refundsTotal || 0)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Total Tax Collected</span>
              <p className="text-xl font-black text-slate-900 mt-1 font-mono">
                {formatCurrency(metrics?.taxTotal || 0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Shift / Register Status
              </h3>
              {!metrics?.allShiftsClosed && (
                <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>There are still open registers. All registers must be closed and reconciled before you can close the business day.</span>
                </div>
              )}
              {metrics?.allShiftsClosed && shifts?.length > 0 && (
                <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>All registers have been closed successfully.</span>
                </div>
              )}
              
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {shifts?.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No registers were opened today.</p>
                ) : (
                  shifts?.map((s: any) => (
                    <div key={s.id} className="p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{s.register?.name || 'Register'}</p>
                        <p className="text-slate-500">{s.user?.fullName}</p>
                      </div>
                      <div className="text-right">
                        {s.status === 'OPEN' ? (
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">OPEN</span>
                        ) : (
                          <div className="text-slate-500">
                            <span className="font-bold">Closed:</span> {new Date(s.endTime).toLocaleTimeString()} <br/>
                            Diff: <span className={s.cashDifference < 0 ? 'text-rose-600' : s.cashDifference > 0 ? 'text-sky-600' : 'text-slate-900'}>{formatCurrency(s.cashDifference)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="p-6 bg-white border border-slate-200 rounded-3xl shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
                Day Closing Reconciliation
              </h3>
              
              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Expected Drawer Cash (All Registers):</span>
                  <span className="font-mono text-slate-900 font-bold">{formatCurrency(metrics?.expectedCash || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500 font-medium">Actual Counted Cash (All Registers):</span>
                  <span className="font-mono text-slate-900 font-bold">{formatCurrency(metrics?.actualCash || 0)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-t border-slate-100">
                  <span className="text-slate-700 font-bold">Total Cash Discrepancy:</span>
                  <span className={`font-mono font-black ${metrics?.cashDifference < 0 ? 'text-rose-600' : metrics?.cashDifference > 0 ? 'text-sky-600' : 'text-emerald-600'}`}>
                    {formatCurrency(metrics?.cashDifference || 0)}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-3 mt-4">
                <h4 className="text-xs font-bold text-slate-700">Store Closing Checklist</h4>
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={closeChecklist.safe} onChange={e => setCloseChecklist({...closeChecklist, safe: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                  <span>All cash secured in safe</span>
                </label>
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={closeChecklist.trash} onChange={e => setCloseChecklist({...closeChecklist, trash: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                  <span>Trash taken out</span>
                </label>
                <label className="flex items-center space-x-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={closeChecklist.doors} onChange={e => setCloseChecklist({...closeChecklist, doors: e.target.checked})} className="rounded text-emerald-600 focus:ring-emerald-500" />
                  <span>Main doors locked & alarm armed</span>
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Closing Notes / Manager Sign-off</label>
                <input 
                  type="text" 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  disabled={!metrics?.allShiftsClosed}
                  placeholder="Manager approval notes" 
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 disabled:opacity-50"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
