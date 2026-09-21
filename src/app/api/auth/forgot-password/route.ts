import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createVerificationCode } from '@/lib/email/verification';
import { sendPasswordResetEmail } from '@/lib/email/client';
import { logger } from '@/lib/logger';
import { apiError, apiMessage } from '@/lib/api-response';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string; recover2fa?: boolean };
    const email = body.email?.trim().toLowerCase();
    const recover2fa = body.recover2fa === true;
    const genericMessage = apiMessage(request, recover2fa ? 'recoveryGeneric' : 'forgotPasswordGeneric');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: apiMessage(request, 'invalidEmail') }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, first_name: true, email_verified_at: true },
    });

    // Do not reveal whether the email is registered.
    if (!user) return NextResponse.json({ message: genericMessage });

    if (recover2fa && !user.email_verified_at) {
      return NextResponse.json({ error: apiMessage(request, 'recoveryEmailNotVerified') }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const code = await createVerificationCode(user.id, 'password_reset', ipAddress);
    const sent = await sendPasswordResetEmail(user.email, code, user.first_name);

    if (!sent && process.env.NODE_ENV === 'production') {
      logger.error('Password reset email was not sent', undefined, { userId: user.id });
      return NextResponse.json({ error: apiMessage(request, 'emailSendFailed') }, { status: 503 });
    }

    return NextResponse.json({ message: genericMessage, ...(process.env.NODE_ENV === 'development' ? { devCode: code } : {}) });
  } catch (error) {
    logger.error('Forgot password error', error);
    return apiError(request, 'server', 500);
  }
}
