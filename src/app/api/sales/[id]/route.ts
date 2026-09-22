import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sale = await prisma.sale.findFirst({
      where: {
        OR: [{ id }, { receiptNumber: id }],
      },
      include: {
        items: true,
        payments: true,
        customer: true,
        user: { select: { fullName: true, username: true } },
        store: true,
        register: true,
        refunds: { include: { items: true } },
      },
    });

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    return NextResponse.json({ sale });
  } catch (error: any) {
    console.error('Fetch sale error:', error);
    return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 });
  }
}
