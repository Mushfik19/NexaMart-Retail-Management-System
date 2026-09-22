import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('nexamart_token')?.value;
  const { pathname } = request.nextUrl;

  const publicPaths = ['/login', '/api/auth/login'];

  // Allow public paths
  if (publicPaths.some(p => pathname.startsWith(p))) {
    // If they have a token and try to hit /login, redirect to /
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Allow static files and next internals
  if (pathname.startsWith('/_next') || pathname.match(/\.(png|jpg|jpeg|svg|ico)$/)) {
    return NextResponse.next();
  }

  // Redirect to login if no token
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Basic Role Authorization based on token payload
  try {
    const payloadPart = token.split('.')[1];
    const decodedStr = Buffer.from(payloadPart, 'base64').toString('utf-8');
    const user = JSON.parse(decodedStr);

    const role = user.role;

    // Route mapping
    const rules: { path: string, allowedRoles: string[] }[] = [
      { path: '/pos', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'CASHIER'] },
      { path: '/sales', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'CASHIER', 'ACCOUNTANT', 'AUDITOR'] },
      { path: '/returns', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'CASHIER'] },
      { path: '/register', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'CASHIER'] },
      { path: '/products', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'INVENTORY_MANAGER', 'PURCHASING_OFFICER', 'WAREHOUSE_STAFF'] },
      { path: '/inventory', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'INVENTORY_MANAGER', 'PURCHASING_OFFICER', 'WAREHOUSE_STAFF'] },
      { path: '/purchasing', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'INVENTORY_MANAGER', 'PURCHASING_OFFICER', 'WAREHOUSE_STAFF'] },
      { path: '/transfers', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'] },
      { path: '/reports', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'ACCOUNTANT', 'AUDITOR', 'INVENTORY_MANAGER'] },
      { path: '/expenses', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'ACCOUNTANT'] },
      { path: '/audit', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'AUDITOR', 'ACCOUNTANT'] },
      { path: '/customers', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER', 'CASHIER'] },
      { path: '/end-of-day', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER', 'STORE_MANAGER'] },
      { path: '/settings', allowedRoles: ['SUPER_ADMIN', 'STORE_OWNER'] },
    ];

    for (const rule of rules) {
      if (pathname.startsWith(rule.path)) {
        if (!rule.allowedRoles.includes(role)) {
          // Instead of a redirect loop, we redirect them to root, which resolves their dashboard
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
  } catch (e) {
    // If token is invalid, clear it and go to login
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete('nexamart_token');
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
