import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requirePermission } from '@/lib/auth';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userOrRes = await requirePermission(req, 'transfers');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    
    const { id } = params;
    const body = await req.json();
    const { status, notes } = body;

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!transfer) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
    }

    if (transfer.status === 'RECEIVED') {
      return NextResponse.json({ error: 'Transfer is already received' }, { status: 400 });
    }

    if (status === 'RECEIVED') {
      // Process receiving logic
      const result = await prisma.$transaction(async (tx) => {
        const updated = await tx.stockTransfer.update({
          where: { id },
          data: {
            status: 'RECEIVED',
            receivedAt: new Date(),
            notes: notes || transfer.notes,
          },
        });

        for (const item of transfer.items) {
          // Increment at destination store
          const inv = await tx.inventory.findUnique({
            where: { productId_storeId: { productId: item.productId, storeId: transfer.toStoreId } },
          });

          const currentOnHand = inv?.onHand || 0;
          const newOnHand = currentOnHand + item.dispatchedQty;

          await tx.inventory.upsert({
            where: { productId_storeId: { productId: item.productId, storeId: transfer.toStoreId } },
            create: {
              productId: item.productId,
              storeId: transfer.toStoreId,
              onHand: item.dispatchedQty,
              available: item.dispatchedQty,
            },
            update: {
              onHand: newOnHand,
              available: Math.max(0, newOnHand - (inv?.reserved || 0)),
            },
          });

          await tx.inventoryTransaction.create({
            data: {
              productId: item.productId,
              storeId: transfer.toStoreId,
              type: 'TRANSFER_IN',
              quantity: item.dispatchedQty,
              balanceAfter: newOnHand,
              reason: `Received Stock Transfer In (${transfer.transferNumber})`,
              userId: user?.id,
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: user?.id,
            action: 'UPDATE',
            module: 'INVENTORY',
            details: `Received Stock Transfer ${transfer.transferNumber} at destination store`,
            storeId: transfer.toStoreId,
          },
        });

        return updated;
      });

      return NextResponse.json({ success: true, transfer: result });
    }

    return NextResponse.json({ error: 'Invalid status update' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update transfer' }, { status: 500 });
  }
}
