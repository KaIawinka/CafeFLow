/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */

import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function POST() {
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
      message: payload ? 'Выход выполнен успешно' : 'Сессия уже завершена',
    });

  } catch (error) {
    logger.error('Logout error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
