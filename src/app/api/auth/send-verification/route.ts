/**
 * POST /api/auth/send-verification
 * Send email verification code to user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createVerificationCode, canRequestNewCode } from '@/lib/email/verification';
import { sendVerificationEmail } from '@/lib/email/client';
import { apiError, apiMessage } from '@/lib/api-response';

interface SendVerificationRequest {
  userId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendVerificationRequest = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: apiMessage(request, 'userIdRequired') },
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
        { error: apiMessage(request, 'userNotFound') },
        { status: 404 }
      );
    }

    // Check if already verified
    if (user.email_verified_at) {
      return NextResponse.json(
        { error: apiMessage(request, 'emailAlreadyVerified') },
        { status: 400 }
      );
    }

    // Check rate limiting
    const { canRequest, waitSeconds } = await canRequestNewCode(userId, 'email_verification');
    if (!canRequest) {
      return NextResponse.json(
        { 
          error: apiMessage(request, 'verificationWait', { seconds: waitSeconds ?? 0 }),
          waitSeconds 
        },
        { status: 429 }
      );
    }

    // Get client IP
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    // Create verification code
    const code = await createVerificationCode(userId, 'email_verification', ipAddress);

    // Send email
    const emailSent = await sendVerificationEmail(user.email, code, user.first_name);

    if (!emailSent) {
      logger.error('Failed to send verification email', { userId, email: user.email });
      
      // In development, return code for testing
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: apiMessage(request, 'verificationSentDev'),
          devCode: code, // Only in development!
        });
      }
      
      return NextResponse.json(
        { error: apiMessage(request, 'emailSendFailed') },
        { status: 500 }
      );
    }

    logger.info('Verification email sent', { userId, email: user.email });

    return NextResponse.json({
      success: true,
      message: apiMessage(request, 'verificationSent'),
    });

  } catch (error) {
    logger.error('Send verification error', error);
    
    return apiError(request, 'server', 500);
  }
}
