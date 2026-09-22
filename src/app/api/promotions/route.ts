import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

export async function GET() {
  try {
    const promotions = await prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ promotions });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'promotions');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();
    const { name, code, type, value, buyQty, getQty, minSpend, startDate, endDate, usageLimit } = body;

    if (!name || !type || value === undefined) {
      return NextResponse.json({ error: 'Name, type, and discount value required' }, { status: 400 });
    }

    const promo = await prisma.promotion.create({
      data: {
        name,
        code: code ? code.toUpperCase().trim() : null,
        type,
        value: Number(value),
        buyQty: buyQty ? Number(buyQty) : null,
        getQty: getQty ? Number(getQty) : null,
        minSpend: minSpend ? Number(minSpend) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : new Date(Date.now() + 30 * 86400000),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: 'CREATE',
        module: 'PROMOTIONS',
        details: `Created promotion "${promo.name}" (${promo.type}, Value: ${promo.value})`,
      },
    });

    return NextResponse.json({ success: true, promotion: promo });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create promotion' }, { status: 500 });
  }
}
