'use client';

import React, { useState, useEffect } from 'react';
import { Users, Search, UserPlus, Star, Award, DollarSign, Phone, Mail, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function CustomersPage() {
  const { formatCurrency } = useApp();
  const [customers, setCustomers] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    customerType: 'REGULAR',
  });

  const loadCustomers = () => {
    setLoading(true);
    fetch(`/api/customers?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((d) => {
        setCustomers(d.customers || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCustomers();
  }, [query]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({ name: '', phone: '', email: '', address: '', customerType: 'REGULAR' });
        loadCustomers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const totalPoints = customers.reduce((s, c) => s + c.pointsBalance, 0);
  const totalSpend = customers.reduce((s, c) => s + c.totalSpending, 0);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Customer Directory & Loyalty Program
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Reward loyalty members ($1 = 1 pt), monitor customer tiers, and track retail spending
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center space-x-1.5 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Member</span>
        </button>
      </div>

      {/* Analytics KPI 3-card banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Registered Members</span>
            <p className="text-2xl font-black text-slate-900  mt-1">
              {customers.length}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-sky-50  text-sky-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Active Loyalty Points</span>
            <p className="text-2xl font-black text-emerald-600  mt-1">
              {totalPoints.toLocaleString()} pts
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50  text-emerald-600 flex items-center justify-center">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Member Spend</span>
            <p className="text-2xl font-black text-slate-900  mt-1">
              {formatCurrency(totalSpend)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50  text-indigo-600 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-3 bg-white  border border-slate-200  rounded-2xl shadow-xs flex items-center">
        <Search className="w-4 h-4 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Search by name, phone (04XX), email, or card # (MEM-XXXX)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-3 pr-2 py-1 text-xs bg-transparent text-slate-800  focus:outline-none font-medium"
        />
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-3">Card / Membership #</th>
                <th className="py-3 px-3">Contact</th>
                <th className="py-3 px-3 text-center">Loyalty Tier</th>
                <th className="py-3 px-3 text-right">Points Balance</th>
                <th className="py-3 px-4 text-right">Lifetime Spend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Loading customer profiles...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No customers found matching query.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 ">
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900 ">{c.name}</p>
                      <span className="text-[10px] text-slate-400 capitalize">{c.customerType.toLowerCase()} account</span>
                    </td>

                    <td className="py-3 px-3 font-mono text-[11px] text-slate-600 ">
                      {c.membershipNo}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.phone || 'N/A'}</span>
                      </div>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{c.email || 'N/A'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          c.loyaltyTier === 'VIP'
                            ? 'bg-purple-100 text-purple-800  '
                            : c.loyaltyTier === 'GOLD'
                            ? 'bg-amber-100 text-amber-800  '
                            : c.loyaltyTier === 'SILVER'
                            ? 'bg-slate-200 text-slate-800  '
                            : 'bg-emerald-50 text-emerald-800  '
                        }`}
                      >
                        {c.loyaltyTier}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-black font-mono text-sky-600  text-sm">
                      {c.pointsBalance} pts
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 ">
                      {formatCurrency(c.totalSpending)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 ">
                Register Loyalty Customer
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Liam Anderson"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Mobile Phone
                </label>
                <input
                  type="text"
                  placeholder="0412 345 678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="liam@gmail.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                />
              </div>

              <div className="p-3 bg-emerald-50  rounded-xl border border-emerald-200  text-xs text-emerald-800 ">
                ⭐ 50 points welcome bonus awarded automatically on registration.
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 rounded-lg hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-sm"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
