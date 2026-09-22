'use client';

import React, { useState } from 'react';
import { Trash2, Plus, Minus, Tag, ShoppingBag } from 'lucide-react';
import { useApp } from '@/context/AppContext';

export default function CartTable() {
  const { cart, updateCartQty, setCartItemQty, removeFromCart, setCartItemDiscount, clearCart, formatCurrency } = useApp();
  const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
  const [discountVal, setDiscountVal] = useState<string>('');

  const handleApplyDiscount = (productId: string) => {
    const num = parseFloat(discountVal) || 0;
    setCartItemDiscount(productId, num);
    setEditingDiscountId(null);
    setDiscountVal('');
  };

  if (cart.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-full bg-slate-100  flex items-center justify-center text-slate-400 mb-3">
          <ShoppingBag className="w-8 h-8 stroke-1" />
        </div>
        <h3 className="text-sm font-bold text-slate-700 ">Checkout Cart Empty</h3>
        <p className="text-xs text-slate-400 max-w-xs mt-1">
          Scan item barcode using scanner or click products from catalog to add to cart.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white  border-r border-slate-200 ">
      {/* Cart Header bar */}
      <div className="p-3 border-b border-slate-200  flex items-center justify-between bg-slate-50/70 ">
        <div className="flex items-center space-x-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 ">
            Active Cart Items
          </h2>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100  text-sky-700 ">
            {cart.reduce((a, b) => a + b.quantity, 0)} units ({cart.length} lines)
          </span>
        </div>

        <button
          onClick={clearCart}
          className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50  px-2 py-1 rounded transition-colors"
        >
          Clear Cart
        </button>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 ">
        {cart.map((item) => (
          <div
            key={item.productId}
            className="p-3 flex items-center justify-between hover:bg-slate-50/50  transition-colors"
          >
            {/* Left: Info */}
            <div className="flex-1 pr-3 min-w-0">
              <h4 className="text-xs font-semibold text-slate-900  truncate">
                {item.name}
              </h4>
              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono mt-0.5">
                <span>{item.barcode}</span>
                <span>•</span>
                <span>{formatCurrency(item.unitPrice)}</span>
                {item.discount > 0 && (
                  <span className="text-emerald-600  font-sans font-semibold">
                    (-{formatCurrency(item.discount)})
                  </span>
                )}
              </div>

              {/* Inline line discount prompt */}
              {editingDiscountId === item.productId && (
                <div className="mt-2 flex items-center space-x-1.5 animate-in fade-in">
                  <span className="text-[10px] text-slate-500">Discount $:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={discountVal}
                    onChange={(e) => setDiscountVal(e.target.value)}
                    placeholder="0.00"
                    className="w-16 px-1.5 py-0.5 text-xs rounded border border-slate-300  bg-white "
                  />
                  <button
                    onClick={() => handleApplyDiscount(item.productId)}
                    className="px-2 py-0.5 text-[10px] bg-sky-600 text-white rounded font-medium"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingDiscountId(null)}
                    className="text-[10px] text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Middle: Qty Stepper */}
            <div className="flex items-center space-x-1 border border-slate-200  rounded-lg p-0.5 bg-slate-50  shrink-0">
              <button
                onClick={() => updateCartQty(item.productId, -1)}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-600  hover:bg-white  transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => setCartItemQty(item.productId, parseInt(e.target.value) || 0)}
                className="w-9 text-center text-xs font-bold bg-transparent text-slate-800  focus:outline-none"
              />
              <button
                onClick={() => updateCartQty(item.productId, 1)}
                className="w-6 h-6 rounded flex items-center justify-center text-slate-600  hover:bg-white  transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            {/* Right: Subtotal & Actions */}
            <div className="flex items-center space-x-2.5 ml-4 shrink-0">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900 ">
                  {formatCurrency(item.subtotal)}
                </p>
                <button
                  onClick={() => {
                    setEditingDiscountId(item.productId);
                    setDiscountVal(String(item.discount || ''));
                  }}
                  title="Line Discount"
                  className="text-[10px] text-slate-400 hover:text-sky-600 flex items-center justify-end space-x-0.5 mt-0.5"
                >
                  <Tag className="w-2.5 h-2.5" />
                  <span>Disc</span>
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.productId)}
                className="text-slate-300 hover:text-rose-500 p-1 rounded hover:bg-rose-50  transition-colors"
                title="Remove Item (Del)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
