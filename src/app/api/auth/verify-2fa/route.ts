/**
 * POST /api/auth/verify-2fa
 * Second step of authentication: verify 2FA code and issue JWT tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode } from '@/lib/telegram/utils';
import { generateTokenPair, hashSessionToken } from '@/lib/auth/jwt';
import { sendLoginAlert } from '@/lib/telegram/messages';
import { logger } from '@/lib/logger';

interface Verify2FARequest {
  email: string;
  code: string;
  tempSessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: Verify2FARequest = await request.json();
    const { email, code, tempSessionId } = body;

    // Validation
    if (!email || !code || !tempSessionId) {
      return NextResponse.json(
        { error: 'Email и код обязательны' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: 'Код должен состоять из 6 цифр' },
        { status: 400 }
      );
    }

    // Get client IP
    const ipAddress: string = request.headers.get('x-forwarded-for') || 
                              request.headers.get('x-real-ip') || 
                              'unknown';

    // Find user
    const user = await prisma.users.findFirst({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        two_fa_enabled: true,
        telegram_chat_id: true,
      },
    });

    if (!user) {
      logger.warn('2FA verification failed: User not found', { email });
      
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    const pendingSession = await prisma.auth_sessions.findFirst({
      where: { id: tempSessionId, user_id: user.id, is_2fa_verified: false, expires_at: { gt: new Date() } },
      select: { id: true },
    });
    if (!pendingSession) return NextResponse.json({ error: 'Сессия подтверждения истекла. Войдите снова.' }, { status: 401 });

    // Check if user is still active
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: 'Аккаунт заблокирован' },
        { status: 403 }
      );
    }

    // Check if 2FA is enabled
    if (!user.two_fa_enabled || !user.telegram_chat_id) {
      return NextResponse.json(
        { error: '2FA не включен для этого аккаунта' },
        { status: 400 }
      );
    }

    // Verify the code
    const verification = await verifyCode(user.id, code, '2fa_login');

    if (!verification.valid) {
      logger.warn('Invalid 2FA code', { 
        email: user.email, 
        error: verification.error,
        attemptsLeft: verification.attemptsLeft 
      });
      
      return NextResponse.json(
        { 
          error: verification.error,
          attemptsLeft: verification.attemptsLeft,
        },
        { status: 401 }
      );
    }

    // Code is valid - generate tokens
    const sessionId = tempSessionId;
    
    const tokenPayload = {
      userId: user.id,
      email: user.email || '',
      role: user.role,
      sessionId,
    };

    const { accessToken, refreshToken } = await generateTokenPair(tokenPayload);
    await prisma.auth_sessions.update({
      where: { id: tempSessionId },
      data: {
        token: hashSessionToken(refreshToken),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        is_2fa_verified: true,
        last_activity: new Date(),
      },
    });

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
      },
    });

    // Send login notification to Telegram
    await sendLoginAlert(
      user.id,
      ipAddress,
      request.headers.get('user-agent') || 'Unknown device'
    );

    logger.info('2FA verification successful', { email: user.email, role: user.role });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        twoFAEnabled: user.two_fa_enabled,
      },
    });
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60,
      path: '/',
    });
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });
    return response;

  } catch (error) {
    logger.error('2FA verification error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
