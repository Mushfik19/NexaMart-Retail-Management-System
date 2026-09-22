import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser, signToken, UserRole } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authUser = await getCurrentUser(req);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      include: {
        store: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: user.id,
        status: 'OPEN',
      },
      include: {
        register: true,
      },
    });

    // All available stores for switching
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        storeId: user.storeId,
      },
      store: user.store || stores[0],
      stores,
      activeShift,
    });
  } catch (error: any) {
    console.error('Me endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Switch user route for rapid role testing in UI
export async function POST(req: NextRequest) {
  try {
    const { role, storeId } = await req.json();

    const targetUser = await prisma.user.findFirst({
      where: { role: role.toUpperCase() },
      include: { store: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: `User with role ${role} not found` }, { status: 404 });
    }

    const authUser = {
      id: targetUser.id,
      email: targetUser.email,
      username: targetUser.username,
      fullName: targetUser.fullName,
      role: targetUser.role as UserRole,
      storeId: storeId || targetUser.storeId,
    };

    const token = signToken(authUser);

    const activeShift = await prisma.shift.findFirst({
      where: {
        userId: targetUser.id,
        status: 'OPEN',
      },
      include: {
        register: true,
      },
    });

    const response = NextResponse.json({
      success: true,
      user: authUser,
      store: targetUser.store,
      activeShift,
      token,
    });

    response.cookies.set('nexamart_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Switch user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
