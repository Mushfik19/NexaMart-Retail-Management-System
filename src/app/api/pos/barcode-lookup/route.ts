import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const barcode = searchParams.get('barcode')?.trim();
    const storeId = searchParams.get('storeId');

    if (!barcode) {
      return NextResponse.json({ error: 'Barcode or SKU parameter required' }, { status: 400 });
    }

    // Try exact barcode match first, then SKU, then exact name
    let product = await prisma.product.findFirst({
      where: {
        barcode,
        status: 'ACTIVE',
      },
      include: {
        category: true,
        inventory: storeId ? { where: { storeId } } : true,
        batches: {
          where: {
            status: 'ACTIVE',
            ...(storeId ? { storeId } : {}),
          },
          orderBy: { expiryDate: 'asc' },
        },
      },
    });

    if (!product) {
      product = await prisma.product.findFirst({
        where: {
          sku: barcode,
          status: 'ACTIVE',
        },
        include: {
          category: true,
          inventory: storeId ? { where: { storeId } } : true,
          batches: {
            where: {
              status: 'ACTIVE',
              ...(storeId ? { storeId } : {}),
            },
            orderBy: { expiryDate: 'asc' },
          },
        },
      });
    }

    if (!product) {
      return NextResponse.json({
        found: false,
        message: 'Product Not Found',
        scannedCode: barcode,
      }, { status: 404 });
    }

    // Extract store-specific inventory
    const inv = product.inventory[0];
    const onHand = inv ? inv.onHand : 0;
    const available = inv ? inv.available : onHand;

    // Check active promotions that match this product or category
    const activePromotions = await prisma.promotion.findMany({
      where: {
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    return NextResponse.json({
      found: true,
      product: {
        id: product.id,
        name: product.name,
        shortName: product.shortName,
        sku: product.sku,
        barcode: product.barcode,
        unit: product.unit,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        taxRate: product.taxRate,
        category: product.category.name,
        categoryId: product.categoryId,
        onHand,
        available,
        isPerishable: product.isPerishable,
        shelfLocation: product.shelfLocation,
        earliestBatch: product.batches[0] || null,
      },
      promotions: activePromotions,
    });
  } catch (error: any) {
    console.error('Barcode lookup error:', error);
    return NextResponse.json({ error: 'Barcode lookup failed' }, { status: 500 });
  }
}
