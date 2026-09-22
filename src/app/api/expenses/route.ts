import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');

    const expenses = await prisma.expense.findMany({
      where: storeId ? { storeId } : {},
      include: {
        user: { select: { fullName: true } },
        store: { select: { name: true } },
      },
      orderBy: { expenseDate: 'desc' },
    });

    const total = expenses.reduce((acc, e) => acc + e.amount, 0);

    return NextResponse.json({
      expenses,
      total: Number(total.toFixed(2)),
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'expenses');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();
    const { storeId, category, amount, description, paymentMethod } = body;

    if (!storeId || !category || !amount || !description) {
      return NextResponse.json({ error: 'Store, category, amount and description are required' }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        storeId,
        userId: user?.id || 'system',
        category,
        amount: Number(amount),
        description,
        paymentMethod: paymentMethod || 'CASH',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: 'CREATE',
        module: 'EXPENSES',
        details: `Recorded expense $${expense.amount.toFixed(2)} (${expense.category}): ${expense.description}`,
        storeId,
      },
    });

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to record expense' }, { status: 500 });
  }
}
