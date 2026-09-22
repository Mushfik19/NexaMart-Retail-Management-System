'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  XCircle,
  Users,
  Truck,
  ArrowUpRight,
  ShoppingCart,
  PlusCircle,
  FileSpreadsheet,
  Boxes,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import { useApp } from '@/context/AppContext';
import { hasPermission } from '@/lib/auth';

export default function DashboardPage() {
  const { user, store, formatCurrency } = useApp();
  const router = useRouter();
  const [range, setRange] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('week');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If not logged in, wait for redirect by middleware or context
    if (!user) return;

    // Redirect users who don't have dashboard permission to their primary modules
    if (!hasPermission(user.role, 'dashboard')) {
      if (user.role === 'CASHIER') router.replace('/pos');
      else if (user.role === 'WAREHOUSE_STAFF') router.replace('/transfers');
      else if (user.role === 'AUDITOR') router.replace('/audit');
      else router.replace('/pos'); // Fallback
      return;
    }

    // Permitted roles stay on the main dashboard
    setLoading(true);
    const params = new URLSearchParams();
    params.set('range', range);
    if (store?.id) params.set('storeId', store.id);

    fetch(`/api/reports?${params.toString()}`)
      .then((res) => res.json())
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [range, store?.id, user, router]);

  // Don't render dashboard if they lack permission (avoids flash of content)
  if (user && !hasPermission(user.role, 'dashboard')) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100 ">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-600"></div>
      </div>
    );
  }

  const summary = data?.summary || {
    totalRevenue: 0,
    grossProfit: 0,
    transactionsCount: 0,
    profitMargin: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    inventoryValuationRetail: 0,
    pendingPOs: 0,
  };

  const salesTrend = data?.salesTrend || [];
  const topProducts = data?.topProducts || [];
  const paymentMethods = data?.paymentMethods || [];

  const COLORS = ['#0284c7', '#10b981', '#6366f1', '#f59e0b', '#ec4899'];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 ">
            {['STORE_OWNER', 'SUPER_ADMIN'].includes(user?.role || '') ? 'Executive Dashboard' : 'Store Operations Dashboard'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time retail performance, inventory valuation, and POS throughput for{' '}
            <span className="font-semibold text-slate-700 ">
              {store?.name || 'All Stores'}
            </span>
          </p>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex items-center bg-white  p-1 rounded-xl border border-slate-200  text-xs font-semibold shadow-xs">
          {(['today', 'yesterday', 'week', 'month', 'all'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                range === r
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600  hover:text-slate-900'
              }`}
            >
              {r === 'week' ? 'This Week' : r === 'month' ? 'This Month' : r}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Action Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          href="/pos"
          className="p-3.5 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-700 text-white shadow-md shadow-sky-600/20 hover:scale-[1.02] transition-transform flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-semibold text-sky-200">Open Register</p>
            <h3 className="text-sm font-bold mt-0.5">Start POS Checkout</h3>
          </div>
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </Link>

        <Link
          href="/purchasing"
          className="p-3.5 rounded-2xl bg-white  border border-slate-200  hover:border-sky-500 shadow-xs hover:scale-[1.02] transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Stock Inflow</p>
            <h3 className="text-sm font-bold text-slate-800  mt-0.5">Receive Goods</h3>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-100  flex items-center justify-center text-slate-600 ">
            <Truck className="w-4 h-4" />
          </div>
        </Link>

        <Link
          href="/inventory"
          className="p-3.5 rounded-2xl bg-white  border border-slate-200  hover:border-sky-500 shadow-xs hover:scale-[1.02] transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Stock Count</p>
            <h3 className="text-sm font-bold text-slate-800  mt-0.5">Stock Adjustment</h3>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-100  flex items-center justify-center text-slate-600 ">
            <Boxes className="w-4 h-4" />
          </div>
        </Link>

        <Link
          href="/reports"
          className="p-3.5 rounded-2xl bg-white  border border-slate-200  hover:border-sky-500 shadow-xs hover:scale-[1.02] transition-all flex items-center justify-between group"
        >
          <div>
            <p className="text-[11px] font-semibold text-slate-400">Financials</p>
            <h3 className="text-sm font-bold text-slate-800  mt-0.5">Analytics & Export</h3>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-100  flex items-center justify-center text-slate-600 ">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* KPI 8-Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Sales Revenue</span>
            <div className="p-1.5 rounded-lg bg-emerald-50  text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900  mt-2">
            {formatCurrency(summary.totalRevenue)}
          </p>
          <div className="flex items-center space-x-1 text-[11px] text-emerald-600 font-semibold mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Gross sales {range}</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Gross Profit</span>
            <div className="p-1.5 rounded-lg bg-sky-50  text-sky-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900  mt-2">
            {formatCurrency(summary.grossProfit)}
          </p>
          <p className="text-[11px] text-slate-400 font-semibold mt-1">
            {summary.profitMargin}% Margin
          </p>
        </div>

        {/* Transactions */}
        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Receipts</span>
            <div className="p-1.5 rounded-lg bg-indigo-50  text-indigo-600">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900  mt-2">
            {summary.transactionsCount}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Avg ticket: {formatCurrency(summary.averageOrderValue || 0)}
          </p>
        </div>

        {/* Inventory Valuation */}
        <div className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Inventory Valuation</span>
            <div className="p-1.5 rounded-lg bg-amber-50  text-amber-600">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900  mt-2">
            {formatCurrency(summary.inventoryValuationRetail)}
          </p>
          <p className="text-[11px] text-slate-400 font-medium mt-1">
            Cost: {formatCurrency(summary.inventoryValuationCost || 0)}
          </p>
        </div>

        {/* Low Stock Alert Card */}
        <Link
          href="/inventory?filter=low"
          className="p-4 rounded-2xl bg-white  border border-amber-200  shadow-xs hover:border-amber-500 transition-colors"
        >
          <div className="flex items-center justify-between text-amber-700  text-xs font-semibold">
            <span>Low Stock Items</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-amber-600  mt-2">
            {summary.lowStockCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Below reorder point</p>
        </Link>

        {/* Out of Stock Card */}
        <Link
          href="/inventory?filter=out"
          className="p-4 rounded-2xl bg-white  border border-rose-200  shadow-xs hover:border-rose-500 transition-colors"
        >
          <div className="flex items-center justify-between text-rose-700  text-xs font-semibold">
            <span>Out of Stock</span>
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black text-rose-600  mt-2">
            {summary.outOfStockCount}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Zero physical inventory</p>
        </Link>

        {/* Registered Customers */}
        <Link
          href="/customers"
          className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs hover:border-sky-500 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Loyalty Members</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-2xl font-black text-slate-900  mt-2">50+</p>
          <p className="text-[11px] text-slate-400 mt-1">Active customer accounts</p>
        </Link>

        {/* Pending POs */}
        <Link
          href="/purchasing"
          className="p-4 rounded-2xl bg-white  border border-slate-200  shadow-xs hover:border-sky-500 transition-colors"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Orders</span>
            <Truck className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-slate-900  mt-2">
            {summary.pendingPOs}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Expected supplier shipments</p>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales & Profit Trend (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white  border border-slate-200  shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 ">
                Revenue & Gross Profit Trend
              </h3>
              <p className="text-xs text-slate-400">Daily financial throughput</p>
            </div>
            <div className="flex items-center space-x-4 text-xs font-semibold">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-sky-500" />
                <span className="text-slate-600 ">Revenue</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600 ">Gross Profit</span>
              </div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesTrend}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#0284c7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorSales)"
                />
                <Area
                  type="monotone"
                  dataKey="profit"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorProfit)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-5 rounded-2xl bg-white  border border-slate-200  shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 ">
              Payment Methods
            </h3>
            <p className="text-xs text-slate-400">Checkout tender distribution</p>
          </div>

          <div className="h-52 flex items-center justify-center">
            {paymentMethods.length === 0 ? (
              <p className="text-xs text-slate-400">No payment data for period.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentMethods.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="flex flex-wrap gap-2 justify-center text-[11px] font-semibold">
            {paymentMethods.map((p: any, idx: number) => (
              <div key={p.name} className="flex items-center space-x-1">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                />
                <span className="text-slate-600 ">
                  {p.name.replace(/_/g, ' ')} (${p.value})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top 10 Selling Products Table */}
      <div className="p-5 rounded-2xl bg-white  border border-slate-200  shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 ">
              Top Velocity Products
            </h3>
            <p className="text-xs text-slate-400">Best performing supermarket inventory</p>
          </div>
          <Link
            href="/products"
            className="text-xs font-semibold text-sky-600  hover:underline"
          >
            View Complete Catalog →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100  text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                <th className="pb-2">Product Name</th>
                <th className="pb-2 text-right">Units Sold</th>
                <th className="pb-2 text-right">Total Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100  font-medium">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">
                    No transactions recorded for this filter range.
                  </td>
                </tr>
              ) : (
                topProducts.map((p: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50 ">
                    <td className="py-2.5 text-slate-800  font-semibold">
                      {p.name}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-600 ">
                      {p.quantity} units
                    </td>
                    <td className="py-2.5 text-right font-bold text-sky-600 ">
                      {formatCurrency(p.revenue)}
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

