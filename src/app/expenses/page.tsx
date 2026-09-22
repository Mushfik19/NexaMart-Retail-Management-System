'use client';

import React, { useState, useEffect } from 'react';
import { ReceiptText, Plus, DollarSign, Calendar, Tag, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function ExpensesPage() {
  const { store, formatCurrency } = useApp();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    category: 'UTILITIES',
    amount: '',
    description: '',
    paymentMethod: 'CASH',
  });

  const loadExpenses = () => {
    setLoading(true);
    fetch(`/api/expenses?storeId=${store?.id || ''}`)
      .then((r) => r.json())
      .then((d) => {
        setExpenses(d.expenses || []);
        setTotal(d.total || 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadExpenses();
  }, [store?.id]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount || !formData.description) return;

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          storeId: store?.id,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setFormData({ category: 'UTILITIES', amount: '', description: '', paymentMethod: 'CASH' });
        loadExpenses();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Store Operational Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track overhead costs including refrigeration electricity, rent, register paper rolls, and transport
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-4 py-2 bg-white  border border-slate-200  rounded-xl shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400">Total Expenses</span>
            <p className="text-base font-black text-rose-600  font-mono">
              {formatCurrency(total)}
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3">Payment Tender</th>
                <th className="py-3 px-3">Recorded By</th>
                <th className="py-3 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50 ">
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {new Date(e.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100  text-slate-700 ">
                        {e.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-800  font-semibold">
                      {e.description}
                    </td>
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {e.paymentMethod}
                    </td>
                    <td className="py-3 px-3 text-slate-600 ">
                      {e.user?.fullName || 'Manager'}
                    </td>
                    <td className="py-3 px-4 text-right font-black font-mono text-rose-600  text-sm">
                      {formatCurrency(e.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 ">
                Record Store Operating Expense
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Expense Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                >
                  <option value="UTILITIES">Utilities (Electricity, Gas, Water)</option>
                  <option value="RENT">Store Property Rent</option>
                  <option value="PACKAGING">Shopping Bags & Thermal Rolls</option>
                  <option value="MAINTENANCE">Fridge & Register Maintenance</option>
                  <option value="TRANSPORT">Freight & Delivery Fees</option>
                  <option value="OTHER">Other Operational Expense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="120.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full text-lg font-black px-3 py-2 rounded-xl border border-slate-300  bg-slate-50  text-slate-900 "
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Description / Vendor Details *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 50 rolls 80mm thermal receipt paper"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                >
                  <option value="CASH">Cash Drawer Payout</option>
                  <option value="BANK_TRANSFER">Bank EFT</option>
                  <option value="CARD">Corporate Debit Card</option>
                </select>
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
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
