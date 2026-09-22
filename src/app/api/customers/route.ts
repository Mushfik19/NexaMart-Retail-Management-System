import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim() || '';

    const where: any = { isActive: true };
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { phone: { contains: query } },
        { email: { contains: query } },
        { membershipNo: { contains: query } },
      ];
    }

    const customers = await prisma.customer.findMany({
      where,
      take: 50,
      orderBy: { totalSpending: 'desc' },
      include: {
        _count: { select: { sales: true } },
      },
    });

    return NextResponse.json({ customers });
  } catch (error: any) {
    console.error('Fetch customers error:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'customers');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();

    const { name, phone, email, address, customerType = 'REGULAR', notes } = body;

    if (!name) {
      return NextResponse.json({ error: 'Customer name is required' }, { status: 400 });
    }

    // Auto-generate membership card number
    const count = await prisma.customer.count();
    const membershipNo = `MEM-${1000 + count + 1}`;

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: phone || null,
        email: email || null,
        address: address || null,
        membershipNo,
        customerType,
        loyaltyTier: 'BRONZE',
        pointsBalance: 50, // Welcome 50 points bonus
        totalSpending: 0,
        notes,
      },
    });

    await prisma.loyaltyTransaction.create({
      data: {
        customerId: customer.id,
        type: 'EARN',
        points: 50,
        balanceAfter: 50,
        reason: 'Welcome bonus on membership registration',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: 'CREATE',
        module: 'CUSTOMERS',
        details: `Registered customer "${customer.name}" (${customer.membershipNo}) with 50 welcome loyalty pts`,
      },
    });

    return NextResponse.json({ success: true, customer });
  } catch (error: any) {
    console.error('Create customer error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create customer' }, { status: 500 });
  }
}
