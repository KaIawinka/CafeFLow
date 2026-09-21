/**
 * POST /api/admin/auth/logout
 * Logout admin and clear session cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { apiError, getRequestLocale } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    const payload = token ? await verifyAccessToken(token) : null;
    if (payload?.sessionId) await prisma.auth_sessions.deleteMany({ where: { id: payload.sessionId, user_id: payload.userId } });
    
    // Clear auth cookies
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');

    logger.info('Admin logged out');

    const locale = getRequestLocale(request);
    return NextResponse.redirect(new URL(`/${locale}/admin/login`, process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin));
  } catch (error) {
    logger.error('Logout error', error);
    
    return apiError(request, 'server', 500);
  }
}
