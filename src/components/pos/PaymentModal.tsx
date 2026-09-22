'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Banknote,
  CreditCard,
  Smartphone,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { SaleReceipt } from '@/lib/types';

interface Props {
  initialCashPreset?: number | null;
  onClose: () => void;
  onSuccess: (receipt: SaleReceipt) => void;
}

export default function PaymentModal({
  initialCashPreset,
  onClose,
  onSuccess,
}: Props) {
  const {
    cart,
    customer,
    orderDiscount,
    couponCode,
    redeemedPoints,
    store,
    activeShift,
    clearCart,
    formatCurrency,
    broadcastToCustomerDisplay,
    refreshAppData,
  } = useApp();

  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const loyaltyDiscount = redeemedPoints > 0 ? redeemedPoints / 100 : 0;
  const totalDiscount = orderDiscount + loyaltyDiscount;

  const taxRate = store?.taxRateDefault || 10.0;
  const taxAmount = store?.taxInclusive
    ? Math.max(0, subtotal - subtotal / (1 + taxRate / 100))
    : Math.max(0, (subtotal * taxRate) / 100);

  const grandTotal = Math.max(
    0,
    store?.taxInclusive ? subtotal - totalDiscount : subtotal - totalDiscount + taxAmount
  );

  const [activeTab, setActiveTab] = useState<'CASH' | 'CARD' | 'MOBILE' | 'SPLIT'>('CASH');
  const [cashTendered, setCashTendered] = useState<string>(
    initialCashPreset ? String(initialCashPreset) : String(grandTotal)
  );

  // Split payment state
  const [splitCash, setSplitCash] = useState<string>('');
  const [splitCard, setSplitCard] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calculate change for cash
  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - grandTotal);
  const isCashSufficient = tenderedNum >= grandTotal - 0.001;

  // Calculate split remaining
  const splitCashNum = parseFloat(splitCash) || 0;
  const splitCardNum = parseFloat(splitCard) || 0;
  const splitTotalPaid = splitCashNum + splitCardNum;
  const splitRemaining = Math.max(0, grandTotal - splitTotalPaid);
  const isSplitSufficient = splitTotalPaid >= grandTotal - 0.001;

  // Quick preset chips for cash
  const presets = [
    Math.ceil(grandTotal),
    Math.ceil(grandTotal / 5) * 5 || 5,
    Math.ceil(grandTotal / 10) * 10 || 10,
    Math.ceil(grandTotal / 20) * 20 || 20,
    Math.ceil(grandTotal / 50) * 50 || 50,
    100,
  ].filter((val, idx, arr) => val >= grandTotal && arr.indexOf(val) === idx);

  const handleCheckout = async (method: string) => {
    setErrorMsg(null);
    setLoading(true);

    try {
      let paymentsPayload: any[] = [];

      if (method === 'CASH') {
        if (!isCashSufficient) {
          setErrorMsg(`Amount given ($${tenderedNum.toFixed(2)}) is less than total due ($${grandTotal.toFixed(2)})`);
          setLoading(false);
          return;
        }
        paymentsPayload = [
          {
            method: 'CASH',
            amount: grandTotal,
            tendered: tenderedNum,
            change: changeDue,
          },
        ];
      } else if (method === 'CARD' || method === 'DEBIT_CARD') {
        paymentsPayload = [
          {
            method: 'CREDIT_CARD',
            amount: grandTotal,
            tendered: grandTotal,
            change: 0,
            transactionRef: `AUTH-${Math.floor(100000 + Math.random() * 900000)}`,
          },
        ];
      } else if (method === 'MOBILE') {
        paymentsPayload = [
          {
            method: 'MOBILE_PAYMENT',
            amount: grandTotal,
            tendered: grandTotal,
            change: 0,
            transactionRef: `MBL-${Math.floor(100000 + Math.random() * 900000)}`,
          },
        ];
      } else if (method === 'SPLIT') {
        if (!isSplitSufficient) {
          setErrorMsg(`Total paid ($${splitTotalPaid.toFixed(2)}) does not cover order total ($${grandTotal.toFixed(2)})`);
          setLoading(false);
          return;
        }
        if (splitCashNum > 0) {
          paymentsPayload.push({
            method: 'CASH',
            amount: splitCashNum,
            tendered: splitCashNum,
            change: 0,
          });
        }
        if (splitCardNum > 0) {
          paymentsPayload.push({
            method: 'CREDIT_CARD',
            amount: splitCardNum,
            tendered: splitCardNum,
            change: 0,
            transactionRef: `SPLIT-${Math.floor(100000 + Math.random() * 900000)}`,
          });
        }
      }

      const payload = {
        storeId: store?.id,
        registerId: activeShift?.registerId,
        shiftId: activeShift?.id,
        customerId: customer?.id || null,
        items: cart.map((i) => ({
          productId: i.productId,
          name: i.name,
          sku: i.sku,
          barcode: i.barcode,
          unitPrice: i.unitPrice,
          costPrice: i.costPrice,
          quantity: i.quantity,
          discount: i.discount,
          taxRate: i.taxRate,
        })),
        payments: paymentsPayload,
        orderDiscount,
        couponCode: couponCode || null,
        redeemedPoints,
      };

      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      // Sync customer display
      broadcastToCustomerDisplay({
        type: 'SALE_COMPLETED',
        receiptNumber: data.sale.receiptNumber,
        grandTotal: data.sale.grandTotal,
        amountPaid: data.sale.amountPaid,
        changeGiven: data.sale.changeGiven,
      });

      await refreshAppData();
      clearCart();
      onSuccess(data.sale);
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMsg(err.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white  border border-slate-200  rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200  flex items-center justify-between bg-slate-50/50 ">
          <div>
            <h2 className="text-base font-bold text-slate-900 ">
              Payment Tender
            </h2>
            <p className="text-xs text-slate-500">Select customer payment method</p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600  p-2 rounded-xl hover:bg-slate-100  transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Total Banner */}
        <div className="px-6 py-4 bg-gradient-to-r from-sky-600 to-indigo-700 text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-200">
              Grand Total
            </p>
            <p className="text-3xl font-black">{formatCurrency(grandTotal)}</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-sky-100 bg-white/10 px-2.5 py-1 rounded-full font-medium">
              {cart.reduce((a, b) => a + b.quantity, 0)} items
            </span>
          </div>
        </div>

        {/* Payment Method Tabs */}
        <div className="grid grid-cols-4 p-3 gap-2 bg-slate-100/70  border-b border-slate-200 ">
          <button
            onClick={() => setActiveTab('CASH')}
            className={`py-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all ${
              activeTab === 'CASH'
                ? 'bg-white  text-emerald-600  shadow-sm border border-slate-200 '
                : 'text-slate-600  hover:bg-white/50'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>Cash</span>
          </button>

          <button
            onClick={() => setActiveTab('CARD')}
            className={`py-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all ${
              activeTab === 'CARD'
                ? 'bg-white  text-sky-600  shadow-sm border border-slate-200 '
                : 'text-slate-600  hover:bg-white/50'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Card / EFTPOS</span>
          </button>

          <button
            onClick={() => setActiveTab('MOBILE')}
            className={`py-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all ${
              activeTab === 'MOBILE'
                ? 'bg-white  text-indigo-600  shadow-sm border border-slate-200 '
                : 'text-slate-600  hover:bg-white/50'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Apple / Google</span>
          </button>

          <button
            onClick={() => setActiveTab('SPLIT')}
            className={`py-2.5 rounded-xl font-bold text-xs flex flex-col items-center justify-center space-y-1 transition-all ${
              activeTab === 'SPLIT'
                ? 'bg-white  text-amber-600  shadow-sm border border-slate-200 '
                : 'text-slate-600  hover:bg-white/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Split Tender</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50  border border-rose-200  flex items-center space-x-2 text-rose-700  text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* CASH TAB */}
          {activeTab === 'CASH' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700  mb-1">
                  Cash Amount Handed by Customer ($)
                </label>
                <input
                  type="number"
                  step="0.05"
                  autoFocus
                  value={cashTendered}
                  onChange={(e) => setCashTendered(e.target.value)}
                  className="w-full text-2xl font-black px-4 py-3 rounded-xl border border-slate-300  bg-slate-50  text-slate-900  focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap gap-2">
                {presets.map((val) => (
                  <button
                    key={val}
                    onClick={() => setCashTendered(String(val))}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      tenderedNum === val
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'border-slate-200  bg-slate-50  text-slate-700  hover:border-sky-400'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>

              {/* Big Change Display */}
              <div
                className={`p-4 rounded-2xl border flex items-center justify-between transition-colors ${
                  isCashSufficient
                    ? 'bg-emerald-50  border-emerald-300  text-emerald-900 '
                    : 'bg-amber-50  border-amber-300  text-amber-900 '
                }`}
              >
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">
                    {isCashSufficient ? 'Change Due Customer' : 'Short / Remaining'}
                  </p>
                  <p className="text-3xl font-black mt-0.5">
                    {formatCurrency(isCashSufficient ? changeDue : grandTotal - tenderedNum)}
                  </p>
                </div>
                {isCashSufficient ? (
                  <CheckCircle2 className="w-8 h-8 text-emerald-600 " />
                ) : (
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                )}
              </div>
            </div>
          )}

          {/* CARD TAB */}
          {activeTab === 'CARD' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-sky-50  text-sky-600 flex items-center justify-center mx-auto">
                <CreditCard className="w-8 h-8 stroke-1" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 ">
                  Ready for EFTPOS / Card Terminal
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Ask customer to tap, insert, or swipe debit/credit card for{' '}
                  <span className="font-bold text-slate-800 ">
                    {formatCurrency(grandTotal)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* MOBILE PAYMENT TAB */}
          {activeTab === 'MOBILE' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-indigo-50  text-indigo-600 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 stroke-1" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 ">
                  NFC / Contactless Digital Wallet
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Customer taps Apple Pay, Google Pay, or QR code for{' '}
                  <span className="font-bold text-slate-800 ">
                    {formatCurrency(grandTotal)}
                  </span>
                </p>
              </div>
            </div>
          )}

          {/* SPLIT PAYMENT TAB */}
          {activeTab === 'SPLIT' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Divide the total between Cash and Card:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700  mb-1">
                    Cash Portion ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={splitCash}
                    onChange={(e) => setSplitCash(e.target.value)}
                    className="w-full text-base font-bold px-3 py-2 rounded-xl border border-slate-300  bg-slate-50  text-slate-900  focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700  mb-1">
                    Card Portion ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={splitCard}
                    onChange={(e) => setSplitCard(e.target.value)}
                    className="w-full text-base font-bold px-3 py-2 rounded-xl border border-slate-300  bg-slate-50  text-slate-900  focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Split remaining indicator */}
              <div className="p-3 rounded-xl border border-slate-200  bg-slate-50  flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Remaining to Allocate:</span>
                <span
                  className={`font-mono font-bold text-sm ${
                    splitRemaining === 0
                      ? 'text-emerald-600 '
                      : 'text-rose-600 '
                  }`}
                >
                  {formatCurrency(splitRemaining)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50  border-t border-slate-200  flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300  text-xs font-semibold text-slate-700  hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={() => handleCheckout(activeTab)}
            disabled={
              loading ||
              (activeTab === 'CASH' && !isCashSufficient) ||
              (activeTab === 'SPLIT' && !isSplitSufficient)
            }
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-2 shadow-lg shadow-emerald-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span>Authorizing & Recording...</span>
            ) : (
              <>
                <span>COMPLETE TRANSACTION</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
