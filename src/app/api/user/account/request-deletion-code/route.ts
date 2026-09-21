import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { canRequestNewCode, createVerificationCode } from '@/lib/email/verification';
import { sendSecurityCodeEmail } from '@/lib/email/client';
import { apiError, apiMessage, apiUserMessage } from '@/lib/api-response';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    const payload = token ? await verifyAccessToken(token) : null;
    if (!payload) return apiError(request, 'unauthorized', 401);

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, email_verified_at: true, role: true },
    });
    if (!user) return apiError(request, 'userNotFound', 404);
    const hasCreatedBotKeys = await prisma.bot_access_keys.count({ where: { created_by: user.id } }) > 0;
    if (user.role !== 'customer' || hasCreatedBotKeys) return NextResponse.json({ error: apiUserMessage(request, 'accountDeletionStaffDenied') }, { status: 403 });
    if (!user.email_verified_at) return NextResponse.json({ error: apiMessage(request, 'recoveryEmailNotVerified') }, { status: 400 });

    const rateLimit = await canRequestNewCode(user.id, 'account_deletion');
    if (!rateLimit.canRequest) {
      return NextResponse.json({ error: apiMessage(request, 'verificationWait', { seconds: rateLimit.waitSeconds || 0 }) }, { status: 429 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const code = await createVerificationCode(user.id, 'account_deletion', ipAddress);
    const sent = await sendSecurityCodeEmail(user.email, code, 'account_deletion');

    if (!sent && process.env.NODE_ENV === 'production') {
      logger.error('Account deletion code email was not sent', undefined, { userId: user.id });
      return NextResponse.json({ error: apiMessage(request, 'emailSendFailed') }, { status: 503 });
    }

    return NextResponse.json({
      success: true,
      message: apiMessage(request, process.env.NODE_ENV === 'development' && !sent ? 'verificationSentDev' : 'verificationSent'),
      ...(process.env.NODE_ENV === 'development' ? { devCode: code } : {}),
    });
  } catch (error) {
    logger.error('Account deletion code request error', error);
    return apiError(request, 'server', 500);
  }
}