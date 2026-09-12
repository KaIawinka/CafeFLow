/**
 * POST /api/auth/logout
 * Logout user and invalidate session
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';

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

    // In a production system, you would:
    // 1. Add token to blacklist (Redis/Database)
    // 2. Delete session from session store
    // 3. Log the logout event
    
    // For now, we'll just log it
    console.log(`✅ User logged out: ${payload.email} (session: ${payload.sessionId})`);

    // Optional: Add to token blacklist
    // await addToBlacklist(token, payload.exp);

    return NextResponse.json({
      success: true,
      message: 'Выход выполнен успешно',
    });

  } catch (error) {
    console.error('❌ Logout error:', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
