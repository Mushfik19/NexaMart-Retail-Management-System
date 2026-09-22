'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, CheckCircle2, Heart } from 'lucide-react';
import { CartItem } from '@/lib/types';

export default function CustomerDisplayPage() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [subtotal, setSubtotal] = useState<number>(0);
  const [customer, setCustomer] = useState<any>(null);
  const [completedSale, setCompletedSale] = useState<any>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const bc = new BroadcastChannel('nexamart_pos_display');
    bc.onmessage = (event) => {
      const data = event.data;
      if (data.type === 'CART_UPDATE') {
        setItems(data.items || []);
        setSubtotal(data.subtotal || 0);
        setCustomer(data.customer || null);
        setCompletedSale(null);
      } else if (data.type === 'CLEAR_CART') {
        setItems([]);
        setSubtotal(0);
        setCustomer(null);
        setCompletedSale(null);
      } else if (data.type === 'SALE_COMPLETED') {
        setCompletedSale(data);
        setItems([]);
      }
    };

    // Check localStorage fallback
    const checkStorage = () => {
      const saved = localStorage.getItem('nexamart_display_state');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.type === 'CART_UPDATE') {
            setItems(parsed.items || []);
            setSubtotal(parsed.subtotal || 0);
            setCustomer(parsed.customer || null);
          }
        } catch (e) {}
      }
    };

    window.addEventListener('storage', checkStorage);
    checkStorage();

    return () => {
      bc.close();
      window.removeEventListener('storage', checkStorage);
    };
  }, []);

  const totalDiscount = items.reduce((s, i) => s + (i.discount || 0), 0);
  const tax = subtotal * 0.1; // GST

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between font-sans select-none">
      {/* Top Banner */}
      <header className="p-6 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-black text-2xl shadow-lg shadow-sky-500/20">
            S
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight">NexaMart Superstore</h1>
            <p className="text-xs text-sky-400 font-medium">Customer Checkout Monitor</p>
          </div>
        </div>

        {customer ? (
          <div className="bg-emerald-950/60 border border-emerald-800 px-4 py-2 rounded-2xl flex items-center space-x-3">
            <Heart className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            <div>
              <p className="text-xs font-bold text-emerald-200">Welcome, {customer.name}!</p>
              <p className="text-[11px] text-emerald-400">
                {customer.loyaltyTier} Member • {customer.pointsBalance} Points
              </p>
            </div>
          </div>
        ) : (
          <div className="text-slate-400 text-xs font-medium">
            Welcome to NexaMart
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-8 grid grid-cols-12 gap-8 items-center max-w-7xl mx-auto w-full">
        {completedSale ? (
          /* Thank you and Change Screen */
          <div className="col-span-12 text-center py-16 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30">
              <CheckCircle2 className="w-14 h-14" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-white">Thank You for Shopping With Us!</h2>
              <p className="text-slate-400 text-base mt-2">
                Transaction #{completedSale.receiptNumber} completed.
              </p>
            </div>

            {completedSale.changeGiven > 0 && (
              <div className="inline-block bg-slate-900 border border-slate-800 rounded-3xl p-6 px-12 mt-4 shadow-xl">
                <p className="text-xs uppercase font-bold tracking-widest text-slate-400">
                  Your Change Due
                </p>
                <p className="text-5xl font-black text-emerald-400 mt-2">
                  ${completedSale.changeGiven.toFixed(2)}
                </p>
              </div>
            )}
          </div>
        ) : items.length === 0 ? (
          /* Welcome Idle State */
          <div className="col-span-12 text-center py-20 space-y-4">
            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center text-slate-600 mx-auto">
              <ShoppingBag className="w-10 h-10 stroke-1" />
            </div>
            <h2 className="text-3xl font-bold text-slate-300">Ready to Scan Items</h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Scan your loyalty barcode or place your groceries on the checkout belt.
            </p>
          </div>
        ) : (
          /* Live Cart Screen */
          <>
            {/* Scanned Items list (7 cols) */}
            <div className="col-span-7 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 h-[460px] overflow-y-auto space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
                Scanned Items ({items.length})
              </h3>
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center justify-between"
                >
                  <div>
                    <h4 className="text-base font-bold text-white">{item.name}</h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {item.quantity} x ${item.unitPrice.toFixed(2)}
                      {item.discount > 0 && ` (-$${item.discount.toFixed(2)})`}
                    </p>
                  </div>
                  <span className="text-xl font-black text-sky-400">
                    ${item.subtotal.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Live Totals Display (5 cols) */}
            <div className="col-span-5 bg-gradient-to-br from-slate-900 to-slate-900/80 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between h-[460px] shadow-2xl">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span className="text-white font-semibold">${subtotal.toFixed(2)}</span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Total Savings:</span>
                      <span>-${totalDiscount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-500 text-xs">
                    <span>Includes GST (10%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Big Grand Total Box */}
              <div className="pt-6 border-t border-slate-800">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Total To Pay
                </span>
                <p className="text-6xl font-black text-white mt-1">
                  ${subtotal.toFixed(2)}
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      {/* Footer message */}
      <footer className="p-4 text-center text-xs text-slate-500 border-t border-slate-900">
        NexaMart Enterprise POS • Live Customer Display Stream
      </footer>
    </div>
  );
}
