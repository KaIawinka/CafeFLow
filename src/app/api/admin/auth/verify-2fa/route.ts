/**
 * POST /api/admin/auth/verify-2fa
 * Verify admin 2FA code and create session
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTokenPair } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';
import crypto from 'crypto';

interface Verify2FARequest {
  email: string;
  code: string;
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

    // Find admin user
    const user = await prisma.users.findFirst({
      where: { 
        email: email.toLowerCase(),
        role: 'admin',
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      logger.warn('Admin 2FA verification failed: User not found', { email });
      
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

    // Find valid code
    const verificationCode = await prisma.verification_codes.findFirst({
      where: {
        user_id: user.id,
        code,
        type: 'admin_2fa_login',
        expires_at: { gt: new Date() },
        used_at: null,
      },
      orderBy: { created_at: 'desc' },
    });

    if (!verificationCode) {
      // Check if code exists but expired
      const expiredCode = await prisma.verification_codes.findFirst({
        where: {
          user_id: user.id,
          code,
          type: 'admin_2fa_login',
        },
        orderBy: { created_at: 'desc' },
      });

      if (expiredCode) {
        logger.warn('Admin 2FA code expired', { email: user.email });
        return NextResponse.json(
          { error: 'Код истёк. Запросите новый код.' },
          { status: 401 }
        );
      }

      // Increment attempts
      const recentCode = await prisma.verification_codes.findFirst({
        where: {
          user_id: user.id,
          type: 'admin_2fa_login',
          expires_at: { gt: new Date() },
        },
        orderBy: { created_at: 'desc' },
      });

      if (recentCode) {
        await prisma.verification_codes.update({
          where: { id: recentCode.id },
          data: { attempts: { increment: 1 } },
        });

        const attemptsLeft = Math.max(0, 3 - (recentCode.attempts + 1));

        logger.warn('Invalid admin 2FA code', { 
          email: user.email,
          attemptsLeft 
        });

        if (attemptsLeft === 0) {
          return NextResponse.json(
            { 
              error: 'Превышено количество попыток. Запросите новый код.',
              attemptsLeft: 0,
            },
            { status: 401 }
          );
        }

        return NextResponse.json(
          { 
            error: 'Неверный код',
            attemptsLeft,
          },
          { status: 401 }
        );
      }

      logger.warn('Invalid admin 2FA code - no code found', { email: user.email });
      
      return NextResponse.json(
        { error: 'Неверный код' },
        { status: 401 }
      );
    }

    // Check attempts limit
    if (verificationCode.attempts >= 3) {
      return NextResponse.json(
        { error: 'Превышено количество попыток. Запросите новый код.' },
        { status: 401 }
      );
    }

    // Code is valid - mark as used
    await prisma.verification_codes.update({
      where: { id: verificationCode.id },
      data: { used_at: new Date() },
    });

    // Generate tokens
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
      data: { last_login_at: new Date() },
    });

    logger.info('Admin 2FA verification successful', { email: user.email });

    // Set cookies
    const cookieStore = await cookies();
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
    });

  } catch (error) {
    logger.error('Admin 2FA verification error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
