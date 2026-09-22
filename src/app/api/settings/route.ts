import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, requirePermission } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return NextResponse.json({ settings: settingsMap, raw: settings });
  } catch (error: any) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userOrRes = await requirePermission(req, 'settings');
    if (userOrRes instanceof Response) return userOrRes;
    const user = userOrRes;
    const body = await req.json();

    for (const [key, value] of Object.entries(body)) {
      await prisma.setting.upsert({
        where: { key },
        create: {
          key,
          value: String(value),
          category: 'GENERAL',
        },
        update: {
          value: String(value),
        },
      });
    }

    await prisma.auditLog.create({
      data: {
        userId: user?.id,
        action: 'UPDATE',
        module: 'SETTINGS',
        details: 'Updated store configuration parameters',
      },
    });

    return NextResponse.json({ success: true, message: 'Settings saved' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 });
  }
}
