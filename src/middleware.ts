/**
 * Next.js Middleware
 * Route protection with role-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';

// Public routes (no authentication needed)
const publicPaths = [
  '/',
  '/ru',
  '/en',
  '/kg',
  '/admin/login',
  '/api/admin/auth/login',
  '/api/admin/auth/verify-2fa',
  '/api/telegram/webhook',
  '/api/telegram/setup',
];

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

  // No token - redirect to appropriate login
  if (!token) {
    if (pathname.startsWith('/admin')) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
    
    // For other protected routes (future customer area)
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Verify token
  const payload = await verifyAccessToken(token);

  if (!payload) {
    // Invalid token - clear cookies and redirect
    const response = NextResponse.redirect(
      pathname.startsWith('/admin') 
        ? new URL('/admin/login', request.url)
        : new URL('/', request.url)
    );
    
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    
    return response;
  }

  // Check role-based access
  if (pathname.startsWith('/admin')) {
    // Admin routes require admin role
    if (payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Token is valid - allow access
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
