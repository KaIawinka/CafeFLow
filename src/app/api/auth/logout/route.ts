/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */

import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;

    if (!token) {
      cookieStore.delete('accessToken');
      cookieStore.delete('refreshToken');
      return NextResponse.json({ success: true, message: 'Сессия уже завершена' });
    }

    // Verify JWT token
    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный токен' },
        { status: 401 }
      );
    }

    logger.info('User logged out', { 
      email: payload.email, 
      sessionId: payload.sessionId 
    });

    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');

    return NextResponse.json({
      success: true,
      message: 'Выход выполнен успешно',
    });

  } catch (error) {
    logger.error('Logout error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
