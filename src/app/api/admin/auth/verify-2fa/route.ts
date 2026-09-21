/**
 * POST /api/admin/auth/verify-2fa
 * Verify admin 2FA code and create session
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuthSession, generateTokenPair, getTokenExpirySeconds } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { getClientIp, isLoginRateLimited, recordLoginAttempt } from '@/lib/auth/login-attempts';
import { apiError, apiMessage } from '@/lib/api-response';

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
        { error: apiMessage(request, 'emailCodeRequired') },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ipAddress = getClientIp(request);
    if (await isLoginRateLimited(normalizedEmail, ipAddress)) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_2fa_rate_limit_exceeded' });
      return NextResponse.json({ error: apiMessage(request, 'tooManyLoginAttempts') }, { status: 429 });
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: apiMessage(request, 'invalidCodeFormat') },
        { status: 400 }
      );
    }

    // Find admin user
    const user = await prisma.users.findFirst({
      where: { 
        email: normalizedEmail,
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
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_2fa_unknown_user' });
      logger.warn('Admin 2FA verification failed: User not found', { email });
      
      return apiError(request, 'userNotFound', 404);
    }

    // Check if user is still active
    if (user.status !== 'active') {
      return NextResponse.json(
        { error: apiMessage(request, 'accountBlockedShort') },
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
        await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_2fa_expired', userId: user.id });
        logger.warn('Admin 2FA code expired', { email: user.email });
        return NextResponse.json(
          { error: apiMessage(request, 'verificationCodeExpired') },
          { status: 401 },
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
          await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_2fa_attempts_exceeded', userId: user.id });
          return NextResponse.json(
            { 
              error: apiMessage(request, 'verificationAttemptsExceeded'),
              attemptsLeft: 0,
            },
            { status: 401 }
          );
        }

        await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_2fa_invalid_code', userId: user.id });
        return NextResponse.json(
          { 
            error: apiMessage(request, 'verificationCodeInvalid'),
            attemptsLeft,
          },
          { status: 401 }
        );
      }

      logger.warn('Invalid admin 2FA code - no code found', { email: user.email });
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_2fa_invalid_code', userId: user.id });
      
      return NextResponse.json(
        { error: apiMessage(request, 'verificationCodeInvalid') },
        { status: 401 },
      );
    }

    // Check attempts limit
    if (verificationCode.attempts >= 3) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_2fa_attempts_exceeded', userId: user.id });
      return NextResponse.json(
        { error: apiMessage(request, 'verificationAttemptsExceeded') },
        { status: 401 },
      );
    }

    // Code is valid - mark as used
    await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: true, reason: 'admin_authenticated', userId: user.id });
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
    await createAuthSession({ sessionId: tokenPayload.sessionId, userId: user.id, refreshToken, request, is2faVerified: true });

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
      maxAge: getTokenExpirySeconds('access'),
      path: '/',
    });

    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getTokenExpirySeconds('refresh'),
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
    
    return apiError(request, 'server', 500);
  }
}
