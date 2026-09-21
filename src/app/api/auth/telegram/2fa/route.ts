import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import { apiError, apiMessage } from '@/lib/api-response';

interface TwoFactorRequest {
  enabled?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    const payload = token ? await verifyAccessToken(token) : null;
    if (!payload) return apiError(request, 'unauthorized', 401);

    const body = await request.json() as TwoFactorRequest;
    const enabled = body.enabled;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: apiMessage(request, 'twoFaActionRequired') },
        { status: 400 },
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        telegram_chat_id: true,
        two_fa_enabled: true,
      },
    });

    if (!user) return apiError(request, 'userNotFound', 404);

    if (enabled && !user.telegram_chat_id) {
      return NextResponse.json(
        { error: apiMessage(request, 'telegramNotLinked') },
        { status: 400 },
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.users.update({
        where: { id: user.id },
        data: { two_fa_enabled: enabled },
      });

      if (!enabled) {
        await tx.verification_codes.deleteMany({
          where: { user_id: user.id, type: '2fa_login', used_at: null },
        });
        await tx.auth_sessions.deleteMany({
          where: { user_id: user.id, is_2fa_verified: false },
        });
      }
    });

    logger.info('User two-factor authentication setting changed', { userId: user.id, enabled });
    return NextResponse.json({
      success: true,
      enabled,
      message: apiMessage(request, enabled ? 'twoFaEnabled' : 'twoFaSettingDisabled'),
    });
  } catch (error) {
    logger.error('Update Telegram 2FA setting error', error);
    return apiError(request, 'server', 500);
  }
}