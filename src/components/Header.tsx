'use client';

import React, { useState } from 'react';
import {
  Store as StoreIcon,
  UserCheck,
  Wifi,
  WifiOff,
  Bell,
  Keyboard,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import KeyboardShortcutsModal from './KeyboardShortcutsModal';

export default function Header() {
  const {
    user,
    store,
    stores,
    activeShift,
    isOnline,
    notifications,
    switchRole,
    switchStore,
  } = useApp();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showStoreMenu, setShowStoreMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const roles = [
    { role: 'SUPER_ADMIN', label: 'Super Admin (Full)' },
    { role: 'STORE_OWNER', label: 'Store Owner' },
    { role: 'STORE_MANAGER', label: 'Store Manager' },
    { role: 'CASHIER', label: 'Cashier (POS Focus)' },
    { role: 'INVENTORY_MANAGER', label: 'Inventory Controller' },
    { role: 'PURCHASING_OFFICER', label: 'Purchasing Officer' },
    { role: 'ACCOUNTANT', label: 'Accountant' },
    { role: 'WAREHOUSE_STAFF', label: 'Warehouse Staff' },
    { role: 'AUDITOR', label: 'Auditor (Read-Only)' },
  ];

  return (
    <header className="h-14 bg-white  border-b border-slate-200  px-4 flex items-center justify-between z-20 shrink-0">
      {/* Left: Store Selector & Shift Status */}
      <div className="flex items-center space-x-3">
        {/* Store Selector */}
        <div className="relative">
          <button
            onClick={() => setShowStoreMenu(!showStoreMenu)}
            className="flex items-center space-x-2 px-2.5 py-1.5 rounded-lg border border-slate-200  bg-slate-50  text-xs font-medium text-slate-800  hover:bg-slate-100 transition-colors"
          >
            <StoreIcon className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-semibold">{store?.name || 'Select Store'}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showStoreMenu && (
            <div className="absolute left-0 mt-1 w-64 bg-white  border border-slate-200  rounded-xl shadow-xl py-1 z-50">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Store Branch
              </div>
              {stores.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    switchStore(s.id);
                    setShowStoreMenu(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-sky-50  ${
                    store?.id === s.id ? 'font-bold text-sky-600 ' : 'text-slate-700 '
                  }`}
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <span className="text-[10px] text-slate-400 font-mono">{s.code}</span>
                  </div>
                  {store?.id === s.id && <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Shift Badge */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-50  text-emerald-700  border border-emerald-200 ">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {activeShift ? `Shift Open (${activeShift.register?.code || 'REG-01'})` : 'Register Ready'}
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Fast Role Switcher Pill */}
        {/* Static Role Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-indigo-200  bg-indigo-50/60  text-indigo-700  text-xs font-semibold">
          <UserCheck className="w-3.5 h-3.5 text-indigo-600 " />
          <span>Role: {user?.role?.replace(/_/g, ' ') || 'CASHIER'}</span>
        </div>

        {/* Shortcuts Guide Button */}
        <button
          onClick={() => setShowShortcuts(true)}
          title="POS Keyboard Shortcuts (F1-F6)"
          className="p-2 rounded-lg border border-slate-200  text-slate-600  hover:bg-slate-100  transition-colors"
        >
          <Keyboard className="w-4 h-4" />
        </button>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-lg border border-slate-200  text-slate-600  hover:bg-slate-100  transition-colors"
          >
            <Bell className="w-4 h-4" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-1 w-72 bg-white  border border-slate-200  rounded-xl shadow-xl p-2 z-50">
              <div className="px-2 py-1 text-xs font-bold text-slate-700  border-b border-slate-100  pb-2">
                Operational Alerts ({notifications.length})
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100  mt-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 p-2 text-center">All inventory and registers optimal.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-2 flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-slate-800 ">{n.title}</p>
                        <p className="text-[11px] text-slate-500 ">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Online / Offline Status */}
        <div
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200   '
              : 'bg-rose-50 text-rose-700 border-rose-200   '
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ONLINE</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">OFFLINE (QUEUE ACTIVE)</span>
            </>
          )}
        </div>
      </div>

      {showShortcuts && <KeyboardShortcutsModal onClose={() => setShowShortcuts(false)} />}
    </header>
  );
}
