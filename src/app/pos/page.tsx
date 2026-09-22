'use client';

import React, { useState, useEffect, useRef } from 'react';
import ProductGrid from '@/components/pos/ProductGrid';
import CartTable from '@/components/pos/CartTable';
import OrderSummary from '@/components/pos/OrderSummary';
import PaymentModal from '@/components/pos/PaymentModal';
import ReceiptModal from '@/components/pos/ReceiptModal';
import CustomerSelectModal from '@/components/pos/CustomerSelectModal';
import CameraScannerModal from '@/components/pos/CameraScannerModal';
import HoldSalesModal from '@/components/pos/HoldSalesModal';
import { useApp } from '@/context/AppContext';
import { SaleReceipt } from '@/lib/types';
import { Volume2, VolumeX, Barcode } from 'lucide-react';

export default function PosPage() {
  const { store, addToCart, cart, holdCurrentCart, clearCart } = useApp();

  // Modals state
  const [showPayment, setShowPayment] = useState<boolean>(false);
  const [showCustomer, setShowCustomer] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [showHeld, setShowHeld] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<SaleReceipt | null>(null);
  const [quickCashAmount, setQuickCashAmount] = useState<number | null>(null);

  // Scanner audio feedback
  const [audioBeep, setAudioBeep] = useState<boolean>(true);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  // USB Barcode Scanner hardware listener (keyboard buffer)
  const barcodeBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  const playBeep = () => {
    if (!audioBeep || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, ctx.currentTime); // High pitch supermarket beep
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch (e) {}
  };

  const handleBarcodeScanned = async (code: string) => {
    if (!code) return;
    try {
      const res = await fetch(`/api/pos/barcode-lookup?barcode=${encodeURIComponent(code)}&storeId=${store?.id || ''}`);
      const data = await res.json();

      if (res.ok && data.found) {
        playBeep();
        addToCart(data.product, 1);
        setScanNotice(`Scanned: ${data.product.name}`);
        setTimeout(() => setScanNotice(null), 2000);
      } else {
        setScanNotice(`⚠️ Barcode not found: ${code}`);
        setTimeout(() => setScanNotice(null), 3000);
      }
    } catch (err) {
      console.error('Scan error:', err);
    }
  };

  // Global Hardware USB Scanner & POS Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check POS function keys
      if (e.key === 'F1') {
        e.preventDefault();
        const searchInput = document.getElementById('pos-search-input');
        searchInput?.focus();
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setShowCustomer(true);
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        holdCurrentCart();
        return;
      }
      if (e.key === 'F5') {
        e.preventDefault();
        if (cart.length > 0) setShowPayment(true);
        return;
      }
      if (e.key === 'Escape') {
        setShowPayment(false);
        setShowCustomer(false);
        setShowCamera(false);
        setShowHeld(false);
        return;
      }

      // 2. Hardware Barcode Scanner detection
      // Barcode scanners output characters very rapidly (< 35ms apart) and end with Enter
      const now = Date.now();
      const diff = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Ignore normal typing in input elements unless it's fast scanner input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      if (e.key === 'Enter') {
        if (barcodeBufferRef.current.length >= 6) {
          e.preventDefault();
          const scanned = barcodeBufferRef.current;
          barcodeBufferRef.current = '';
          handleBarcodeScanned(scanned);
          return;
        }
        barcodeBufferRef.current = '';
        return;
      }

      if (e.key.length === 1) {
        if (diff > 80 && !isInput) {
          // Reset buffer if delay too long for a scanner
          barcodeBufferRef.current = '';
        }
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, store?.id]);

  const handleQuickCash = (amount: number) => {
    setQuickCashAmount(amount);
    setShowPayment(true);
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col overflow-hidden select-none bg-slate-100 ">
      {/* Mini Barcode Scan notification toast */}
      {scanNotice && (
        <div className="bg-sky-600 text-white text-xs font-semibold px-4 py-2 shadow-md flex items-center justify-between z-30 animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <Barcode className="w-4 h-4" />
            <span>{scanNotice}</span>
          </div>
          <button
            onClick={() => setAudioBeep(!audioBeep)}
            className="text-xs text-sky-200 hover:text-white flex items-center space-x-1"
          >
            {audioBeep ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{audioBeep ? 'Sound On' : 'Muted'}</span>
          </button>
        </div>
      )}

      {/* Main 3-Column Supermarket POS Layout */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        {/* LEFT COLUMN: Product Search & Catalog (5 cols) */}
        <div className="col-span-12 md:col-span-5 h-full overflow-hidden">
          <ProductGrid onOpenScanner={() => setShowCamera(true)} />
        </div>

        {/* CENTER COLUMN: Checkout Cart (4 cols) */}
        <div className="col-span-12 md:col-span-4 h-full overflow-hidden">
          <CartTable />
        </div>

        {/* RIGHT COLUMN: Order Summary & Checkout (3 cols) */}
        <div className="col-span-12 md:col-span-3 h-full overflow-hidden">
          <OrderSummary
            onOpenPayment={() => {
              setQuickCashAmount(null);
              setShowPayment(true);
            }}
            onOpenCustomer={() => setShowCustomer(true)}
            onOpenHeld={() => setShowHeld(true)}
            onQuickCash={handleQuickCash}
          />
        </div>
      </div>

      {/* Modals */}
      {showPayment && (
        <PaymentModal
          initialCashPreset={quickCashAmount}
          onClose={() => setShowPayment(false)}
          onSuccess={(receipt) => {
            setShowPayment(false);
            setActiveReceipt(receipt);
          }}
        />
      )}

      {activeReceipt && (
        <ReceiptModal
          receipt={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {showCustomer && (
        <CustomerSelectModal onClose={() => setShowCustomer(false)} />
      )}

      {showCamera && (
        <CameraScannerModal
          onScan={(code) => handleBarcodeScanned(code)}
          onClose={() => setShowCamera(false)}
        />
      )}

      {showHeld && (
        <HoldSalesModal onClose={() => setShowHeld(false)} />
      )}
    </div>
  );
}
