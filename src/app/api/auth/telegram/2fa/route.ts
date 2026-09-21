import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { verifyPassword } from '@/lib/auth/password';
import { logger } from '@/lib/logger';
import { apiError, apiMessage, apiUserMessage } from '@/lib/api-response';

interface TwoFactorRequest {
  enabled?: boolean;
  currentPassword?: string;
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    const payload = token ? await verifyAccessToken(token) : null;
    if (!payload) return apiError(request, 'unauthorized', 401);

    const body = await request.json() as TwoFactorRequest;
    const enabled = body.enabled;
    const currentPassword = body.currentPassword || '';

    if (typeof enabled !== 'boolean' || !currentPassword) {
      return NextResponse.json(
        { error: apiMessage(request, 'twoFaPasswordRequired') },
        { status: 400 },
      );
    }

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        password_hash: true,
        telegram_chat_id: true,
        two_fa_enabled: true,
      },
    });

    if (!user) return apiError(request, 'userNotFound', 404);

    if (!(await verifyPassword(currentPassword, user.password_hash))) {
      return NextResponse.json(
        { error: apiUserMessage(request, 'currentPasswordInvalid') },
        { status: 400 },
      );
    }

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