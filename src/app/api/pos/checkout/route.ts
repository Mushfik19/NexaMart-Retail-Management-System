import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

interface CartItemInput {
  productId: string;
  name: string;
  sku: string;
  barcode: string;
  unitPrice: number;
  costPrice?: number;
  quantity: number;
  discount?: number;
  taxRate?: number;
}

interface PaymentInput {
  method: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'MOBILE_PAYMENT' | 'BANK_TRANSFER' | 'GIFT_CARD' | 'STORE_CREDIT';
  amount: number;
  tendered?: number;
  change?: number;
  transactionRef?: string;
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'pos');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();

    const {
      storeId,
      registerId,
      shiftId,
      customerId,
      items,
      payments,
      orderDiscount = 0,
      notes,
      couponCode,
      redeemedPoints = 0,
    }: {
      storeId: string;
      registerId?: string;
      shiftId?: string;
      customerId?: string;
      items: CartItemInput[];
      payments: PaymentInput[];
      orderDiscount?: number;
      notes?: string;
      couponCode?: string;
      redeemedPoints?: number;
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Cart cannot be empty' }, { status: 400 });
    }

    if (!payments || payments.length === 0) {
      return NextResponse.json({ error: 'At least one payment method is required' }, { status: 400 });
    }

    // Resolve store
    const store = await prisma.store.findUnique({
      where: { id: storeId },
    });

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Resolve register & active shift if not provided
    let finalRegisterId = registerId;
    let finalShiftId = shiftId;

    if (!finalRegisterId) {
      const reg = await prisma.cashRegister.findFirst({
        where: { storeId: store.id, isActive: true },
      });
      finalRegisterId = reg?.id;
    }

    if (!finalShiftId && finalRegisterId) {
      const activeShift = await prisma.shift.findFirst({
        where: { registerId: finalRegisterId, status: 'OPEN' },
      });
      finalShiftId = activeShift?.id;
    }

    if (!finalRegisterId) {
      return NextResponse.json({ error: 'No cash register configured for this store' }, { status: 400 });
    }

    // 1. Validate stock availability for all items in this store
    const productIds = items.map((i) => i.productId);
    const inventoryList = await prisma.inventory.findMany({
      where: {
        productId: { in: productIds },
        storeId: store.id,
      },
    });

    const inventoryMap = new Map<string, (typeof inventoryList)[0]>();
    inventoryList.forEach((inv) => inventoryMap.set(inv.productId, inv));

    for (const item of items) {
      const inv = inventoryMap.get(item.productId);
      const currentStock = inv ? inv.onHand : 0;
      if (currentStock < item.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for "${item.name}". Available: ${currentStock}, Requested: ${item.quantity}.`,
            productId: item.productId,
            availableStock: currentStock,
          },
          { status: 400 }
        );
      }
    }

    // 2. Calculations
    let subtotal = 0;
    let totalTax = 0;
    let itemDiscountTotal = 0;
    let totalCogs = 0;

    const validatedItems = items.map((item) => {
      const itemPrice = Number(item.unitPrice);
      const itemCost = Number(item.costPrice || 0);
      const itemQty = Number(item.quantity);
      const lineDiscount = Number(item.discount || 0);
      const lineSubtotal = Math.max(0, itemPrice * itemQty - lineDiscount);
      const taxRate = item.taxRate !== undefined ? Number(item.taxRate) : store.taxRateDefault;

      // In Australia (tax-inclusive default): tax = total - (total / (1 + rate/100))
      let taxAmount = 0;
      if (store.taxInclusive) {
        taxAmount = lineSubtotal - lineSubtotal / (1 + taxRate / 100);
      } else {
        taxAmount = (lineSubtotal * taxRate) / 100;
      }

      subtotal += lineSubtotal;
      totalTax += taxAmount;
      itemDiscountTotal += lineDiscount;
      totalCogs += itemCost * itemQty;

      return {
        ...item,
        unitPrice: itemPrice,
        costPrice: itemCost,
        quantity: itemQty,
        discount: lineDiscount,
        taxRate,
        taxAmount: Number(taxAmount.toFixed(2)),
        subtotal: Number(lineSubtotal.toFixed(2)),
        total: Number(lineSubtotal.toFixed(2)),
      };
    });

    // Handle redeemed loyalty points discount: 100 points = $1.00
    const loyaltyDiscount = redeemedPoints > 0 ? Number((redeemedPoints / 100).toFixed(2)) : 0;
    const finalOrderDiscount = Number(orderDiscount) + loyaltyDiscount;

    let grandTotal = store.taxInclusive
      ? Math.max(0, subtotal - finalOrderDiscount)
      : Math.max(0, subtotal - finalOrderDiscount + totalTax);

    // Standard cash rounding to 2 decimal places
    grandTotal = Number(grandTotal.toFixed(2));
    const grossProfit = Number((grandTotal - totalCogs).toFixed(2));

    // 3. Payment Validation (Check Split Payment Total)
    const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
    if (totalPaid < grandTotal - 0.01) {
      return NextResponse.json(
        {
          error: `Payment incomplete. Total due: $${grandTotal.toFixed(2)}, Received: $${totalPaid.toFixed(2)}. Remaining: $${(grandTotal - totalPaid).toFixed(2)}.`,
          grandTotal,
          totalPaid,
          remaining: Number((grandTotal - totalPaid).toFixed(2)),
        },
        { status: 400 }
      );
    }

    // Change calculation (for cash payments)
    const cashPayment = payments.find((p) => p.method === 'CASH');
    let changeGiven = 0;
    if (cashPayment && cashPayment.tendered && cashPayment.tendered > cashPayment.amount) {
      changeGiven = Number((cashPayment.tendered - cashPayment.amount).toFixed(2));
    }

    // Receipt Number Generation: RCP-YYYYMMDD-XXXX
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const receiptNumber = `RCP-${datePrefix}-${randomSuffix}`;
    const invoiceNumber = `INV-${datePrefix}-${randomSuffix}`;

    // 4. ATOMIC DATABASE TRANSACTION
    const result = await prisma.$transaction(async (tx) => {
      // a. Create Sale
      const sale = await tx.sale.create({
        data: {
          receiptNumber,
          invoiceNumber,
          storeId: store.id,
          registerId: finalRegisterId!,
          shiftId: finalShiftId,
          userId: user?.id || 'system',
          customerId: customerId || null,
          subtotal: Number(subtotal.toFixed(2)),
          itemDiscount: Number(itemDiscountTotal.toFixed(2)),
          orderDiscount: Number(finalOrderDiscount.toFixed(2)),
          taxAmount: Number(totalTax.toFixed(2)),
          rounding: 0.0,
          grandTotal,
          totalCost: Number(totalCogs.toFixed(2)),
          grossProfit,
          amountPaid: Number(totalPaid.toFixed(2)),
          changeGiven,
          status: 'COMPLETED',
          paymentStatus: 'PAID',
          notes: notes || (couponCode ? `Coupon applied: ${couponCode}` : null),
        },
      });

      // b. Create Sale Items & Deduct Inventory
      for (const item of validatedItems) {
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.productId,
            productName: item.name,
            sku: item.sku,
            barcode: item.barcode,
            unitPrice: item.unitPrice,
            costPrice: item.costPrice,
            quantity: item.quantity,
            discount: item.discount,
            taxRate: item.taxRate,
            taxAmount: item.taxAmount,
            subtotal: item.subtotal,
            total: item.total,
          },
        });

        // Decrement store inventory
        const inv = inventoryMap.get(item.productId);
        const newBalance = (inv?.onHand || 0) - item.quantity;

        await tx.inventory.update({
          where: {
            productId_storeId: {
              productId: item.productId,
              storeId: store.id,
            },
          },
          data: {
            onHand: newBalance,
            available: Math.max(0, newBalance - (inv?.reserved || 0)),
          },
        });

        // Record Inventory Transaction
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            storeId: store.id,
            type: 'SALE',
            quantity: -item.quantity,
            balanceAfter: newBalance,
            unitCost: item.costPrice,
            referenceId: sale.id,
            reason: `Checkout at Register (${sale.receiptNumber})`,
            userId: user?.id,
          },
        });

        // If batch tracked/perishable, decrement earliest batch (FEFO)
        const activeBatch = await tx.stockBatch.findFirst({
          where: {
            productId: item.productId,
            storeId: store.id,
            status: 'ACTIVE',
            currentQty: { gt: 0 },
          },
          orderBy: { expiryDate: 'asc' },
        });

        if (activeBatch) {
          const batchRemaining = Math.max(0, activeBatch.currentQty - item.quantity);
          await tx.stockBatch.update({
            where: { id: activeBatch.id },
            data: {
              currentQty: batchRemaining,
              status: batchRemaining === 0 ? 'DEPLETED' : 'ACTIVE',
            },
          });
        }
      }

      // c. Record Payments
      for (const pay of payments) {
        await tx.payment.create({
          data: {
            saleId: sale.id,
            method: pay.method,
            amount: Number(pay.amount),
            tendered: pay.tendered ? Number(pay.tendered) : null,
            change: pay.change ? Number(pay.change) : null,
            transactionRef: pay.transactionRef || null,
            status: 'SUCCESS',
          },
        });
      }

      // d. Customer Loyalty Points Accrual & Redemption
      if (customerId) {
        const customer = await tx.customer.findUnique({ where: { id: customerId } });
        if (customer) {
          // Points earned: 1 point per $1 spent
          const pointsEarned = Math.floor(grandTotal);
          let newPointsBalance = customer.pointsBalance + pointsEarned;

          // Points redemption deduction
          if (redeemedPoints > 0) {
            newPointsBalance = Math.max(0, newPointsBalance - redeemedPoints);
            await tx.loyaltyTransaction.create({
              data: {
                customerId: customer.id,
                type: 'REDEEM',
                points: -redeemedPoints,
                balanceAfter: newPointsBalance,
                saleId: sale.id,
                reason: `Redeemed ${redeemedPoints} pts on sale ${sale.receiptNumber}`,
              },
            });
          }

          if (pointsEarned > 0) {
            await tx.loyaltyTransaction.create({
              data: {
                customerId: customer.id,
                type: 'EARN',
                points: pointsEarned,
                balanceAfter: newPointsBalance,
                saleId: sale.id,
                reason: `Earned on sale ${sale.receiptNumber}`,
              },
            });
          }

          const newTotalSpend = Number((customer.totalSpending + grandTotal).toFixed(2));
          let newTier = customer.loyaltyTier;
          if (newTotalSpend >= 3000) newTier = 'VIP';
          else if (newTotalSpend >= 1500) newTier = 'GOLD';
          else if (newTotalSpend >= 500) newTier = 'SILVER';

          await tx.customer.update({
            where: { id: customerId },
            data: {
              pointsBalance: newPointsBalance,
              totalSpending: newTotalSpend,
              loyaltyTier: newTier,
            },
          });
        }
      }

      // e. Audit Log
      await tx.auditLog.create({
        data: {
          userId: user?.id,
          action: 'SALE',
          module: 'POS',
          details: `Completed sale ${sale.receiptNumber} totaling $${grandTotal.toFixed(2)} (${items.length} items)`,
          storeId: store.id,
        },
      });

      return sale;
    });

    // Fetch full completed sale with items & payments for receipt printing
    const completedSale = await prisma.sale.findUnique({
      where: { id: result.id },
      include: {
        items: true,
        payments: true,
        customer: true,
        user: { select: { fullName: true, username: true } },
        store: true,
        register: true,
      },
    });

    return NextResponse.json({
      success: true,
      sale: completedSale,
      message: 'Transaction completed successfully',
    });
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: error.message || 'Checkout failed' }, { status: 500 });
  }
}
