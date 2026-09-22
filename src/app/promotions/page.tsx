'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Plus, CheckCircle2, Calendar, Ticket, X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function PromotionsPage() {
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'PERCENTAGE',
    value: '15',
    minSpend: '20',
    buyQty: '2',
    getQty: '1',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    usageLimit: '500',
  });

  const loadPromotions = () => {
    setLoading(true);
    fetch('/api/promotions')
      .then((r) => r.json())
      .then((d) => {
        setPromotions(d.promotions || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({
          name: '',
          code: '',
          type: 'PERCENTAGE',
          value: '15',
          minSpend: '20',
          buyQty: '2',
          getQty: '1',
          startDate: new Date().toISOString().slice(0, 10),
          endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          usageLimit: '500',
        });
        loadPromotions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            Promotions, Coupons & BOGO Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure automated cart discounts, bundle pricing (e.g. 2 for $7), and seasonal coupons
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-600/20 flex items-center space-x-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Promotion</span>
        </button>
      </div>

      {/* Promotions Table */}
      <div className="rounded-2xl bg-white  border border-slate-200  shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50  border-b border-slate-200  text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-3">Coupon Code</th>
                <th className="py-3 px-3">Discount Type</th>
                <th className="py-3 px-3">Discount Value</th>
                <th className="py-3 px-3">Validity Window</th>
                <th className="py-3 px-3 text-right">Redemptions</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Loading promotional campaigns...
                  </td>
                </tr>
              ) : promotions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No active promotions configured.
                  </td>
                </tr>
              ) : (
                promotions.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 ">
                    <td className="py-3 px-4 font-bold text-slate-900 ">
                      {p.name}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-sky-600 ">
                      {p.code ? p.code : 'Automatic'}
                    </td>

                    <td className="py-3 px-3 text-slate-600 ">
                      {p.type.replace(/_/g, ' ')}
                    </td>

                    <td className="py-3 px-3 font-bold text-slate-800 ">
                      {p.type === 'PERCENTAGE'
                        ? `${p.value}% Off`
                        : p.type === 'BUY_X_GET_Y'
                        ? `Buy ${p.buyQty || 2} for $${p.value}`
                        : `$${p.value} Off`}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-slate-500">
                      {new Date(p.startDate).toLocaleDateString()} –{' '}
                      {new Date(p.endDate).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700 ">
                      {p.usageCount} / {p.usageLimit || '∞'}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800  ">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Promotion Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
          <div className="bg-white  border border-slate-200  rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-900 ">
                Create Retail Campaign or Voucher
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Dairy 15% Off Special"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700  mb-1">
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. DAIRY15"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full text-xs font-mono uppercase px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700  mb-1">
                    Discount Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  >
                    <option value="PERCENTAGE">Percentage Discount (%)</option>
                    <option value="FIXED">Fixed Amount Off ($)</option>
                    <option value="BUY_X_GET_Y">Bundle Pricing (e.g. 2 for $7)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700  mb-1">
                    Value (% or $)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    className="w-full text-xs font-bold px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700  mb-1">
                    Min Cart Spend ($)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.minSpend}
                    onChange={(e) => setFormData({ ...formData, minSpend: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300  bg-slate-50 "
                  />
                </div>
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
                  Save Campaign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
