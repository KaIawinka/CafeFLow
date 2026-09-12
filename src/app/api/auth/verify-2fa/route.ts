/**
 * POST /api/auth/verify-2fa
 * Second step of authentication: verify 2FA code and issue JWT tokens
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode } from '@/lib/telegram/utils';
import { generateTokenPair } from '@/lib/auth/jwt';
import { sendLoginAlert } from '@/lib/telegram/messages';
import crypto from 'crypto';

interface Verify2FARequest {
  email: string;
  code: string;
  tempSessionId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: Verify2FARequest = await request.json();
    const { email, code } = body;

    // Validation
    if (!email || !code) {
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
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Find user
    const user = await prisma.users.findUnique({
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
      console.warn(`❌ 2FA verification failed: User not found - ${email}`);
      
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
      console.warn(`❌ Invalid 2FA code for ${user.email}: ${verification.error}`);
      
      return NextResponse.json(
        { 
          error: verification.error,
          attemptsLeft: verification.attemptsLeft,
        },
        { status: 401 }
      );
    }

    // Code is valid - generate tokens
    const sessionId = crypto.randomUUID();
    
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId,
    };

    const { accessToken, refreshToken } = await generateTokenPair(tokenPayload);

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        last_login_ip: ipAddress,
      },
    });

    // Send login notification to Telegram
    await sendLoginAlert(
      user.id,
      ipAddress,
      request.headers.get('user-agent') || 'Unknown device'
    );

    console.log(`✅ 2FA verification successful for ${user.email}`);

    // Return tokens and user info
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        twoFAEnabled: user.two_fa_enabled,
      },
    });

  } catch (error) {
    console.error('❌ 2FA verification error:', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
