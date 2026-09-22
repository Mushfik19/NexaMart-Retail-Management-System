'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Star, Award, Check } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Customer } from '@/lib/types';

interface Props {
  onClose: () => void;
}

export default function CustomerSelectModal({ onClose }: Props) {
  const { customer, setCustomer, redeemedPoints, setRedeemedPoints } = useApp();
  const [query, setQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // New customer form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Points redemption input
  const [pointsToRedeem, setPointsToRedeem] = useState(redeemedPoints ? String(redeemedPoints) : '0');

  useEffect(() => {
    setLoading(true);
    fetch(`/api/customers?q=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data.customers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query]);

  const handleSelectCustomer = (c: Customer) => {
    setCustomer(c);
  };

  const handleApplyRedemption = () => {
    const pts = parseInt(pointsToRedeem) || 0;
    if (customer && pts > customer.pointsBalance) {
      alert(`Customer only has ${customer.pointsBalance} loyalty points.`);
      return;
    }
    setRedeemedPoints(pts);
    onClose();
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          phone: newPhone,
          email: newEmail,
        }),
      });
      const data = await res.json();
      if (data.customer) {
        setCustomer(data.customer);
        onClose();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white  border border-slate-200  rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200  flex items-center justify-between bg-slate-50 ">
          <div>
            <h2 className="text-sm font-bold text-slate-900 ">
              Customer & Loyalty Membership (F2)
            </h2>
            <p className="text-xs text-slate-500">Assign loyalty account to current sale</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600  hover:bg-slate-200 "
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-slate-200  flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search by phone, name, or membership #..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300  bg-slate-50  text-slate-900  focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-2 rounded-xl bg-sky-50  border border-sky-200  text-sky-700  text-xs font-semibold flex items-center space-x-1.5 hover:bg-sky-100 transition-colors shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>{showAddForm ? 'View List' : 'New Member'}</span>
          </button>
        </div>

        {/* Add Member Form */}
        {showAddForm ? (
          <form onSubmit={handleCreateCustomer} className="p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Register New Loyalty Member
            </h3>
            <div>
              <label className="block text-xs font-medium text-slate-700  mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Sarah Connor"
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300  bg-slate-50 "
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700  mb-1">
                  Mobile Phone
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="0412 000 000"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300  bg-slate-50 "
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700  mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300  bg-slate-50 "
                />
              </div>
            </div>

            <div className="p-3 bg-sky-50  rounded-xl border border-sky-200  text-xs text-sky-700 ">
              🎉 New member receives 50 Welcome Loyalty Points instantly!
            </div>

            <div className="pt-2 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-sm"
              >
                Create & Assign
              </button>
            </div>
          </form>
        ) : (
          /* Customer List */
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 ">
            {customer && (
              <div className="p-4 bg-emerald-50  border-b border-emerald-200  flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-emerald-900 ">
                      Currently Assigned: {customer.name}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700  mt-0.5">
                    {customer.loyaltyTier} Tier • {customer.pointsBalance} Loyalty Points ($
                    {(customer.pointsBalance / 100).toFixed(2)} value)
                  </p>
                </div>
                <button
                  onClick={() => setCustomer(null)}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700"
                >
                  Unassign
                </button>
              </div>
            )}

            {/* Points Redemption Slider if Customer is assigned */}
            {customer && customer.pointsBalance >= 100 && (
              <div className="p-4 bg-slate-50  border-b border-slate-200  space-y-2">
                <div className="flex justify-between text-xs font-semibold text-slate-700 ">
                  <span>Redeem Points for Discount</span>
                  <span>100 pts = $1.00</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    step="100"
                    min="0"
                    max={customer.pointsBalance}
                    value={pointsToRedeem}
                    onChange={(e) => setPointsToRedeem(e.target.value)}
                    className="w-24 text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-300  bg-white "
                  />
                  <span className="text-xs text-emerald-600 font-bold">
                    = -${((parseInt(pointsToRedeem) || 0) / 100).toFixed(2)} Off
                  </span>
                  <button
                    onClick={handleApplyRedemption}
                    className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg ml-auto"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Searching directory...</div>
            ) : customers.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No customers found.</div>
            ) : (
              customers.map((c) => (
                <div
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50  cursor-pointer transition-colors"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 ">
                        {c.name}
                      </span>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800  ">
                        {c.loyaltyTier}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {c.phone || 'No phone'} • {c.membershipNo}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-sky-600 ">
                      {c.pointsBalance} pts
                    </p>
                    <p className="text-[10px] text-slate-400">${c.totalSpending.toFixed(0)} spent</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50  border-t border-slate-200  flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
