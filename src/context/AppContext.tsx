'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Store, Shift, Customer, CartItem, SaleReceipt } from '@/lib/types';

interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: string;
  storeId?: string | null;
}

interface AppContextType {
  user: AuthUser | null;
  store: Store | null;
  stores: Store[];
  activeShift: Shift | null;
  isOnline: boolean;
  offlineQueueCount: number;
  cart: CartItem[];
  customer: Customer | null;
  orderDiscount: number;
  couponCode: string;
  redeemedPoints: number;
  heldCarts: { id: string; name: string; items: CartItem[]; customer: Customer | null; date: string }[];
  notifications: { id: string; title: string; message: string; type: 'warning' | 'danger' | 'info' }[];
  switchRole: (role: string) => Promise<void>;
  switchStore: (storeId: string) => void;
  addToCart: (product: any, qty?: number) => void;
  updateCartQty: (productId: string, delta: number) => void;
  setCartItemQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  setCartItemDiscount: (productId: string, discount: number) => void;
  clearCart: () => void;
  setCustomer: (customer: Customer | null) => void;
  setOrderDiscount: (amount: number) => void;
  setCouponCode: (code: string) => void;
  setRedeemedPoints: (points: number) => void;
  holdCurrentCart: (name?: string) => void;
  recallCart: (cartId: string) => void;
  formatCurrency: (amount: number) => string;
  refreshAppData: () => Promise<void>;
  broadcastToCustomerDisplay: (data: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [offlineQueueCount, setOfflineQueueCount] = useState<number>(0);

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderDiscount, setOrderDiscount] = useState<number>(0);
  const [couponCode, setCouponCode] = useState<string>('');
  const [redeemedPoints, setRedeemedPoints] = useState<number>(0);
  const [heldCarts, setHeldCarts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Broadcast channel for customer display
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const bc = new BroadcastChannel('nexamart_pos_display');
      setChannel(bc);
      return () => bc.close();
    }
  }, []);

  const broadcastToCustomerDisplay = useCallback(
    (data: any) => {
      if (channel) {
        channel.postMessage(data);
      }
      // Also fallback to localStorage for older browsers
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexamart_display_state', JSON.stringify(data));
      }
    },
    [channel]
  );

  // Online / Offline monitor
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Load held carts from localStorage
      const savedHeld = localStorage.getItem('nexamart_held_carts');
      if (savedHeld) {
        try {
          setHeldCarts(JSON.parse(savedHeld));
        } catch (e) {}
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  // Fetch Session & Initial Data
  const refreshAppData = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setStore(data.store);
        setStores(data.stores || []);
        setActiveShift(data.activeShift);
      }

      // Check alerts (low stock, expiring)
      const invRes = await fetch('/api/inventory');
      if (invRes.ok) {
        const invData = await invRes.json();
        const alerts: any[] = [];
        if (invData.metrics?.lowStockCount > 0) {
          alerts.push({
            id: 'low-stock',
            title: 'Low Stock Alert',
            message: `${invData.metrics.lowStockCount} products are below reorder level.`,
            type: 'warning',
          });
        }
        if (invData.metrics?.outOfStockCount > 0) {
          alerts.push({
            id: 'out-of-stock',
            title: 'Out of Stock Alert',
            message: `${invData.metrics.outOfStockCount} items have zero inventory!`,
            type: 'danger',
          });
        }
        setNotifications(alerts);
      }
    } catch (err) {
      console.error('Error loading app data:', err);
    }
  }, []);

  useEffect(() => {
    refreshAppData();
  }, [refreshAppData]);

  // Switch role quickly in UI
  const switchRole = async (role: string) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, storeId: store?.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setActiveShift(data.activeShift);
      }
    } catch (err) {
      console.error('Error switching role:', err);
    }
  };

  // Switch store
  const switchStore = (storeId: string) => {
    const s = stores.find((st) => st.id === storeId);
    if (s) {
      setStore(s);
      clearCart();
    }
  };

  // Cart operations
  const addToCart = (product: any, qty: number = 1) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((item) => item.productId === product.id);
      const price = Number(product.unitPrice || product.sellingPrice);
      const cost = Number(product.costPrice || 0);
      const taxRate = Number(product.taxRate || 10);

      let newCart: CartItem[];

      if (existingIndex > -1) {
        newCart = [...prev];
        const updatedQty = newCart[existingIndex].quantity + qty;
        const subtotal = updatedQty * price - newCart[existingIndex].discount;
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: updatedQty,
          subtotal,
          total: subtotal,
        };
      } else {
        const subtotal = price * qty;
        const newItem: CartItem = {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          barcode: product.barcode,
          unitPrice: price,
          costPrice: cost,
          quantity: qty,
          discount: 0,
          taxRate,
          taxAmount: Number(((subtotal * taxRate) / (100 + taxRate)).toFixed(2)),
          subtotal,
          total: subtotal,
          unit: product.unit || 'pcs',
        };
        newCart = [newItem, ...prev];
      }

      broadcastToCustomerDisplay({
        type: 'CART_UPDATE',
        items: newCart,
        subtotal: newCart.reduce((a, b) => a + b.subtotal, 0),
        customer,
      });

      return newCart;
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((prev) => {
      const newCart = prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            const subtotal = newQty * item.unitPrice - item.discount;
            return {
              ...item,
              quantity: newQty,
              subtotal,
              total: subtotal,
            };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];

      broadcastToCustomerDisplay({
        type: 'CART_UPDATE',
        items: newCart,
        subtotal: newCart.reduce((a, b) => a + b.subtotal, 0),
        customer,
      });

      return newCart;
    });
  };

  const setCartItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const newCart = prev.map((item) => {
        if (item.productId === productId) {
          const subtotal = qty * item.unitPrice - item.discount;
          return {
            ...item,
            quantity: qty,
            subtotal,
            total: subtotal,
          };
        }
        return item;
      });

      broadcastToCustomerDisplay({
        type: 'CART_UPDATE',
        items: newCart,
        subtotal: newCart.reduce((a, b) => a + b.subtotal, 0),
        customer,
      });

      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const newCart = prev.filter((item) => item.productId !== productId);
      broadcastToCustomerDisplay({
        type: 'CART_UPDATE',
        items: newCart,
        subtotal: newCart.reduce((a, b) => a + b.subtotal, 0),
        customer,
      });
      return newCart;
    });
  };

  const setCartItemDiscount = (productId: string, discount: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const subtotal = Math.max(0, item.quantity * item.unitPrice - discount);
          return {
            ...item,
            discount,
            subtotal,
            total: subtotal,
          };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
    setCustomer(null);
    setOrderDiscount(0);
    setCouponCode('');
    setRedeemedPoints(0);
    broadcastToCustomerDisplay({ type: 'CLEAR_CART' });
  };

  // Hold / Recall Cart
  const holdCurrentCart = (name?: string) => {
    if (cart.length === 0) return;
    const newHeld = {
      id: `HOLD-${Date.now()}`,
      name: name || `Hold Cart #${heldCarts.length + 1} (${cart.length} items)`,
      items: [...cart],
      customer,
      date: new Date().toLocaleTimeString(),
    };
    const updated = [newHeld, ...heldCarts];
    setHeldCarts(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nexamart_held_carts', JSON.stringify(updated));
    }
    clearCart();
  };

  const recallCart = (cartId: string) => {
    const found = heldCarts.find((h) => h.id === cartId);
    if (found) {
      setCart(found.items);
      setCustomer(found.customer);
      const remaining = heldCarts.filter((h) => h.id !== cartId);
      setHeldCarts(remaining);
      if (typeof window !== 'undefined') {
        localStorage.setItem('nexamart_held_carts', JSON.stringify(remaining));
      }
    }
  };

  const formatCurrency = (amount: number = 0) => {
    const symbol = store?.currencySymbol || '$';
    return `${symbol}${Number(amount).toFixed(2)}`;
  };

  return (
    <AppContext.Provider
      value={{
        user,
        store,
        stores,
        activeShift,
        isOnline,
        offlineQueueCount,
        cart,
        customer,
        orderDiscount,
        couponCode,
        redeemedPoints,
        heldCarts,
        notifications,
        switchRole,
        switchStore,
        addToCart,
        updateCartQty,
        setCartItemQty,
        removeFromCart,
        setCartItemDiscount,
        clearCart,
        setCustomer,
        setOrderDiscount,
        setCouponCode,
        setRedeemedPoints,
        holdCurrentCart,
        recallCart,
        formatCurrency,
        refreshAppData,
        broadcastToCustomerDisplay,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
