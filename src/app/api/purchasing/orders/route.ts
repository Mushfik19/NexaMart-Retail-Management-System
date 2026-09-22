import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const status = searchParams.get('status');

    const where: any = {};
    if (storeId) where.storeId = storeId;
    if (status && status !== 'all') where.status = status;

    const orders = await prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: true,
        store: true,
        user: { select: { fullName: true } },
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Fetch PO error:', error);
    return NextResponse.json({ error: 'Failed to fetch purchase orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'purchasing');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();

    const {
      supplierId,
      storeId,
      expectedDelivery,
      notes,
      items,
    }: {
      supplierId: string;
      storeId: string;
      expectedDelivery?: string;
      notes?: string;
      items: { productId: string; quantity: number; unitCost: number }[];
    } = body;

    if (!supplierId || !storeId || !items || items.length === 0) {
      return NextResponse.json({ error: 'Supplier, store, and at least one item required' }, { status: 400 });
    }

    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const poNumber = `PO-${datePrefix}-${randomSuffix}`;

    let subtotal = 0;
    const validatedItems = items.map((i) => {
      const lineTotal = Number(i.quantity) * Number(i.unitCost);
      subtotal += lineTotal;
      return {
        productId: i.productId,
        orderedQty: Number(i.quantity),
        unitCost: Number(i.unitCost),
        lineTotal: Number(lineTotal.toFixed(2)),
      };
    });

    const grandTotal = Number(subtotal.toFixed(2));

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        storeId,
        userId: user?.id || 'system',
        expectedDelivery: expectedDelivery ? new Date(expectedDelivery) : null,
        status: 'ORDERED',
        subtotal,
        grandTotal,
        notes,
        items: {
          create: validatedItems,
        },
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: 'CREATE',
        module: 'PURCHASING',
        details: `Created Purchase Order ${po.poNumber} with ${items.length} items for $${grandTotal.toFixed(2)}`,
        storeId,
      },
    });

    return NextResponse.json({ success: true, order: po });
  } catch (error: any) {
    console.error('Create PO error:', error);
    return NextResponse.json({ error: 'Failed to create purchase order' }, { status: 500 });
  }
}
