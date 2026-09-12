/**
 * Next.js Middleware
 *
 * NOTE:
 * This middleware must stay edge-safe. It must not import Prisma,
 * PostgreSQL adapters, pg, crypto, or JWT verification helpers,
 * otherwise Next.js edge bundling will pull in Node.js runtime modules
 * and fail with:
 *   "The edge runtime does not support Node.js 'crypto' module"
 *   or "Failed to load external module node:util/types"
 */

import { NextRequest, NextResponse } from 'next/server';

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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.some(path =>
    pathname === path || pathname.startsWith(path + '/')
  );

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Do not perform DB/JWT checks in edge middleware.
  // Route-level auth stays in API/server route handlers and page loaders.
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};
