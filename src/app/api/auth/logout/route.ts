/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Токен не предоставлен' },
        { status: 401 }
      );
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
