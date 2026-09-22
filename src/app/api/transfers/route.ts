import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

export async function GET() {
  try {
    const transfers = await prisma.stockTransfer.findMany({
      include: {
        fromStore: true,
        toStore: true,
        initiatedBy: { select: { fullName: true } },
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ transfers });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch transfers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'transfers');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();
    const { fromStoreId, toStoreId, notes, items } = body;

    if (!fromStoreId || !toStoreId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Source store, destination store, and items required' }, { status: 400 });
    }

    if (fromStoreId === toStoreId) {
      return NextResponse.json({ error: 'Source and destination stores cannot be identical' }, { status: 400 });
    }

    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const transferNumber = `TRF-${datePrefix}-${randomSuffix}`;

    const transfer = await prisma.stockTransfer.create({
      data: {
        transferNumber,
        fromStoreId,
        toStoreId,
        initiatedById: user?.id || 'system',
        status: 'IN_TRANSIT',
        notes,
        items: {
          create: items.map((i: any) => ({
            productId: i.productId,
            requestedQty: Number(i.quantity),
            dispatchedQty: Number(i.quantity),
          })),
        },
      },
      include: {
        fromStore: true,
        toStore: true,
        items: { include: { product: true } },
      },
    });

    // Deduct from source store inventory
    for (const item of items) {
      const inv = await prisma.inventory.findUnique({
        where: { productId_storeId: { productId: item.productId, storeId: fromStoreId } },
      });
      const newOnHand = Math.max(0, (inv?.onHand || 0) - Number(item.quantity));

      await prisma.inventory.update({
        where: { productId_storeId: { productId: item.productId, storeId: fromStoreId } },
        data: { onHand: newOnHand, available: newOnHand },
      });

      await prisma.inventoryTransaction.create({
        data: {
          productId: item.productId,
          storeId: fromStoreId,
          type: 'TRANSFER_OUT',
          quantity: -Number(item.quantity),
          balanceAfter: newOnHand,
          reason: `Stock Transfer Out to destination (${transfer.transferNumber})`,
          userId: user?.id,
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: 'CREATE',
        module: 'INVENTORY',
        details: `Dispatched Stock Transfer ${transfer.transferNumber} (${items.length} items)`,
        storeId: fromStoreId,
      },
    });

    return NextResponse.json({ success: true, transfer });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create transfer' }, { status: 500 });
  }
}
