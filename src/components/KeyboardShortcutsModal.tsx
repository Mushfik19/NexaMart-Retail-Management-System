'use client';

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface Props {
  onClose: () => void;
}

export default function KeyboardShortcutsModal({ onClose }: Props) {
  const shortcuts = [
    { key: 'F1', description: 'Focus Product Search / Barcode Input' },
    { key: 'F2', description: 'Open Customer Lookup & Loyalty Modal' },
    { key: 'F3', description: 'Apply Order Discount or Coupon Code' },
    { key: 'F4', description: 'Hold Current Sale / Park Cart' },
    { key: 'F5', description: 'Open Payment Modal / Instant Tender' },
    { key: 'F6', description: 'Reprint / View Last Receipt' },
    { key: 'Esc', description: 'Close Modal / Clear Cart' },
    { key: 'Delete', description: 'Remove Selected Cart Item' },
    { key: 'Any Barcode', description: 'USB Laser Scanners automatically scan into cart without focusing input' },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white  border border-slate-200  rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200  flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-sky-50  text-sky-600">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 ">Cashier Keyboard Shortcuts</h2>
              <p className="text-[11px] text-slate-500">High-speed supermarket register keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600  p-1.5 rounded-lg hover:bg-slate-100 "
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-2.5 max-h-96 overflow-y-auto">
          {shortcuts.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100  bg-slate-50/50 "
            >
              <span className="text-xs text-slate-700  font-medium">{s.description}</span>
              <kbd className="px-2.5 py-1 text-xs font-mono font-bold bg-white  border border-slate-300  rounded-md shadow-xs text-slate-800  shrink-0 ml-3">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50  border-t border-slate-200  flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}
