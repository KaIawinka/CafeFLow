/**
 * POST /api/auth/login
 * First step of authentication: verify email/password and send 2FA code if enabled
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createVerificationCode, checkCodeGenerationRateLimit } from '@/lib/telegram/utils';
import { sendVerificationCode } from '@/lib/telegram/messages';
import { generateTokenPair } from '@/lib/auth/jwt';
import crypto from 'crypto';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Get client IP for logging
    const ipAddress: string = request.headers.get('x-forwarded-for') || 
                              request.headers.get('x-real-ip') || 
                              'unknown';

    // Find user by email
    const user = await prisma.users.findFirst({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        email: true,
        password_hash: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        two_fa_enabled: true,
        telegram_chat_id: true,
        last_login_at: true,
      },
    });

    // User not found
    if (!user) {
      // Log failed attempt
      console.warn(`❌ Login failed: User not found - ${email} from ${ipAddress}`);
      
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      console.warn(`❌ Login failed: User inactive - ${email}`);
      
      return NextResponse.json(
        { error: 'Аккаунт заблокирован. Обратитесь к администратору.' },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password_hash) {
      console.warn(`❌ Login failed: No password hash - ${email}`);
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      console.warn(`❌ Login failed: Invalid password - ${email} from ${ipAddress}`);
      
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Password is correct
    console.log(`✅ Password verified for ${user.email}`);

    // Check if 2FA is enabled
    if (user.two_fa_enabled && user.telegram_chat_id) {
      // Check rate limit
      const rateLimitCheck = await checkCodeGenerationRateLimit(user.id);
      
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          { error: rateLimitCheck.error },
          { status: 429 }
        );
      }

      // Generate verification code
      const verificationCode = await createVerificationCode(
        user.id,
        '2fa_login',
        ipAddress
      );

      // Send code via Telegram
      const sent = await sendVerificationCode(
        user.id,
        verificationCode,
        5 // 5 minutes expiry
      );

      if (!sent) {
        console.error(`❌ Failed to send 2FA code to user ${user.id}`);
        
        return NextResponse.json(
          { error: 'Не удалось отправить код подтверждения. Попробуйте позже.' },
          { status: 500 }
        );
      }

      // Generate temporary session ID for 2FA verification
      const tempSessionId = crypto.randomUUID();

      // Store temp session in memory or database (optional)
      // For now, we'll just return it to the client

      console.log(`📱 2FA code sent to Telegram for ${user.email}`);

      return NextResponse.json({
        requires2FA: true,
        tempSessionId,
        message: 'Код подтверждения отправлен в Telegram',
        expiresInMinutes: 5,
      });
    }

    // No 2FA required - generate tokens immediately
    const tokenPayload = {
      userId: user.id,
      email: user.email || '',
      role: user.role,
      sessionId: crypto.randomUUID(),
    };

    const { accessToken, refreshToken } = await generateTokenPair(tokenPayload);

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
      },
    });

    console.log(`✅ User logged in without 2FA: ${user.email}`);

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
    console.error('❌ Login error:', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
