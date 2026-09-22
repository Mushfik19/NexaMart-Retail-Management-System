export interface Product {
  id: string;
  name: string;
  shortName?: string | null;
  sku: string;
  barcode: string;
  unit: string;
  sellingPrice: number;
  costPrice: number;
  taxRate: number;
  category: { id: string; name: string } | string;
  categoryId?: string;
  stock?: number;
  onHand?: number;
  available?: number;
  reorderPoint?: number;
  shelfLocation?: string | null;
  isPerishable?: boolean;
  status?: string;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  subtotal: number;
  total: number;
  unit: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  membershipNo?: string | null;
  loyaltyTier: string;
  pointsBalance: number;
  totalSpending: number;
}

export interface Store {
  id: string;
  name: string;
  code: string;
  currency: string;
  currencySymbol: string;
  taxInclusive: boolean;
  taxRateDefault: number;
  phone?: string | null;
  address?: string | null;
  taxNumber?: string | null;
}

export interface Shift {
  id: string;
  registerId: string;
  userId: string;
  storeId: string;
  openingCash: number;
  status: string;
  startTime?: string | Date;
  endTime?: string | Date;
  register?: { id: string; name: string; code: string };
  user?: { fullName: string; username: string };
}

export interface SaleReceipt {
  id: string;
  receiptNumber: string;
  invoiceNumber?: string | null;
  createdAt: string;
  grandTotal: number;
  subtotal: number;
  itemDiscount: number;
  orderDiscount: number;
  taxAmount: number;
  amountPaid: number;
  changeGiven: number;
  status: string;
  notes?: string | null;
  customer?: Customer | null;
  user?: { fullName: string; username: string } | null;
  store?: Store | null;
  register?: { name: string; code: string } | null;
  items: {
    id: string;
    productName: string;
    sku: string;
    barcode: string;
    unitPrice: number;
    quantity: number;
    discount: number;
    subtotal: number;
    total: number;
  }[];
  payments: {
    id: string;
    method: string;
    amount: number;
    tendered?: number | null;
    change?: number | null;
  }[];
}
