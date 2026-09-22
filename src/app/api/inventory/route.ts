import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const view = searchParams.get('view') || 'stock'; // 'stock', 'batches', 'movements', 'valuation'

    if (view === 'movements') {
      const movements = await prisma.inventoryTransaction.findMany({
        where: storeId ? { storeId } : {},
        take: 100,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, sku: true, barcode: true, unit: true } },
          user: { select: { fullName: true, username: true } },
        },
      });
      return NextResponse.json({ movements });
    }

    if (view === 'batches') {
      const now = new Date();
      const in30Days = new Date();
      in30Days.setDate(now.getDate() + 30);

      const batches = await prisma.stockBatch.findMany({
        where: {
          status: 'ACTIVE',
          currentQty: { gt: 0 },
          ...(storeId ? { storeId } : {}),
        },
        orderBy: { expiryDate: 'asc' },
        include: {
          product: { select: { name: true, sku: true, barcode: true, shelfLocation: true } },
        },
      });

      const formattedBatches = batches.map((b) => {
        const diffMs = b.expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        let urgency = 'GOOD';
        if (diffDays < 0) urgency = 'EXPIRED';
        else if (diffDays <= 3) urgency = 'CRITICAL_3D';
        else if (diffDays <= 7) urgency = 'URGENT_7D';
        else if (diffDays <= 14) urgency = 'WARNING_14D';
        else if (diffDays <= 30) urgency = 'ATTENTION_30D';

        return {
          ...b,
          daysUntilExpiry: diffDays,
          urgency,
        };
      });

      return NextResponse.json({ batches: formattedBatches });
    }

    // Default: stock on hand with valuation
    const inventory = await prisma.inventory.findMany({
      where: storeId ? { storeId } : {},
      include: {
        product: {
          include: { category: true, supplier: true },
        },
        store: true,
      },
      orderBy: { product: { name: 'asc' } },
    });

    let totalValuationCost = 0;
    let totalValuationRetail = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const formattedInventory = inventory.map((inv) => {
      const costValue = inv.onHand * inv.product.costPrice;
      const retailValue = inv.onHand * inv.product.sellingPrice;
      totalValuationCost += costValue;
      totalValuationRetail += retailValue;

      if (inv.onHand === 0) outOfStockCount++;
      else if (inv.onHand <= inv.reorderPoint) lowStockCount++;

      return {
        id: inv.id,
        productId: inv.productId,
        productName: inv.product.name,
        sku: inv.product.sku,
        barcode: inv.product.barcode,
        category: inv.product.category.name,
        supplier: inv.product.supplier?.name || 'N/A',
        storeName: inv.store.name,
        storeId: inv.storeId,
        onHand: inv.onHand,
        available: inv.available,
        reserved: inv.reserved,
        damaged: inv.damaged,
        reorderPoint: inv.reorderPoint,
        maxStock: inv.maxStock,
        costPrice: inv.product.costPrice,
        sellingPrice: inv.product.sellingPrice,
        costValue: Number(costValue.toFixed(2)),
        retailValue: Number(retailValue.toFixed(2)),
        shelfLocation: inv.product.shelfLocation,
        isPerishable: inv.product.isPerishable,
      };
    });

    return NextResponse.json({
      inventory: formattedInventory,
      metrics: {
        totalProducts: inventory.length,
        totalValuationCost: Number(totalValuationCost.toFixed(2)),
        totalValuationRetail: Number(totalValuationRetail.toFixed(2)),
        estimatedProfitMargin: totalValuationRetail > 0
          ? Number((((totalValuationRetail - totalValuationCost) / totalValuationRetail) * 100).toFixed(1))
          : 0,
        lowStockCount,
        outOfStockCount,
      },
    });
  } catch (error: any) {
    console.error('Inventory GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

// POST: Inventory adjustment (Damaged, Found, Theft, Audit recount)
export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'inventory');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();

    const { productId, storeId, adjustmentType, quantity, reason } = body;
    // adjustmentType: 'ADD', 'SUBTRACT', 'SET', 'DAMAGE'

    if (!productId || !storeId || quantity === undefined || !reason) {
      return NextResponse.json({ error: 'Product, store, quantity and reason are required' }, { status: 400 });
    }

    const inv = await prisma.inventory.findUnique({
      where: { productId_storeId: { productId, storeId } },
      include: { product: true },
    });

    if (!inv) {
      return NextResponse.json({ error: 'Inventory record not found' }, { status: 404 });
    }

    const currentQty = inv.onHand;
    let newQty = currentQty;
    let delta = 0;

    const qtyNum = Math.abs(Number(quantity));

    if (adjustmentType === 'ADD') {
      newQty = currentQty + qtyNum;
      delta = qtyNum;
    } else if (adjustmentType === 'SUBTRACT') {
      newQty = Math.max(0, currentQty - qtyNum);
      delta = -(currentQty - newQty);
    } else if (adjustmentType === 'DAMAGE') {
      newQty = Math.max(0, currentQty - qtyNum);
      delta = -(currentQty - newQty);
      await prisma.inventory.update({
        where: { id: inv.id },
        data: {
          damaged: inv.damaged + qtyNum,
        },
      });
    } else if (adjustmentType === 'SET') {
      newQty = Number(quantity);
      delta = newQty - currentQty;
    }

    // Atomic update
    await prisma.$transaction([
      prisma.inventory.update({
        where: { id: inv.id },
        data: {
          onHand: newQty,
          available: Math.max(0, newQty - inv.reserved),
        },
      }),
      prisma.inventoryTransaction.create({
        data: {
          productId,
          storeId,
          type: adjustmentType === 'DAMAGE' ? 'DAMAGE' : 'ADJUSTMENT',
          quantity: delta,
          balanceAfter: newQty,
          unitCost: inv.product.costPrice,
          reason: `Manual Adjustment (${adjustmentType}): ${reason}`,
          userId: user?.id,
        },
      }),
      prisma.auditLog.create({
        data: {
          userId: user?.id,
          action: 'ADJUSTMENT',
          module: 'INVENTORY',
          details: `Adjusted "${inv.product.name}" by ${delta > 0 ? `+${delta}` : delta} (New on-hand: ${newQty}). Reason: ${reason}`,
          oldValue: String(currentQty),
          newValue: String(newQty),
          storeId,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Stock adjusted successfully',
      newBalance: newQty,
    });
  } catch (error: any) {
    console.error('Inventory POST error:', error);
    return NextResponse.json({ error: 'Failed to adjust stock' }, { status: 500 });
  }
}
