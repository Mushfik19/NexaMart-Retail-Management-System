import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = await getCurrentUser(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId') || auth.storeId;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Find active store day
    const activeDay = await prisma.storeDay.findFirst({
      where: {
        storeId,
        status: 'OPEN',
      },
      include: {
        openedBy: true,
      },
    });

    if (!activeDay) {
      // Find last closed day to show previous metrics
      const lastDay = await prisma.storeDay.findFirst({
        where: { storeId, status: 'CLOSED' },
        orderBy: { closedAt: 'desc' },
        include: { openedBy: true, closedBy: true },
      });
      return NextResponse.json({ activeDay: null, lastDay });
    }

    // Calculate metrics for active day
    // We look at all shifts opened since activeDay.openedAt
    const shifts = await prisma.shift.findMany({
      where: {
        storeId,
        startTime: { gte: activeDay.openedAt },
      },
      include: {
        user: true,
        register: true,
      }
    });

    // Calculate live metrics by aggregating sales since openedAt
    const sales = await prisma.sale.findMany({
      where: {
        storeId,
        createdAt: { gte: activeDay.openedAt },
        status: 'COMPLETED'
      },
      include: {
        payments: true
      }
    });

    const refunds = await prisma.refund.findMany({
      where: {
        sale: { storeId },
        createdAt: { gte: activeDay.openedAt },
      },
    });

    let grossSales = 0;
    let netSales = 0;
    let taxTotal = 0;
    let discountsTotal = 0;
    let cashSales = 0;
    let cardSales = 0;

    sales.forEach(sale => {
      const discountTotal = sale.itemDiscount + sale.orderDiscount;
      grossSales += sale.grandTotal + discountTotal;
      netSales += sale.grandTotal;
      taxTotal += sale.taxAmount;
      discountsTotal += discountTotal;

      sale.payments.forEach(p => {
        if (p.method === 'CASH') cashSales += p.amount;
        if (p.method === 'CARD' || p.method === 'EFTPOS' || p.method === 'CREDIT_CARD' || p.method === 'DEBIT_CARD') cardSales += p.amount;
      });
    });

    let refundsTotal = 0;
    refunds.forEach(r => refundsTotal += r.totalRefunded);
    
    // Calculate expected cash from shifts
    let expectedCash = 0;
    let actualCash = 0;
    let cashDifference = 0;
    let allShiftsClosed = true;

    shifts.forEach(s => {
      if (s.status === 'OPEN') allShiftsClosed = false;
      expectedCash += (s.expectedCash || 0);
      if (s.status === 'CLOSED') {
        actualCash += (s.closingCash || 0);
        cashDifference += (s.cashDifference || 0);
      }
    });

    return NextResponse.json({
      activeDay,
      shifts,
      metrics: {
        grossSales,
        netSales,
        taxTotal,
        discountsTotal,
        cashSales,
        cardSales,
        refundsTotal,
        expectedCash,
        actualCash,
        cashDifference,
        transactions: sales.length,
        allShiftsClosed
      }
    });

  } catch (error: any) {
    console.error('StoreDay GET Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getCurrentUser(req);
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (auth.role !== 'SUPER_ADMIN' && auth.role !== 'STORE_OWNER' && auth.role !== 'STORE_MANAGER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, storeId, notes, metrics } = body;

    if (!storeId) return NextResponse.json({ error: 'Store ID required' }, { status: 400 });

    if (action === 'OPEN_DAY') {
      const existing = await prisma.storeDay.findFirst({
        where: { storeId, status: 'OPEN' }
      });
      if (existing) {
        return NextResponse.json({ error: 'Business day is already open' }, { status: 400 });
      }

      const day = await prisma.storeDay.create({
        data: {
          storeId,
          openedById: auth.id,
          status: 'OPEN',
          notes
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: auth.id,
          storeId,
          action: 'REGISTER_OPEN', // using existing enum value
          module: 'REGISTER',
          details: `Opened business day for store`
        }
      });

      return NextResponse.json({ success: true, day });
    }

    if (action === 'CLOSE_DAY') {
      const activeDay = await prisma.storeDay.findFirst({
        where: { storeId, status: 'OPEN' }
      });
      if (!activeDay) {
        return NextResponse.json({ error: 'No active business day found' }, { status: 400 });
      }

      // Ensure no shifts are open
      const openShifts = await prisma.shift.count({
        where: { storeId, startTime: { gte: activeDay.openedAt }, status: 'OPEN' }
      });

      if (openShifts > 0) {
        return NextResponse.json({ error: `Cannot close day. ${openShifts} registers are still open.` }, { status: 400 });
      }

      const day = await prisma.storeDay.update({
        where: { id: activeDay.id },
        data: {
          status: 'CLOSED',
          closedAt: new Date(),
          closedById: auth.id,
          notes,
          grossSales: metrics.grossSales,
          netSales: metrics.netSales,
          taxTotal: metrics.taxTotal,
          refundsTotal: metrics.refundsTotal,
          discountsTotal: metrics.discountsTotal,
          cashSales: metrics.cashSales,
          cardSales: metrics.cardSales,
          expectedCash: metrics.expectedCash,
          actualCash: metrics.actualCash,
          cashDifference: metrics.cashDifference,
          transactions: metrics.transactions,
        }
      });

      await prisma.auditLog.create({
        data: {
          userId: auth.id,
          storeId,
          action: 'REGISTER_CLOSE',
          module: 'REGISTER',
          details: `Closed business day. Net Sales: ${metrics.netSales}`
        }
      });

      return NextResponse.json({ success: true, day });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('StoreDay POST Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
