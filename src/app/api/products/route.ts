import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';
    const categoryId = searchParams.get('category');
    const supplierId = searchParams.get('supplier');
    const stockStatus = searchParams.get('stockStatus'); // 'low', 'out', 'in'
    const storeId = searchParams.get('storeId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {
      status: { not: 'ARCHIVED' },
    };

    if (query) {
      where.OR = [
        { name: { contains: query } },
        { barcode: { contains: query } },
        { sku: { contains: query } },
      ];
    }

    if (categoryId && categoryId !== 'all') {
      where.categoryId = categoryId;
    }

    if (supplierId && supplierId !== 'all') {
      where.supplierId = supplierId;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: {
          category: true,
          supplier: true,
          inventory: storeId ? { where: { storeId } } : true,
          batches: {
            where: { status: 'ACTIVE' },
            orderBy: { expiryDate: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
    ]);

    // Client-friendly mapping with stock levels
    const formatted = products.map((p) => {
      const inv = p.inventory[0];
      const stock = inv ? inv.onHand : 0;
      const reorder = inv ? inv.reorderPoint : p.reorderPoint;
      let statusTag = 'In Stock';
      if (stock === 0) statusTag = 'Out of Stock';
      else if (stock <= reorder) statusTag = 'Low Stock';

      return {
        ...p,
        stock,
        availableStock: inv ? inv.available : stock,
        reorderPoint: reorder,
        statusTag,
      };
    });

    let filtered = formatted;
    if (stockStatus === 'low') {
      filtered = formatted.filter((p) => p.stock > 0 && p.stock <= p.reorderPoint);
    } else if (stockStatus === 'out') {
      filtered = formatted.filter((p) => p.stock === 0);
    } else if (stockStatus === 'in') {
      filtered = formatted.filter((p) => p.stock > p.reorderPoint);
    }

    return NextResponse.json({
      products: filtered,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'products');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();

    const {
      name,
      shortName,
      description,
      categoryId,
      supplierId,
      sku,
      barcode,
      costPrice,
      sellingPrice,
      wholesalePrice,
      taxRate = 10.0,
      unit = 'pcs',
      isPerishable = false,
      hasBatchTracking = false,
      minStockLevel = 5,
      maxStockLevel = 100,
      reorderPoint = 10,
      shelfLocation,
      initialStock = 0,
      storeId,
    } = body;

    if (!name || !categoryId || !sellingPrice) {
      return NextResponse.json({ error: 'Name, category, and selling price are required' }, { status: 400 });
    }

    // Auto-generate SKU & Barcode if not provided
    const finalSku = sku || `SKU-${Date.now().toString().slice(-6)}`;
    const finalBarcode = barcode || `93${Math.floor(10000000000 + Math.random() * 90000000000)}`;

    // Check duplicate barcode
    const existingBarcode = await prisma.product.findUnique({
      where: { barcode: finalBarcode },
    });
    if (existingBarcode) {
      return NextResponse.json({ error: 'Barcode already exists for another product' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        shortName: shortName || name.slice(0, 30),
        description,
        categoryId,
        supplierId: supplierId || null,
        sku: finalSku,
        barcode: finalBarcode,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice),
        wholesalePrice: wholesalePrice ? Number(wholesalePrice) : null,
        taxRate: Number(taxRate),
        unit,
        isPerishable: Boolean(isPerishable),
        hasBatchTracking: Boolean(hasBatchTracking),
        minStockLevel: Number(minStockLevel),
        maxStockLevel: Number(maxStockLevel),
        reorderPoint: Number(reorderPoint),
        shelfLocation,
        status: 'ACTIVE',
      },
    });

    // Create inventory record for all active stores
    const allStores = await prisma.store.findMany({ where: { isActive: true } });
    for (const st of allStores) {
      const isCurrentStore = storeId ? st.id === storeId : true;
      const initialQty = isCurrentStore ? Number(initialStock) || 0 : 0;

      await prisma.inventory.create({
        data: {
          productId: newProduct.id,
          storeId: st.id,
          onHand: initialQty,
          available: initialQty,
          reserved: 0,
          damaged: 0,
          reorderPoint: Number(reorderPoint),
          maxStock: Number(maxStockLevel),
        },
      });

      if (initialQty > 0) {
        await prisma.inventoryTransaction.create({
          data: {
            productId: newProduct.id,
            storeId: st.id,
            type: 'OPENING',
            quantity: initialQty,
            balanceAfter: initialQty,
            unitCost: Number(costPrice) || 0,
            reason: 'Initial stock intake upon product creation',
            userId: user?.id,
          },
        });
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: 'CREATE',
        module: 'PRODUCTS',
        details: `Created product "${newProduct.name}" (Barcode: ${newProduct.barcode}, Price: $${newProduct.sellingPrice})`,
        storeId: storeId || undefined,
      },
    });

    return NextResponse.json({ success: true, product: newProduct });
  } catch (error: any) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create product' }, { status: 500 });
  }
}
