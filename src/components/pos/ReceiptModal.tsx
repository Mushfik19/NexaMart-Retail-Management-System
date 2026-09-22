'use client';

import React, { useState } from 'react';
import { Printer, Download, X, Check, Mail, Smartphone } from 'lucide-react';
import { SaleReceipt } from '@/lib/types';
import { useApp } from '@/context/AppContext';

interface Props {
  receipt: SaleReceipt;
  onClose: () => void;
}

export default function ReceiptModal({ receipt, onClose }: Props) {
  const { formatCurrency, store } = useApp();
  const [layout, setLayout] = useState<'80mm' | '58mm' | 'A4'>('80mm');
  const [copied, setCopied] = useState(false);
  const [sentNotice, setSentNotice] = useState<string | null>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = `
----------------------------------------
${store?.name || 'NexaMart Flagship Superstore'}
${store?.address || '250 Elizabeth Street, Melbourne VIC'}
Phone: ${store?.phone || '+61 3 9876 5432'}
Tax ID: ${store?.taxNumber || 'ABN 88 123 456 789'}
----------------------------------------
Receipt: ${receipt.receiptNumber}
Date: ${new Date(receipt.createdAt).toLocaleString()}
Cashier: ${receipt.user?.fullName || 'Cashier'}
Register: ${receipt.register?.code || 'REG-01'}
----------------------------------------
${receipt.items
  .map(
    (i) =>
      `${i.productName.padEnd(20).slice(0, 20)} ${i.quantity} x $${i.unitPrice.toFixed(2)}\n                   $${i.total.toFixed(2)}`
  )
  .join('\n')}
----------------------------------------
Subtotal:          $${receipt.subtotal.toFixed(2)}
Discount:         -$${(receipt.itemDiscount + receipt.orderDiscount).toFixed(2)}
Tax (GST 10%):     $${receipt.taxAmount.toFixed(2)}
----------------------------------------
TOTAL:             $${receipt.grandTotal.toFixed(2)}
Paid:              $${receipt.amountPaid.toFixed(2)}
Change:            $${receipt.changeGiven.toFixed(2)}
Payment:           ${receipt.payments.map((p) => p.method).join(', ')}
----------------------------------------
Thank You For Shopping With Us!
Returns within 14 days with original receipt.
----------------------------------------
    `;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailSimulation = () => {
    setSentNotice(`[SIMULATION] Digital receipt sent to customer's email!`);
    setTimeout(() => setSentNotice(null), 3000);
  };

  const handleSmsSimulation = () => {
    setSentNotice(`[SIMULATION] SMS e-receipt link sent to mobile!`);
    setTimeout(() => setSentNotice(null), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 select-none">
      <div className="bg-white  border border-slate-200  rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Top Controls */}
        <div className="px-5 py-3 border-b border-slate-200  bg-slate-50  flex items-center justify-between shrink-0">
          {/* Format selector */}
          <div className="flex items-center space-x-1 bg-slate-200  p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setLayout('80mm')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                layout === '80mm'
                  ? 'bg-white  text-sky-600 shadow-xs'
                  : 'text-slate-600 '
              }`}
            >
              80mm Thermal
            </button>
            <button
              onClick={() => setLayout('58mm')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                layout === '58mm'
                  ? 'bg-white  text-sky-600 shadow-xs'
                  : 'text-slate-600 '
              }`}
            >
              58mm Mini
            </button>
            <button
              onClick={() => setLayout('A4')}
              className={`px-2.5 py-1 rounded-md transition-all ${
                layout === 'A4'
                  ? 'bg-white  text-sky-600 shadow-xs'
                  : 'text-slate-600 '
              }`}
            >
              A4 Invoice
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600  hover:bg-slate-200 "
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {sentNotice && (
          <div className="bg-emerald-500 text-white text-xs font-semibold px-4 py-1.5 text-center transition-all">
            {sentNotice}
          </div>
        )}

        {/* Receipt Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-100  flex justify-center">
          <div
            id="printable-receipt"
            className={`bg-white text-slate-900 p-6 shadow-md border border-slate-200 transition-all font-mono text-xs ${
              layout === '58mm'
                ? 'w-[280px] text-[10px]'
                : layout === 'A4'
                ? 'w-full max-w-md text-xs font-sans p-8'
                : 'w-[360px] text-xs'
            }`}
          >
            {/* Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h1 className="text-sm font-black uppercase tracking-tight">
                {store?.name || 'NexaMart Flagship Superstore'}
              </h1>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {store?.address || '250 Elizabeth Street, Melbourne VIC'}
              </p>
              <p className="text-[11px] text-slate-600">Phone: {store?.phone || '+61 3 9876 5432'}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {store?.taxNumber || 'ABN: 88 123 456 789'}
              </p>
            </div>

            {/* Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Receipt:</span>
                <span className="font-bold">{receipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date(receipt.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Cashier:</span>
                <span>{receipt.user?.fullName || 'Cashier'}</span>
              </div>
              <div className="flex justify-between">
                <span>Register:</span>
                <span>{receipt.register?.code || 'REG-01'}</span>
              </div>
              {receipt.customer && (
                <div className="flex justify-between font-semibold text-sky-700">
                  <span>Customer:</span>
                  <span>{receipt.customer.name}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
              {receipt.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start">
                  <div className="pr-2">
                    <p className="font-semibold line-clamp-1">{item.productName}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.quantity} x ${item.unitPrice.toFixed(2)}
                      {item.discount > 0 && ` (-$${item.discount.toFixed(2)})`}
                    </p>
                  </div>
                  <span className="font-bold">${item.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${receipt.subtotal.toFixed(2)}</span>
              </div>
              {receipt.itemDiscount + receipt.orderDiscount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount:</span>
                  <span>-${(receipt.itemDiscount + receipt.orderDiscount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST (10%):</span>
                <span>${receipt.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black pt-1 border-t border-slate-300">
                <span>TOTAL:</span>
                <span>${receipt.grandTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Payments */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-bold">${receipt.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Change Returned:</span>
                <span className="font-bold">${receipt.changeGiven.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span>{receipt.payments.map((p) => p.method).join(', ')}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-3 space-y-1 text-[10px] text-slate-500">
              <p className="font-semibold text-slate-700">Thank You For Shopping With Us!</p>
              <p>Please retain your receipt for refunds or exchanges within 14 days.</p>
              <p className="text-[9px] pt-1">www.nexamart.com.au</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-white  border-t border-slate-200  flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleEmailSimulation}
              title="Email Receipt (DEMO)"
              className="p-2 rounded-xl border border-slate-200  text-slate-600  hover:bg-slate-100 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </button>
            <button
              onClick={handleSmsSimulation}
              title="SMS Receipt (DEMO)"
              className="p-2 rounded-xl border border-slate-200  text-slate-600  hover:bg-slate-100 transition-colors"
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyText}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200  text-slate-700  hover:bg-slate-100 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy Text'}
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              New Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
