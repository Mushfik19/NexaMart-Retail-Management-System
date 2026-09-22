import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

// GET: Current shift status, registers, cash movements
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const storeId = searchParams.get('storeId');
    const registerId = searchParams.get('registerId');

    const registers = await prisma.cashRegister.findMany({
      where: {
        ...(storeId ? { storeId } : {}),
        isActive: true,
      },
      include: {
        store: true,
      },
    });

    const activeShift = await prisma.shift.findFirst({
      where: {
        ...(registerId ? { registerId } : storeId ? { storeId } : {}),
        status: 'OPEN',
      },
      include: {
        register: true,
        user: { select: { fullName: true, username: true } },
        cashMovements: {
          include: { user: { select: { fullName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    // If active shift, calculate sales totals
    let shiftMetrics = null;
    if (activeShift) {
      const sales = await prisma.sale.findMany({
        where: {
          shiftId: activeShift.id,
          status: 'COMPLETED',
        },
        include: { payments: true },
      });

      let cashSales = 0;
      let cardSales = 0;
      let totalSales = 0;

      for (const s of sales) {
        totalSales += s.grandTotal;
        for (const p of s.payments) {
          if (p.method === 'CASH') cashSales += p.amount;
          else cardSales += p.amount;
        }
      }

      // Cash in / Cash out
      let cashInTotal = 0;
      let cashOutTotal = 0;
      for (const m of activeShift.cashMovements) {
        if (m.type === 'CASH_IN' || m.type === 'FLOAT_ADD') cashInTotal += m.amount;
        if (m.type === 'CASH_OUT' || m.type === 'PAYOUT') cashOutTotal += m.amount;
      }

      const expectedCash = activeShift.openingCash + cashSales + (cashInTotal - activeShift.openingCash) - cashOutTotal;

      shiftMetrics = {
        totalSales: Number(totalSales.toFixed(2)),
        cashSales: Number(cashSales.toFixed(2)),
        cardSales: Number(cardSales.toFixed(2)),
        cashInTotal: Number(cashInTotal.toFixed(2)),
        cashOutTotal: Number(cashOutTotal.toFixed(2)),
        openingCash: activeShift.openingCash,
        expectedCash: Number(expectedCash.toFixed(2)),
        transactionsCount: sales.length,
      };
    }

    // Past closed shifts
    const recentShifts = await prisma.shift.findMany({
      where: {
        status: 'CLOSED',
        ...(storeId ? { storeId } : {}),
      },
      take: 10,
      orderBy: { endTime: 'desc' },
      include: {
        user: { select: { fullName: true } },
        register: true,
      },
    });

    return NextResponse.json({
      registers,
      activeShift,
      shiftMetrics,
      recentShifts,
    });
  } catch (error: any) {
    console.error('Fetch register error:', error);
    return NextResponse.json({ error: 'Failed to fetch register data' }, { status: 500 });
  }
}

// POST: Actions: 'OPEN_SHIFT', 'CASH_MOVEMENT', 'CLOSE_SHIFT'
export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'register');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();
    const { action } = body;

    // 1. OPEN SHIFT
    if (action === 'OPEN_SHIFT') {
      const { registerId, storeId, openingCash, notes } = body;

      // Check if already open
      const existing = await prisma.shift.findFirst({
        where: { registerId, status: 'OPEN' },
      });
      if (existing) {
        return NextResponse.json({ error: 'This register already has an active open shift' }, { status: 400 });
      }

      const floatAmount = Number(openingCash || 0);

      const shift = await prisma.shift.create({
        data: {
          registerId,
          storeId,
          userId: user?.id || 'system',
          openingCash: floatAmount,
          status: 'OPEN',
          notes,
        },
      });

      await prisma.cashRegister.update({
        where: { id: registerId },
        data: { currentShiftId: shift.id },
      });

      await prisma.cashMovement.create({
        data: {
          shiftId: shift.id,
          userId: user?.id || 'system',
          type: 'FLOAT_ADD',
          amount: floatAmount,
          reason: 'Shift opening cash float',
        },
      });

      await prisma.auditLog.create({
        data: {
          userId: user?.id,
          action: 'REGISTER_OPEN',
          module: 'REGISTER',
          details: `Opened shift on register with $${floatAmount.toFixed(2)} cash float`,
          storeId,
        },
      });

      return NextResponse.json({ success: true, shift });
    }

    // 2. CASH IN / CASH OUT
    if (action === 'CASH_MOVEMENT') {
      const { shiftId, type, amount, reason } = body;
      // type: 'CASH_IN' | 'CASH_OUT' | 'PAYOUT'

      const movement = await prisma.cashMovement.create({
        data: {
          shiftId,
          userId: user?.id || 'system',
          type,
          amount: Number(amount),
          reason,
        },
      });

      return NextResponse.json({ success: true, movement });
    }

    // 3. CLOSE SHIFT
    if (action === 'CLOSE_SHIFT') {
      const { shiftId, actualCash, notes } = body;

      const shift = await prisma.shift.findUnique({
        where: { id: shiftId },
        include: { cashMovements: true },
      });

      if (!shift) {
        return NextResponse.json({ error: 'Shift not found' }, { status: 404 });
      }

      // Compute sales and cash in/out
      const sales = await prisma.sale.findMany({
        where: { shiftId, status: 'COMPLETED' },
        include: { payments: true },
      });

      let cashSales = 0;
      for (const s of sales) {
        for (const p of s.payments) {
          if (p.method === 'CASH') cashSales += p.amount;
        }
      }

      let cashIn = 0;
      let cashOut = 0;
      for (const m of shift.cashMovements) {
        if (m.type === 'CASH_IN') cashIn += m.amount;
        if (m.type === 'CASH_OUT' || m.type === 'PAYOUT') cashOut += m.amount;
      }

      const expectedCash = shift.openingCash + cashSales + cashIn - cashOut;
      const actual = Number(actualCash);
      const diff = Number((actual - expectedCash).toFixed(2));

      const closed = await prisma.shift.update({
        where: { id: shiftId },
        data: {
          endTime: new Date(),
          closingCash: actual,
          expectedCash: Number(expectedCash.toFixed(2)),
          cashDifference: diff,
          status: 'CLOSED',
          notes,
        },
      });

      await prisma.cashRegister.update({
        where: { id: shift.registerId },
        data: { currentShiftId: null },
      });

      await prisma.auditLog.create({
        data: {
          userId: user?.id,
          action: 'REGISTER_CLOSE',
          module: 'REGISTER',
          details: `Closed shift. Expected: $${expectedCash.toFixed(2)}, Actual: $${actual.toFixed(2)}, Diff: ${diff >= 0 ? `+$${diff.toFixed(2)} (Overage)` : `-$${Math.abs(diff).toFixed(2)} (Shortage)`}`,
          storeId: shift.storeId,
        },
      });

      return NextResponse.json({
        success: true,
        shift: closed,
        summary: {
          openingCash: shift.openingCash,
          cashSales,
          expectedCash: Number(expectedCash.toFixed(2)),
          actualCash: actual,
          difference: diff,
          isBalanced: Math.abs(diff) < 0.01,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Register action error:', error);
    return NextResponse.json({ error: error.message || 'Register operation failed' }, { status: 500 });
  }
}
