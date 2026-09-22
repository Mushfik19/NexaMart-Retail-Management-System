import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'nexamart-secret-key-2026';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'STORE_OWNER'
  | 'STORE_MANAGER'
  | 'CASHIER'
  | 'INVENTORY_MANAGER'
  | 'PURCHASING_OFFICER'
  | 'ACCOUNTANT'
  | 'WAREHOUSE_STAFF'
  | 'AUDITOR';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: UserRole;
  storeId?: string | null;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  SUPER_ADMIN: ['all'],
  STORE_OWNER: ['dashboard', 'pos', 'products', 'inventory', 'purchasing', 'sales', 'customers', 'promotions', 'returns', 'register', 'reports', 'expenses', 'settings', 'audit', 'end-of-day'],
  STORE_MANAGER: ['dashboard', 'pos', 'products', 'inventory', 'purchasing', 'sales', 'customers', 'promotions', 'returns', 'register', 'reports', 'expenses', 'end-of-day'],
  CASHIER: ['pos', 'sales', 'customers', 'returns', 'register'],
  INVENTORY_MANAGER: ['dashboard', 'products', 'inventory', 'purchasing', 'reports'],
  PURCHASING_OFFICER: ['dashboard', 'purchasing', 'products', 'inventory'],
  ACCOUNTANT: ['dashboard', 'sales', 'reports', 'expenses', 'audit'],
  WAREHOUSE_STAFF: ['inventory', 'purchasing', 'products'],
  AUDITOR: ['reports', 'sales', 'inventory', 'audit'],
};

export function hasPermission(role: string, module: string): boolean {
  const permissions = ROLE_PERMISSIONS[role as UserRole] || [];
  if (permissions.includes('all')) return true;
  return permissions.includes(module);
}

export function signToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      storeId: user.storeId,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getCurrentUser(req?: NextRequest): Promise<AuthUser | null> {
  try {
    let token: string | undefined;

    if (req) {
      // 1. Check cookies
      token = req.cookies.get('nexamart_token')?.value;
      // 2. Check Authorization header
      if (!token) {
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }
    }

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) return decoded;
    }

    return null;
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}

export async function requirePermission(req: NextRequest, module: string): Promise<AuthUser | Response> {
  const user = await getCurrentUser(req);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!hasPermission(user.role, module)) {
    return new Response(JSON.stringify({ error: 'Forbidden: Insufficient Permissions' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return user;
}
