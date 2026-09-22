import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

// GET: Search sale by receiptNumber, invoiceNumber, customer phone, or id
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({ error: 'Search query required' }, { status: 400 });
    }

    const sale = await prisma.sale.findFirst({
      where: {
        OR: [
          { receiptNumber: query },
          { invoiceNumber: query },
          { id: query },
          { customer: { phone: query } },
        ],
      },
      include: {
        items: { include: { product: true } },
        payments: true,
        customer: true,
        store: true,
        refunds: {
          include: { items: true },
        },
      },
    });

    if (!sale) {
      return NextResponse.json({ found: false, message: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ found: true, sale });
  } catch (error: any) {
    console.error('Search sale error:', error);
    return NextResponse.json({ error: 'Failed to find sale' }, { status: 500 });
  }
}

// POST: Process Return / Refund
export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'returns');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();

    const {
      saleId,
      refundMethod, // 'ORIGINAL_PAYMENT', 'CASH', 'STORE_CREDIT'
      reason, // 'DAMAGED', 'WRONG_ITEM', 'CHANGED_MIND', 'EXPIRED', 'OTHER'
      notes,
      items, // array of { saleItemId: string, productId: string, quantity: number, unitPrice: number, restock: boolean, reason: string }
    } = body;

    if (!saleId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Sale ID and items to return are required' }, { status: 400 });
    }

    const sale = await prisma.sale.findUnique({
      where: { id: saleId },
      include: { items: true, store: true },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Original sale not found' }, { status: 404 });
    }

    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const refundNumber = `REF-${datePrefix}-${randomSuffix}`;

    let totalRefunded = 0;
    for (const it of items) {
      totalRefunded += Number(it.quantity) * Number(it.unitPrice);
    }
    totalRefunded = Number(totalRefunded.toFixed(2));

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create Refund Record
      const refund = await tx.refund.create({
        data: {
          refundNumber,
          saleId: sale.id,
          customerId: sale.customerId,
          processedById: user?.id,
          subtotal: totalRefunded,
          taxRefunded: 0.0,
          totalRefunded,
          refundMethod,
          reason,
          restockItems: items.some((i: any) => i.restock),
          notes,
        },
      });

      // 2. Process returned items
      for (const item of items) {
        const itemQty = Number(item.quantity);
        const itemRefundTotal = Number((itemQty * Number(item.unitPrice)).toFixed(2));

        await tx.refundItem.create({
          data: {
            refundId: refund.id,
            productId: item.productId,
            quantity: itemQty,
            unitPrice: Number(item.unitPrice),
            refundTotal: itemRefundTotal,
            reason: item.reason || reason,
            restocked: Boolean(item.restock),
          },
        });

        // Restock inventory if item is not damaged or marked restock
        if (item.restock) {
          const inv = await tx.inventory.findUnique({
            where: {
              productId_storeId: {
                productId: item.productId,
                storeId: sale.storeId,
              },
            },
          });

          const currentStock = inv?.onHand || 0;
          const newBalance = currentStock + itemQty;

          await tx.inventory.update({
            where: {
              productId_storeId: {
                productId: item.productId,
                storeId: sale.storeId,
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
              storeId: sale.storeId,
              type: 'RETURN',
              quantity: itemQty,
              balanceAfter: newBalance,
              unitCost: item.unitPrice,
              referenceId: refund.id,
              reason: `Customer Refund (${refund.refundNumber}): ${reason}`,
              userId: user?.id,
            },
          });
        }
      }

      // 3. Update Sale status
      await tx.sale.update({
        where: { id: sale.id },
        data: {
          status: 'PARTIALLY_REFUNDED',
        },
      });

      // 4. Audit log
      await tx.auditLog.create({
        data: {
          userId: user?.id,
          action: 'REFUND',
          module: 'RETURNS',
          details: `Processed Refund ${refund.refundNumber} for Sale ${sale.receiptNumber}. Total refunded: $${totalRefunded.toFixed(2)} via ${refundMethod}`,
          storeId: sale.storeId,
        },
      });

      return refund;
    });

    return NextResponse.json({
      success: true,
      refund: result,
      message: 'Return processed and refund recorded successfully',
    });
  } catch (error: any) {
    console.error('Return processing error:', error);
    return NextResponse.json({ error: error.message || 'Failed to process return' }, { status: 500 });
  }
}
