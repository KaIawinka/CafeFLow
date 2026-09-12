/**
 * Next.js Middleware
 * Route protection with role-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';

// User roles hierarchy (lower index = higher privileges)
type UserRole = 'guest' | 'customer' | 'employee' | 'kitchen' | 'manager' | 'admin';

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 5,
  manager: 4,
  kitchen: 3,
  employee: 2,
  customer: 1,
  guest: 0,
};

// Public routes (no authentication needed)
const publicPaths = [
  '/',
  '/ru',
  '/en',
  '/kg',
  '/login',
  '/register',
  '/api/auth/login',
  '/api/auth/register',
  '/api/telegram/webhook',
];

// Route access control by role
const protectedRoutes: Record<string, UserRole> = {
  '/admin': 'admin',
  '/manager': 'manager',
  '/kitchen': 'kitchen',
  '/employee': 'employee',
  '/profile': 'customer', // Минимум customer для доступа к профилю
};

/**
 * Check if user role has sufficient privileges
 */
function hasAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get required role for a given pathname
 */
function getRequiredRole(pathname: string): UserRole | null {
  for (const [route, role] of Object.entries(protectedRoutes)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      return role;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Check if it's a public path
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('accessToken')?.value;

  // Determine required role for this route
  const requiredRole = getRequiredRole(pathname);

  // No token - redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Verify token
  const payload = await verifyAccessToken(token);

  if (!payload) {
    // Invalid token - clear cookies and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    return response;
  }

  // Check if user needs admin approval
  if (payload.requiresApproval && pathname !== '/profile') {
    const response = NextResponse.redirect(new URL('/profile', request.url));
    return response;
  }

  // Check role-based access
  if (requiredRole) {
    if (!hasAccess(payload.role as UserRole, requiredRole)) {
      // Access denied - show error page or redirect
      const errorUrl = new URL('/access-denied', request.url);
      errorUrl.searchParams.set('required', requiredRole);
      errorUrl.searchParams.set('current', payload.role);
      return NextResponse.redirect(errorUrl);
    }
  }

  // Token is valid and user has access - allow request
  const response = NextResponse.next();
  response.headers.set('x-user-id', payload.userId);
  response.headers.set('x-user-email', payload.email);
  response.headers.set('x-user-role', payload.role);
  response.headers.set('x-user-status', payload.status || 'active');

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
