import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { unlinkTelegramAccount } from '@/lib/telegram/utils';
import { apiError, apiMessage } from '@/lib/api-response';

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    const payload = token ? await verifyAccessToken(token) : null;
    if (!payload) return apiError(request, 'unauthorized', 401);

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: { telegram_chat_id: true },
    });
    if (!user) return apiError(request, 'userNotFound', 404);
    if (!user.telegram_chat_id) return NextResponse.json({ error: apiMessage(request, 'telegramNotLinked') }, { status: 400 });

    const result = await unlinkTelegramAccount(payload.userId);
    if (!result.success) return NextResponse.json({ error: apiMessage(request, 'telegramUnlinkFailed') }, { status: 500 });

    return NextResponse.json({
      success: true,
      message: apiMessage(request, 'telegramUnlinked'),
      twoFAEnabled: false,
      telegramLinked: false,
    });
  } catch {
    return apiError(request, 'server', 500);
  }
}