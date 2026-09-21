/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { apiError, apiMessage } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    const payload = token ? await verifyAccessToken(token) : null;
    if (payload?.sessionId) {
      await prisma.auth_sessions.deleteMany({ where: { id: payload.sessionId, user_id: payload.userId } });
      logger.info('User logged out', { email: payload.email, sessionId: payload.sessionId });
    }

    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');

    return NextResponse.json({
      success: true,
      message: apiMessage(request, payload ? 'logoutSuccess' : 'sessionAlreadyEnded'),
    });

  } catch (error) {
    logger.error('Logout error', error);
    
    return apiError(request, 'server', 500);
  }
}
