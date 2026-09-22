import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

interface ReceivedItemInput {
  productId: string;
  orderedQty: number;
  receivedQty: number;
  damagedQty?: number;
  unitCost: number;
  batchNumber?: string;
  expiryDate?: string;
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'purchasing');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();

    const {
      purchaseOrderId,
      storeId,
      supplierInvoice,
      notes,
      items,
    }: {
      purchaseOrderId?: string;
      storeId: string;
      supplierInvoice?: string;
      notes?: string;
      items: ReceivedItemInput[];
    } = body;

    if (!storeId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Store and items required' }, { status: 400 });
    }

    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const grNumber = `GRN-${datePrefix}-${randomSuffix}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create GoodsReceipt header
      const gr = await tx.goodsReceipt.create({
        data: {
          grNumber,
          purchaseOrderId: purchaseOrderId || null,
          userId: user?.id || 'system',
          storeId,
          supplierInvoice,
          notes,
        },
      });

      let totalReceivedUnits = 0;

      for (const item of items) {
        const received = Number(item.receivedQty || 0);
        const damaged = Number(item.damagedQty || 0);
        const accepted = Math.max(0, received - damaged);
        totalReceivedUnits += accepted;

        await tx.goodsReceiptItem.create({
          data: {
            goodsReceiptId: gr.id,
            productId: item.productId,
            orderedQty: Number(item.orderedQty || 0),
            receivedQty: received,
            damagedQty: damaged,
            acceptedQty: accepted,
            unitCost: Number(item.unitCost),
            batchNumber: item.batchNumber || null,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          },
        });

        // Increase Inventory in this store by acceptedQty
        if (accepted > 0) {
          const inv = await tx.inventory.findUnique({
            where: {
              productId_storeId: {
                productId: item.productId,
                storeId,
              },
            },
          });

          const currentStock = inv?.onHand || 0;
          const newBalance = currentStock + accepted;

          await tx.inventory.upsert({
            where: {
              productId_storeId: {
                productId: item.productId,
                storeId,
              },
            },
            create: {
              productId: item.productId,
              storeId,
              onHand: accepted,
              available: accepted,
              damaged,
            },
            update: {
              onHand: newBalance,
              available: Math.max(0, newBalance - (inv?.reserved || 0)),
              damaged: (inv?.damaged || 0) + damaged,
            },
          });

          // Log Inventory Transaction
          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              storeId,
              type: 'PURCHASE',
              quantity: accepted,
              balanceAfter: newBalance,
              unitCost: Number(item.unitCost),
              referenceId: gr.id,
              reason: `Stock Receiving (${gr.grNumber})${supplierInvoice ? ` Inv: ${supplierInvoice}` : ''}`,
              userId: user?.id,
            },
          });

          // If batch / expiry provided, create StockBatch
          if (item.batchNumber && item.expiryDate) {
            await tx.stockBatch.create({
              data: {
                productId: item.productId,
                storeId,
                batchNumber: item.batchNumber,
                expiryDate: new Date(item.expiryDate),
                costPrice: Number(item.unitCost),
                receivedQty: accepted,
                currentQty: accepted,
                status: 'ACTIVE',
              },
            });
          }
        }
      }

      // If tied to a PO, update PO status
      if (purchaseOrderId) {
        await tx.purchaseOrder.update({
          where: { id: purchaseOrderId },
          data: { status: 'RECEIVED' },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          userId: user?.id,
          action: 'RECEIVE_STOCK',
          module: 'PURCHASING',
          details: `Processed Goods Receipt ${gr.grNumber} (${totalReceivedUnits} units received)`,
          storeId,
        },
      });

      return gr;
    });

    return NextResponse.json({
      success: true,
      receipt: result,
      message: 'Goods received and inventory increased successfully',
    });
  } catch (error: any) {
    console.error('Goods receiving error:', error);
    return NextResponse.json({ error: error.message || 'Failed to receive goods' }, { status: 500 });
  }
}
