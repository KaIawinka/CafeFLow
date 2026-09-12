/**
 * GET /api/auth/session
 * Verify current JWT token and return user session info
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';

export async function GET(request: NextRequest) {
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
        { error: 'Недействительный или истёкший токен' },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        role: true,
        status: true,
        two_fa_enabled: true,
        telegram_chat_id: true,
        last_login_at: true,
        created_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Check if user is still active
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Аккаунт заблокирован' },
        { status: 403 }
      );
    }

    // Return user session info
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone_number,
        role: user.role,
        status: user.status,
        twoFAEnabled: user.two_fa_enabled,
        telegramLinked: !!user.telegram_chat_id,
        lastLoginAt: user.last_login_at,
        createdAt: user.created_at,
      },
      session: {
        sessionId: payload.sessionId,
        expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null,
      },
    });

  } catch (error) {
    console.error('❌ Session check error:', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
