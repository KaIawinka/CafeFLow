/**
 * POST /api/auth/register
 * User registration endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { validateEmailAddress, createVerificationCode } from '@/lib/email/verification';
import { sendVerificationEmail } from '@/lib/email/client';
import { verifyRecaptcha } from '@/lib/recaptcha';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  recaptchaToken?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, firstName, lastName, phone, recaptchaToken } = body;

    // Validation
    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: 'Email, пароль и имя обязательны' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'register');
      if (!recaptchaResult.success) {
        logger.warn('Registration blocked by reCAPTCHA', { 
          email, 
          score: recaptchaResult.score 
        });
        return NextResponse.json(
          { error: 'Проверка безопасности не пройдена. Попробуйте позже.' },
          { status: 403 }
        );
      }
      logger.info('reCAPTCHA passed for registration', { 
        email, 
        score: recaptchaResult.score 
      });
    }

    // Email format validation
    const emailValidation = await validateEmailAddress(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.error },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен быть минимум 8 символов' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: { 
        email: email.toLowerCase() 
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.users.create({
        data: {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName || null,
          phone: phone || null,
          display_name: `${firstName}${lastName ? ' ' + lastName : ''}`,
          role: 'customer',
          status: 'active',
          two_fa_enabled: false,
          requires_approval: false,
          language: 'ru',
          timezone: 'Asia/Bishkek',
          last_login_at: new Date(),
          last_seen_at: new Date(),
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          display_name: true,
          role: true,
          status: true,
        },
      });

      await transaction.user_settings.create({
        data: {
          user_id: createdUser.id,
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          telegram_notifications: true,
          show_online_status: true,
          show_phone: false,
          show_email: false,
          theme: 'light',
          compact_mode: false,
        },
      });

      return createdUser;
    });

    logger.info('User registered successfully', { 
      email: user.email, 
      role: user.role 
    });

    // Get client IP for verification code
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Create and send verification code
    try {
      const code = await createVerificationCode(user.id, 'email_verification', ipAddress);
      const emailSent = await sendVerificationEmail(user.email, code, user.first_name);
      
      if (emailSent) {
        logger.info('Verification email sent after registration', { userId: user.id });
      } else if (process.env.NODE_ENV === 'development') {
        // In development mode, log the code
        logger.info('Verification code (dev mode)', { code });
      }
    } catch (emailError) {
      // Don't fail registration if email fails, user can request it later
      logger.error('Failed to send verification email during registration', emailError);
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      requiresApproval: false,
      sessionId: crypto.randomUUID(),
    };

    const { accessToken, refreshToken } = await generateTokenPair(tokenPayload);

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
        displayName: user.display_name,
        role: user.role,
        status: user.status,
      },
      requiresEmailVerification: true,
    }, { status: 201 });

  } catch (error) {
    logger.error('Registration error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
