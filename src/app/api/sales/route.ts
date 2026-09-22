import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const query = searchParams.get('q')?.trim() || '';
    const dateRange = searchParams.get('dateRange'); // 'today', 'yesterday', 'week', 'month'

    const where: any = {};
    if (storeId) where.storeId = storeId;

    if (query) {
      where.OR = [
        { receiptNumber: { contains: query } },
        { invoiceNumber: { contains: query } },
        { customer: { name: { contains: query } } },
        { customer: { phone: { contains: query } } },
      ];
    }

    const now = new Date();
    if (dateRange === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: startOfDay };
    } else if (dateRange === 'yesterday') {
      const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const endOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: startOfYesterday, lt: endOfYesterday };
    } else if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      where.createdAt = { gte: weekAgo };
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 86400000);
      where.createdAt = { gte: monthAgo };
    }

    const sales = await prisma.sale.findMany({
      where,
      take: 50,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true, phone: true } },
        user: { select: { fullName: true, username: true } },
        payments: true,
        items: true,
        store: true,
      },
    });

    return NextResponse.json({ sales });
  } catch (error: any) {
    console.error('Fetch sales error:', error);
    return NextResponse.json({ error: 'Failed to fetch sales history' }, { status: 500 });
  }
}
