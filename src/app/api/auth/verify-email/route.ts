/**
 * POST /api/auth/verify-email
 * Verify email with confirmation code
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifyCode } from '@/lib/email/verification';

interface VerifyEmailRequest {
  userId: string;
  code: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: VerifyEmailRequest = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      return NextResponse.json(
        { error: 'User ID и код обязательны' },
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

    // Find user
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        email_verified_at: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.email_verified_at) {
      return NextResponse.json(
        { 
          success: true,
          message: 'Email уже подтверждён' 
        },
        { status: 200 }
      );
    }

    // Verify code
    const result = await verifyCode(userId, code, 'email_verification');

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Mark email as verified
    await prisma.users.update({
      where: { id: userId },
      data: {
        email_verified_at: new Date(),
      },
    });

    logger.info('Email verified successfully', { userId, email: user.email });

    return NextResponse.json({
      success: true,
      message: 'Email успешно подтверждён',
    });

  } catch (error) {
    logger.error('Email verification error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
