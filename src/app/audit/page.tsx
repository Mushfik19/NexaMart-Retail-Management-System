'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Lock } from 'lucide-react';

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedModule !== 'all') params.set('module', selectedModule);
    if (selectedAction !== 'all') params.set('action', selectedAction);

    fetch(`/api/audit-logs?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedModule, selectedAction]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      <div>
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
          Security & Inventory Audit Trail
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable system log recording price changes, stock adjustments, cashier drawer events, and refunds
        </p>
      </div>

      {/* Filter Bar */}
      <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
            System Module
          </label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200  bg-slate-50  font-semibold text-slate-800 "
          >
            <option value="all">All Modules</option>
            <option value="POS">POS Checkout</option>
            <option value="INVENTORY">Inventory & Adjustments</option>
            <option value="PURCHASING">Purchasing & Receiving</option>
            <option value="PRODUCTS">Products & Pricing</option>
            <option value="REGISTER">Cash Register</option>
            <option value="RETURNS">Returns & Refunds</option>
            <option value="USERS">Users & Auth</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
            Action Type
          </label>
          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-xl border border-slate-200  bg-slate-50  font-semibold text-slate-800 "
          >
            <option value="all">All Actions</option>
            <option value="SALE">SALE</option>
            <option value="REFUND">REFUND</option>
            <option value="ADJUSTMENT">ADJUSTMENT</option>
            <option value="RECEIVE_STOCK">RECEIVE_STOCK</option>
            <option value="REGISTER_OPEN">REGISTER_OPEN</option>
            <option value="REGISTER_CLOSE">REGISTER_CLOSE</option>
            <option value="UPDATE">UPDATE (Price Change)</option>
            <option value="CREATE">CREATE</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-3">Staff Member</th>
                <th className="py-3 px-3">Role</th>
                <th className="py-3 px-3">Module</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading security audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No audit records matching filter criteria.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 ">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-900 ">
                      {l.user?.fullName || 'System Event'}
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[10px] font-mono text-slate-400">
                        {l.user?.role || 'SYSTEM'}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100  text-slate-700 ">
                        {l.module}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          l.action === 'SALE'
                            ? 'bg-emerald-100 text-emerald-800  '
                            : l.action === 'REFUND' || l.action === 'DELETE'
                            ? 'bg-rose-100 text-rose-800  '
                            : l.action === 'ADJUSTMENT'
                            ? 'bg-amber-100 text-amber-800  '
                            : 'bg-sky-100 text-sky-800  '
                        }`}
                      >
                        {l.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-slate-700  text-xs">
                      {l.details}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
