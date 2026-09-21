/**
 * GET /api/auth/telegram/link-code
 * Generate a link code for Telegram account binding
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { getBotInfo } from '@/lib/telegram/bot';
import { generateTelegramLinkCode, getTelegramLinkUrl } from '@/lib/telegram/utils';
import { logger } from '@/lib/logger';
import { apiError, apiList, apiMessage } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  try {
    // Support both API clients and the browser's httpOnly session cookie.
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader) || request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: apiMessage(request, 'tokenMissing') },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: apiMessage(request, 'invalidSessionToken') },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        telegram_chat_id: true,
        two_fa_enabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: apiMessage(request, 'userNotFound') },
        { status: 404 }
      );
    }

    // Check if Telegram is already linked
    if (user.telegram_chat_id && user.two_fa_enabled) {
      return NextResponse.json(
        { 
          error: apiMessage(request, 'telegramAlreadyLinked'),
          alreadyLinked: true,
        },
        { status: 400 }
      );
    }

    const botInfo = await getBotInfo();
    const botUsername = botInfo?.username || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
    if (!botUsername) {
      return NextResponse.json(
        { error: apiMessage(request, 'telegramNotConfigured') },
        { status: 503 },
      );
    }

    const code = await generateTelegramLinkCode(user.id);
    const linkUrl = getTelegramLinkUrl(code, botUsername);

    logger.info('Generated Telegram link code', { email: user.email });

    return NextResponse.json({
      success: true,
      code,
      linkUrl,
      expiresInMinutes: 10,
      instructions: apiList(request, 'telegramInstructions'),
    });

  } catch (error) {
    logger.error('Link code generation error', error);
    
    return apiError(request, 'server', 500);
  }
}
