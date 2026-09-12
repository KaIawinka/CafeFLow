/**
 * GET /api/auth/telegram/link-code
 * Generate a link code for Telegram account binding
 * Requires authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth/jwt';
import { generateTelegramLinkCode, getTelegramLinkUrl } from '@/lib/telegram/utils';

export async function GET(request: NextRequest) {
  try {
    // Extract and verify JWT token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: 'Токен не предоставлен' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Недействительный или истёкший токен' },
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
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Check if Telegram is already linked
    if (user.telegram_chat_id) {
      return NextResponse.json(
        { 
          error: 'Telegram уже привязан к этому аккаунту',
          alreadyLinked: true,
        },
        { status: 400 }
      );
    }

    // Generate link code
    const code = await generateTelegramLinkCode(user.id);
    const linkUrl = getTelegramLinkUrl(code);

    console.log(`📱 Generated Telegram link code for ${user.email}`);

    return NextResponse.json({
      success: true,
      code,
      linkUrl,
      expiresInMinutes: 10,
      instructions: [
        'Нажмите на ссылку ниже или откройте её в браузере',
        'Telegram откроется автоматически',
        'Нажмите START в боте',
        'Ваш аккаунт будет привязан автоматически',
      ],
    });

  } catch (error) {
    console.error('❌ Link code generation error:', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
