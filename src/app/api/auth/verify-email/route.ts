/**
 * POST /api/auth/verify-email
 * Verify email with confirmation code
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { verifyCode } from '@/lib/email/verification';
import { createAuthSession, generateTokenPair, getTokenExpirySeconds } from '@/lib/auth/jwt';
import { apiError, apiMessage } from '@/lib/api-response';
import crypto from 'crypto';

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
        { error: apiMessage(request, 'userIdCodeRequired') },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        { error: apiMessage(request, 'invalidCodeFormat') },
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
        role: true,
        requires_approval: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: apiMessage(request, 'userNotFound') },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.email_verified_at) {
      return NextResponse.json(
        { 
          success: true,
          message: apiMessage(request, 'emailAlreadyVerified'),
        },
        { status: 200 }
      );
    }

    // Verify code
    const result = await verifyCode(userId, code, 'email_verification');

    if (!result.success) {
      return NextResponse.json(
        { error: result.errorKey ? apiMessage(request, result.errorKey) : result.error },
        { status: 400 }
      );
    }

    // Mark email as verified
    await prisma.users.update({
      where: { id: userId },
      data: {
        email_verified_at: new Date(),
        status: 'active',
        last_login_at: new Date(),
        last_seen_at: new Date(),
      },
    });

    logger.info('Email verified successfully', { userId, email: user.email });

    const sessionId = crypto.randomUUID();
    const { accessToken, refreshToken } = await generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: 'active',
      requiresApproval: user.requires_approval,
      sessionId,
    });
    await createAuthSession({ sessionId, userId: user.id, refreshToken, request });

    const response = NextResponse.json({
      success: true,
      message: apiMessage(request, 'emailVerified'),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        role: user.role,
        requiresApproval: user.requires_approval,
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
    logger.error('Email verification error', error);
    
    return apiError(request, 'server', 500);
  }
}
