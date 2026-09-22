'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Truck,
  ArrowLeftRight,
  Receipt,
  RotateCcw,
  Wallet,
  Users,
  Tag,
  BarChart3,
  ReceiptText,
  ShieldAlert,
  Settings,
  Monitor,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { hasPermission } from '@/lib/auth';

export default function Sidebar() {
  const pathname = usePathname();
  const { user, store } = useApp();

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, module: 'dashboard' },
    { name: 'POS Checkout', href: '/pos', icon: ShoppingCart, module: 'pos', highlight: true },
    { name: 'Products & Barcodes', href: '/products', icon: Package, module: 'products' },
    { name: 'Inventory & Expiry', href: '/inventory', icon: Boxes, module: 'inventory' },
    { name: 'Purchasing & Receiving', href: '/purchasing', icon: Truck, module: 'purchasing' },
    { name: 'Stock Transfers', href: '/transfers', icon: ArrowLeftRight, module: 'inventory' },
    { name: 'Sales & Receipts', href: '/sales', icon: Receipt, module: 'sales' },
    { name: 'Returns & Refunds', href: '/returns', icon: RotateCcw, module: 'returns' },
    { name: 'Cash Register & Shifts', href: '/register', icon: Wallet, module: 'register' },
    { name: 'End of Day', href: '/end-of-day', icon: Wallet, module: 'end-of-day' },
    { name: 'Customers & Loyalty', href: '/customers', icon: Users, module: 'customers' },
    { name: 'Promotions & Coupons', href: '/promotions', icon: Tag, module: 'promotions' },
    { name: 'Reports & Analytics', href: '/reports', icon: BarChart3, module: 'reports' },
    { name: 'Store Expenses', href: '/expenses', icon: ReceiptText, module: 'expenses' },
    { name: 'Audit Logs', href: '/audit', icon: ShieldAlert, module: 'audit' },
    { name: 'Settings', href: '/settings', icon: Settings, module: 'settings' },
  ];

  const userRole = user?.role || 'CASHIER';

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand & Store Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20 text-lg">
            N
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-none text-white">NexaMart</h1>
            <p className="text-[11px] text-sky-400 font-medium tracking-wide mt-1">Enterprise POS</p>
          </div>
        </div>
      </div>

      {/* Current Store Badge */}
      <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between">
        <div className="truncate">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Branch</p>
          <p className="text-xs font-semibold text-slate-200 truncate">{store?.name || 'Flagship Superstore'}</p>
        </div>
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/10 text-sky-400 border border-sky-500/20">
          {store?.code || 'STR-01'}
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const isAllowed = hasPermission(userRole, item.module);
          if (!isAllowed) return null;

          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20 font-semibold'
                  : item.highlight
                  ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.highlight ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.name}</span>
              </div>
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </Link>
          );
        })}

        {/* Customer Display Popout Button */}
        <div className="pt-2 border-t border-slate-800/60 mt-2">
          <a
            href="/pos/customer-display"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Monitor className="w-4 h-4 text-slate-400" />
              <span>Customer Screen</span>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">2nd Win</span>
          </a>
        </div>
      </nav>

      {/* Active User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 truncate">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-sky-400 shrink-0">
            {user?.fullName?.slice(0, 2).toUpperCase() || 'SA'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.fullName || 'Sarah Jenkins'}</p>
            <span className="text-[10px] text-slate-400 font-mono">
              {user?.role?.replace(/_/g, ' ') || 'CASHIER'}
            </span>
          </div>
        </div>
        
        <button 
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' });
            window.location.href = '/login';
          }}
          className="p-1.5 rounded-md hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors shrink-0 ml-2"
          title="Sign out"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
        </button>
      </div>
    </aside>
  );
}
