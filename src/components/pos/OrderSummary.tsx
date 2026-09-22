'use client';

import React from 'react';
import { User, Tag, PauseCircle, PlayCircle, CreditCard } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface Props {
  onOpenPayment: () => void;
  onOpenCustomer: () => void;
  onOpenHeld: () => void;
  onQuickCash: (amount: number) => void;
}

export default function OrderSummary({
  onOpenPayment,
  onOpenCustomer,
  onOpenHeld,
  onQuickCash,
}: Props) {
  const {
    cart,
    customer,
    orderDiscount,
    couponCode,
    redeemedPoints,
    heldCarts,
    store,
    formatCurrency,
    holdCurrentCart,
  } = useApp();

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const totalItemDiscounts = cart.reduce((sum, item) => sum + item.discount, 0);
  const loyaltyDiscount = redeemedPoints > 0 ? redeemedPoints / 100 : 0;
  const totalOrderDiscount = orderDiscount + loyaltyDiscount;

  const taxRate = store?.taxRateDefault || 10.0;
  // Australian tax inclusive calculation: Tax = Total - (Total / 1.10)
  const taxAmount = store?.taxInclusive
    ? Math.max(0, subtotal - subtotal / (1 + taxRate / 100))
    : Math.max(0, (subtotal * taxRate) / 100);

  const grandTotal = Math.max(
    0,
    store?.taxInclusive
      ? subtotal - totalOrderDiscount
      : subtotal - totalOrderDiscount + taxAmount
  );

  const isCartEmpty = cart.length === 0;

  // Next round numbers for quick cash buttons
  const exact = Math.ceil(grandTotal * 100) / 100;
  const cash10 = Math.ceil(grandTotal / 10) * 10 || 10;
  const cash20 = Math.ceil(grandTotal / 20) * 20 || 20;
  const cash50 = Math.ceil(grandTotal / 50) * 50 || 50;

  return (
    <div className="flex flex-col h-full bg-slate-50  select-none">
      {/* Customer Header Badge */}
      <div className="p-3 border-b border-slate-200  bg-white ">
        <button
          onClick={onOpenCustomer}
          className="w-full flex items-center justify-between p-2 rounded-xl border border-slate-200  bg-slate-50  hover:border-sky-500 transition-colors text-left"
        >
          <div className="flex items-center space-x-2.5 truncate">
            <div className="w-7 h-7 rounded-full bg-sky-100  text-sky-600 flex items-center justify-center shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-800  truncate">
                {customer ? customer.name : 'Guest Customer'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {customer
                  ? `${customer.loyaltyTier} • ${customer.pointsBalance} pts`
                  : 'Tap to assign membership (F2)'}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-sky-600  px-2 py-0.5 rounded-full bg-sky-50  border border-sky-200  shrink-0">
            {customer ? 'Change' : 'Add'}
          </span>
        </button>
      </div>

      {/* Held Carts / Parking Quick Bar */}
      <div className="px-3 py-2 border-b border-slate-200  bg-slate-100/60  flex items-center justify-between">
        <button
          onClick={() => holdCurrentCart()}
          disabled={isCartEmpty}
          className={`flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
            isCartEmpty
              ? 'opacity-40 cursor-not-allowed text-slate-400'
              : 'text-amber-700  hover:bg-amber-50 '
          }`}
        >
          <PauseCircle className="w-3.5 h-3.5" />
          <span>Hold Sale (F4)</span>
        </button>

        {heldCarts.length > 0 && (
          <button
            onClick={onOpenHeld}
            className="flex items-center space-x-1 text-xs font-bold text-sky-600 bg-sky-50  px-2 py-0.5 rounded-md border border-sky-200  animate-pulse"
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Recall ({heldCarts.length})</span>
          </button>
        )}
      </div>

      {/* Middle Cost Breakdown */}
      <div className="p-4 flex-1 overflow-y-auto space-y-2 text-xs">
        <div className="flex justify-between text-slate-600 ">
          <span>Subtotal</span>
          <span className="font-semibold text-slate-800 ">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {totalItemDiscounts > 0 && (
          <div className="flex justify-between text-emerald-600  font-medium">
            <span>Line Discounts</span>
            <span>-{formatCurrency(totalItemDiscounts)}</span>
          </div>
        )}

        {totalOrderDiscount > 0 && (
          <div className="flex justify-between text-emerald-600  font-medium">
            <span className="flex items-center space-x-1">
              <Tag className="w-3 h-3" />
              <span>
                Order Promo {couponCode ? `(${couponCode})` : ''}
                {redeemedPoints > 0 ? ` [${redeemedPoints} pts]` : ''}
              </span>
            </span>
            <span>-{formatCurrency(totalOrderDiscount)}</span>
          </div>
        )}

        <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200 ">
          <span>{store?.taxInclusive ? `Includes ${store.taxRateDefault}% GST` : `Tax (${store?.taxRateDefault || 10}%)`}</span>
          <span>{formatCurrency(taxAmount)}</span>
        </div>
      </div>

      {/* Bottom Payment & Grand Total Box */}
      <div className="p-4 bg-white  border-t border-slate-200  space-y-3">
        {/* Big Total */}
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Due
          </span>
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 ">
              {formatCurrency(grandTotal)}
            </span>
          </div>
        </div>

        {/* Quick Cash Presets */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          <button
            onClick={() => onQuickCash(exact)}
            disabled={isCartEmpty}
            className="py-1.5 text-xs font-bold rounded-lg border border-slate-200  bg-slate-50  hover:bg-sky-50  text-slate-700  transition-colors disabled:opacity-40"
          >
            Exact
          </button>
          <button
            onClick={() => onQuickCash(cash10)}
            disabled={isCartEmpty}
            className="py-1.5 text-xs font-bold rounded-lg border border-slate-200  bg-slate-50  hover:bg-sky-50  text-slate-700  transition-colors disabled:opacity-40"
          >
            ${cash10}
          </button>
          <button
            onClick={() => onQuickCash(cash20)}
            disabled={isCartEmpty}
            className="py-1.5 text-xs font-bold rounded-lg border border-slate-200  bg-slate-50  hover:bg-sky-50  text-slate-700  transition-colors disabled:opacity-40"
          >
            ${cash20}
          </button>
          <button
            onClick={() => onQuickCash(cash50)}
            disabled={isCartEmpty}
            className="py-1.5 text-xs font-bold rounded-lg border border-slate-200  bg-slate-50  hover:bg-sky-50  text-slate-700  transition-colors disabled:opacity-40"
          >
            ${cash50}
          </button>
        </div>

        {/* Primary Checkout Button */}
        <button
          onClick={onOpenPayment}
          disabled={isCartEmpty}
          className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center space-x-2 shadow-lg transition-all ${
            isCartEmpty
              ? 'bg-slate-200  text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30 hover:shadow-emerald-600/50 active:scale-[0.99]'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>PAY / CHECKOUT (F5)</span>
        </button>
      </div>
    </div>
  );
}
