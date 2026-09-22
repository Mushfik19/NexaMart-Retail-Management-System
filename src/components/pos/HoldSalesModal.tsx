'use client';

import React from 'react';
import { X, PlayCircle, Clock, ShoppingCart } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Props {
  onClose: () => void;
}

export default function HoldSalesModal({ onClose }: Props) {
  const { heldCarts, recallCart, formatCurrency } = useApp();

  const handleRecall = (id: string) => {
    recallCart(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white  border border-slate-200  rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        <div className="px-6 py-4 border-b border-slate-200  flex items-center justify-between bg-slate-50 ">
          <div>
            <h2 className="text-sm font-bold text-slate-900 ">
              Parked / Held Sales Queue
            </h2>
            <p className="text-xs text-slate-500">Recall suspended customer transactions</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 "
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto max-h-96 space-y-2.5">
          {heldCarts.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No sales currently on hold.
            </div>
          ) : (
            heldCarts.map((h) => {
              const total = h.items.reduce((s: number, i: any) => s + i.subtotal, 0);
              return (
                <div
                  key={h.id}
                  className="p-3.5 rounded-2xl border border-slate-200  bg-slate-50/50  flex items-center justify-between hover:border-sky-500 transition-colors"
                >
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 ">{h.name}</h4>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{h.date}</span>
                      <span>•</span>
                      <span>{h.items.length} items</span>
                      {h.customer && <span>• {h.customer.name}</span>}
                    </div>
                  </div>

                  <div className="text-right flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-900 ">
                      {formatCurrency(total)}
                    </span>
                    <button
                      onClick={() => handleRecall(h.id)}
                      className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center space-x-1 shadow-sm transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Resume</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50  border-t border-slate-200  flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600  rounded-lg hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
