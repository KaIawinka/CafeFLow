import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { canRequestNewCode, createVerificationCode } from '@/lib/email/verification';
import { sendSecurityCodeEmail } from '@/lib/email/client';
import { apiError, apiMessage } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    const payload = token ? await verifyAccessToken(token) : null;
    if (!payload) return apiError(request, 'unauthorized', 401);

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, email_verified_at: true },
    });
    if (!user) return apiError(request, 'userNotFound', 404);
    if (!user.email_verified_at) return NextResponse.json({ error: apiMessage(request, 'recoveryEmailNotVerified') }, { status: 400 });

    const rateLimit = await canRequestNewCode(user.id, 'password_change');
    if (!rateLimit.canRequest) {
      return NextResponse.json({ error: apiMessage(request, 'verificationWait', { seconds: rateLimit.waitSeconds || 0 }) }, { status: 429 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const code = await createVerificationCode(user.id, 'password_change', ipAddress);
    const sent = await sendSecurityCodeEmail(user.email, code, 'password_change');

    if (!sent && process.env.NODE_ENV === 'production') {
      logger.error('Password change code email was not sent', undefined, { userId: user.id });
      return NextResponse.json({ error: apiMessage(request, 'emailSendFailed') }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: apiMessage(request, process.env.NODE_ENV === 'development' && !sent ? 'verificationSentDev' : 'verificationSent'),
      ...(process.env.NODE_ENV === 'development' ? { devCode: code } : {}),
    });
  } catch (error) {
    logger.error('Password change code request error', error);
    return apiError(request, 'server', 500);
  }
}