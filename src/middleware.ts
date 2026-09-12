/**
 * Next.js Middleware
 * Protects admin routes with JWT authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';

// Routes that require authentication
const protectedPaths = [
  '/admin',
  '/api/admin',
];

// Public auth routes (no authentication needed)
const publicAuthPaths = [
  '/admin/login',
  '/admin/verify-2fa',
  '/api/auth/login',
  '/api/auth/verify-2fa',
];

// API routes that require specific roles
const roleBasedPaths = {
  admin: ['/api/admin/users', '/api/admin/settings'],
  manager: ['/api/admin/menu', '/api/admin/orders'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isPublicAuthPath = publicAuthPaths.some(path => pathname.startsWith(path));

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  if (isPublicAuthPath) {
    return NextResponse.next();
  }

  // Extract token from header or cookie
  let token = extractTokenFromHeader(request.headers.get('authorization'));
  
  // If no Authorization header, try cookie
  if (!token) {
    token = request.cookies.get('accessToken')?.value || null;
  }

  // No token provided
  if (!token) {
    // For API routes, return 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    // For page routes, redirect to login
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const payload = await verifyAccessToken(token);

  if (!payload) {
    // Invalid or expired token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Недействительный или истёкший токен' },
        { status: 401 }
      );
    }

    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    loginUrl.searchParams.set('expired', 'true');
    return NextResponse.redirect(loginUrl);
  }

  // Check role-based access
  for (const [role, paths] of Object.entries(roleBasedPaths)) {
    const requiresRole = paths.some(path => pathname.startsWith(path));
    
    if (requiresRole && payload.role !== role && payload.role !== 'admin') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Недостаточно прав доступа' },
          { status: 403 }
        );
      }

      return NextResponse.redirect(new URL('/admin/forbidden', request.url));
    }
  }

  // Add user info to headers for downstream use
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-email', payload.email);
  response.headers.set('x-user-role', payload.role);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
