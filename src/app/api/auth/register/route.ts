/**
 * POST /api/auth/register
 * User registration endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { logger } from '@/lib/logger';
import { validateEmailAddress, createVerificationCode } from '@/lib/email/verification';
import { sendVerificationEmail } from '@/lib/email/client';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { getPasswordStrengthErrorKeys } from '@/lib/auth/password';
import { apiError, apiMessage } from '@/lib/api-response';

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
    const email = body.email?.trim().toLowerCase();
    const password = body.password;
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const phone = body.phone?.trim();
    const recaptchaToken = body.recaptchaToken;

    // Validation
    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: apiMessage(request, 'registrationRequired') },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA only in production
    if (process.env.NODE_ENV === 'production' && recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'register');
      if (!recaptchaResult.success) {
        logger.warn('Registration blocked by reCAPTCHA', { 
          email, 
          score: recaptchaResult.score 
        });
        return NextResponse.json(
          { error: apiMessage(request, 'securityCheckFailed') },
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
        { error: emailValidation.errorKey ? apiMessage(request, emailValidation.errorKey, emailValidation.errorParams) : emailValidation.error },
        { status: 400 }
      );
    }

    // Password strength validation
    const passwordErrorKey = getPasswordStrengthErrorKeys(password)[0];
    if (passwordErrorKey) {
      return NextResponse.json(
        { error: apiMessage(request, passwordErrorKey) },
        { status: 400 }
      );
    }

    if (firstName.length > 100 || (lastName && lastName.length > 100) || (phone && phone.length > 40)) {
      return NextResponse.json(
        { error: apiMessage(request, 'invalidRegistrationData') },
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
        { error: apiMessage(request, 'emailExists') },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.users.create({
        data: {
          email,
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName || null,
          phone: phone || null,
          display_name: `${firstName}${lastName ? ' ' + lastName : ''}`,
          role: 'customer',
          status: 'pending',
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

    // The account stays pending until the email verification code is accepted.
    try {
      const code = await createVerificationCode(user.id, 'email_verification', ipAddress);
      
      const emailSent = await sendVerificationEmail(user.email, code, user.first_name);
      
      if (emailSent) {
        logger.info('Verification email sent after registration', { userId: user.id });
      } else {
        logger.warn('Verification email not sent (service unavailable)', { userId: user.id });
        if (process.env.NODE_ENV === 'production') {
          await prisma.$transaction([
            prisma.verification_codes.deleteMany({ where: { user_id: user.id, type: 'email_verification' } }),
            prisma.user_settings.deleteMany({ where: { user_id: user.id } }),
            prisma.users.delete({ where: { id: user.id } }),
          ]);
          return NextResponse.json(
            { error: apiMessage(request, 'verificationEmailConfigFailed') },
            { status: 503 },
          );
        }
      }
    } catch (emailError) {
      logger.error('Failed to send verification email during registration', emailError);
      if (process.env.NODE_ENV === 'production') {
        await prisma.$transaction([
          prisma.verification_codes.deleteMany({ where: { user_id: user.id, type: 'email_verification' } }),
          prisma.user_settings.deleteMany({ where: { user_id: user.id } }),
          prisma.users.delete({ where: { id: user.id } }),
        ]);
        return NextResponse.json(
          { error: apiMessage(request, 'verificationEmailConfigFailed') },
          { status: 503 },
        );
      }
    }

    // Do not authenticate an unverified account.
    return NextResponse.json({
      success: true,
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
    logger.error('Registration error', error, {
      errorCode: error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined,
    });

    if (error && typeof error === 'object' && 'code' in error) {
      const prismaCode = String(error.code);
      if (prismaCode === 'P2002') {
        return NextResponse.json(
          { error: apiMessage(request, 'emailExists') },
          { status: 409 }
        );
      }
      if (prismaCode === 'P1001' || prismaCode === 'P1002' || prismaCode === 'P2021') {
        return NextResponse.json(
          { error: apiMessage(request, 'databaseUnavailable') },
          { status: 503 }
        );
      }
    }

    return apiError(request, 'server', 500);
  }
}
