import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const module = searchParams.get('module');
    const action = searchParams.get('action');

    const where: any = {};
    if (module && module !== 'all') where.module = module;
    if (action && action !== 'all') where.action = action;

    const logs = await prisma.auditLog.findMany({
      where,
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { fullName: true, username: true, role: true } },
        store: { select: { name: true } },
      },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
