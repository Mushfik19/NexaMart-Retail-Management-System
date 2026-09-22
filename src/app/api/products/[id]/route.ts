import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        supplier: true,
        inventory: {
          include: { store: true },
        },
        batches: {
          orderBy: { expiryDate: 'asc' },
        },
        inventoryTxns: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: { user: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error('Fetch product detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userOrRes = await requirePermission(req, 'products');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Price change audit
    const priceChanged = body.sellingPrice && Number(body.sellingPrice) !== existing.sellingPrice;
    const oldPrice = existing.sellingPrice;

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: body.name ?? existing.name,
        shortName: body.shortName ?? existing.shortName,
        description: body.description ?? existing.description,
        categoryId: body.categoryId ?? existing.categoryId,
        supplierId: body.supplierId ?? existing.supplierId,
        costPrice: body.costPrice !== undefined ? Number(body.costPrice) : existing.costPrice,
        sellingPrice: body.sellingPrice !== undefined ? Number(body.sellingPrice) : existing.sellingPrice,
        wholesalePrice: body.wholesalePrice !== undefined ? Number(body.wholesalePrice) : existing.wholesalePrice,
        taxRate: body.taxRate !== undefined ? Number(body.taxRate) : existing.taxRate,
        unit: body.unit ?? existing.unit,
        minStockLevel: body.minStockLevel !== undefined ? Number(body.minStockLevel) : existing.minStockLevel,
        maxStockLevel: body.maxStockLevel !== undefined ? Number(body.maxStockLevel) : existing.maxStockLevel,
        reorderPoint: body.reorderPoint !== undefined ? Number(body.reorderPoint) : existing.reorderPoint,
        shelfLocation: body.shelfLocation ?? existing.shelfLocation,
        status: body.status ?? existing.status,
      },
    });

    if (priceChanged) {
      await prisma.auditLog.create({
        data: {
          userId: user?.id,
          action: 'UPDATE',
          module: 'PRODUCTS',
          details: `Price changed for "${updated.name}" from $${oldPrice.toFixed(2)} to $${updated.sellingPrice.toFixed(2)}`,
          oldValue: String(oldPrice),
          newValue: String(updated.sellingPrice),
        },
      });
    }

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userOrRes = await requirePermission(req, 'products');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;

    const product = await prisma.product.update({
      where: { id },
      data: { status: 'ARCHIVED' },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: 'DELETE',
        module: 'PRODUCTS',
        details: `Archived product "${product.name}" (SKU: ${product.sku})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
