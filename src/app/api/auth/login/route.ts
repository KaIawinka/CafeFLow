/**
 * POST /api/auth/login
 * First step of authentication: verify email/password and send 2FA code if enabled
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { createVerificationCode, checkCodeGenerationRateLimit } from '@/lib/telegram/utils';
import { sendVerificationCode } from '@/lib/telegram/messages';
import { createAuthSession, generateTokenPair, getTokenExpirySeconds, hashSessionToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { isRecaptchaEnabled, verifyRecaptcha } from '@/lib/recaptcha';
import { getClientIp, isLoginRateLimited, recordLoginAttempt } from '@/lib/auth/login-attempts';
import { apiError, apiMessage } from '@/lib/api-response';

interface LoginRequest {
  email: string;
  password: string;
  recaptchaToken?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password, recaptchaToken } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: apiMessage(request, 'emailPasswordRequired') },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA in production when it is configured.
    if (process.env.NODE_ENV === 'production' && isRecaptchaEnabled()) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken || '', 'login');
      if (!recaptchaResult.success) {
        logger.warn('Login blocked by reCAPTCHA', { 
          email, 
          score: recaptchaResult.score 
        });
        return NextResponse.json(
          { error: apiMessage(request, 'securityCheckFailed') },
          { status: 403 }
        );
      }
      logger.info('reCAPTCHA passed for login', { 
        email, 
        score: recaptchaResult.score 
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const ipAddress = getClientIp(request);
    if (await isLoginRateLimited(normalizedEmail, ipAddress)) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'rate_limit_exceeded' });
      return NextResponse.json({ error: apiMessage(request, 'tooManyLoginAttempts') }, { status: 429 });
    }

    // Find user by email
    const user = await prisma.users.findFirst({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        password_hash: true,
        first_name: true,
        last_name: true,
        display_name: true,
        avatar_file_id: true,
        role: true,
        status: true,
        two_fa_enabled: true,
        telegram_chat_id: true,
        email_verified_at: true,
        requires_approval: true,
        last_login_at: true,
      },
    });

    // User not found
    if (!user) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'invalid_credentials' });
      logger.warn('Login failed: User not found', { email, ipAddress });
      
      return NextResponse.json(
        { error: apiMessage(request, 'invalidCredentials') },
        { status: 401 }
      );
    }

    // Email verification is required before the first login.
    if (user.status === 'pending' && !user.email_verified_at) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'email_not_verified', userId: user.id });
      return NextResponse.json(
        { error: apiMessage(request, 'emailVerificationRequired') },
        { status: 403 }
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'account_inactive', userId: user.id });
      logger.warn('Login failed: User inactive', { email, status: user.status });
      
      return NextResponse.json(
        { error: apiMessage(request, 'accountBlocked') },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password_hash) {
      logger.warn('Login failed: No password hash', { email });
      return NextResponse.json(
        { error: apiMessage(request, 'invalidCredentials') },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'invalid_credentials', userId: user.id });
      logger.warn('Login failed: Invalid password', { email, ipAddress });
      
      return NextResponse.json(
        { error: apiMessage(request, 'invalidCredentials') },
        { status: 401 }
      );
    }

    // Password is correct
    await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: true, reason: user.two_fa_enabled && user.telegram_chat_id ? '2fa_required' : 'authenticated', userId: user.id });
    logger.info('Password verified', { email: user.email });

    // Check if 2FA is enabled and Telegram is connected
    if (user.two_fa_enabled && user.telegram_chat_id) {
      // Check rate limit
      const rateLimitCheck = await checkCodeGenerationRateLimit(user.id);
      
      if (!rateLimitCheck.allowed) {
        return NextResponse.json(
          { error: apiMessage(request, 'codeRateLimited', { minutes: 5 }) },
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
      try {
        const sent = await sendVerificationCode(
          user.id,
          verificationCode,
          5 // 5 minutes expiry
        );

        if (!sent.success) {
          logger.error('Failed to send 2FA code', undefined, { userId: user.id });
          
          // In development, allow login without 2FA if Telegram fails
          if (process.env.NODE_ENV === 'development') {
            logger.warn('Telegram 2FA bypassed in development mode', { userId: user.id });
            console.log('\n⚠️  2FA bypassed (Telegram unavailable in dev mode)\n');
            // Continue to generate tokens below
          } else {
            return NextResponse.json(
              { error: apiMessage(request, 'verificationSendFailed') },
              { status: 500 }
            );
          }
        } else {
          // Generate temporary session ID for 2FA verification
          const tempSessionId = crypto.randomUUID();
          await prisma.auth_sessions.create({
            data: {
              id: tempSessionId,
              user_id: user.id,
              token: hashSessionToken(crypto.randomUUID()),
              expires_at: new Date(Date.now() + 5 * 60 * 1000),
              ip_address: ipAddress.split(',')[0]?.trim() || null,
              user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
              is_2fa_verified: false,
            },
          });

          logger.info('2FA code sent to Telegram', { email: user.email });

          return NextResponse.json({
            requires2FA: true,
            tempSessionId,
            message: apiMessage(request, 'twoFaCodeSent'),
            expiresInMinutes: 5,
          });
        }
      } catch (telegramError) {
        logger.error('Telegram 2FA error', telegramError);
        
        // In development, allow login without 2FA if Telegram fails
        if (process.env.NODE_ENV === 'development') {
          logger.warn('Telegram 2FA bypassed due to error in development', { userId: user.id });
          console.log('\n⚠️  2FA bypassed (Telegram error in dev mode)\n');
          // Continue to generate tokens below
        } else {
          return NextResponse.json(
            { error: apiMessage(request, 'codeSendError') },
            { status: 500 }
          );
        }
      }
    }

    // No 2FA required - generate tokens immediately
    const tokenPayload = {
      userId: user.id,
      email: user.email || '',
      role: user.role,
      status: user.status,
      requiresApproval: user.requires_approval,
      sessionId: crypto.randomUUID(),
    };

    const { accessToken, refreshToken } = await generateTokenPair(tokenPayload);
    await createAuthSession({ sessionId: tokenPayload.sessionId, userId: user.id, refreshToken, request });

    // Update last login and last seen
    await prisma.users.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        last_seen_at: new Date(),
      },
    });

    logger.info('User logged in without 2FA', { email: user.email, role: user.role });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name,
        avatarFileId: user.avatar_file_id,
        role: user.role,
        status: user.status,
        requiresApproval: user.requires_approval,
        twoFAEnabled: user.two_fa_enabled,
      },
    });
    response.cookies.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getTokenExpirySeconds('access'),
      path: '/',
    });
    response.cookies.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getTokenExpirySeconds('refresh'),
      path: '/',
    });
    return response;

  } catch (error) {
    logger.error('Login error', error);
    
    return apiError(request, 'server', 500);
  }
}
