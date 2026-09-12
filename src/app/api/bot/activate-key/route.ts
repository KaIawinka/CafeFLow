/**
 * Bot Key Activation API
 * POST /api/bot/activate-key - Activate bot access key for user
 * Links a user account to Telegram via access key
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface ActivateKeyRequest {
  keyId: string;
  userId: string;
  telegramChatId: string;
  telegramUsername?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ActivateKeyRequest = await request.json();
    const { keyId, userId, telegramChatId, telegramUsername } = body;

    // Validation
    if (!keyId || !userId || !telegramChatId) {
      return NextResponse.json(
        { error: 'Все поля обязательны' },
        { status: 400 }
      );
    }

    // Check if key exists and is valid
    const accessKey = await prisma.bot_access_keys.findUnique({
      where: { id: keyId },
    });

    if (!accessKey || !accessKey.is_active) {
      return NextResponse.json(
        { error: 'Ключ недействителен' },
        { status: 401 }
      );
    }

    // Check if user exists
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        telegram_chat_id: true,
        telegram_activated_with_key: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Check if user already has Telegram linked
    if (user.telegram_chat_id && user.telegram_activated_with_key) {
      return NextResponse.json(
        { error: 'У пользователя уже привязан Telegram' },
        { status: 409 }
      );
    }

    // Check if this Telegram account is already linked to another user
    const existingTelegram = await prisma.users.findFirst({
      where: {
        telegram_chat_id: telegramChatId,
        id: { not: userId },
      },
    });

    if (existingTelegram) {
      return NextResponse.json(
        { error: 'Этот Telegram аккаунт уже привязан к другому пользователю' },
        { status: 409 }
      );
    }

    // Perform activation in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user with Telegram info
      const updatedUser = await tx.users.update({
        where: { id: userId },
        data: {
          telegram_chat_id: telegramChatId,
          telegram_username: telegramUsername || null,
          telegram_activated_with_key: accessKey.key,
          two_fa_enabled: true, // Автоматически включаем 2FA
        },
      });

      // Create activation record
      await tx.bot_key_activations.create({
        data: {
          key_id: keyId,
          user_id: userId,
          telegram_chat_id: telegramChatId,
        },
      });

      // Increment key usage counter
      await tx.bot_access_keys.update({
        where: { id: keyId },
        data: {
          uses_count: { increment: 1 },
        },
      });

      return updatedUser;
    });

    logger.info('Bot key activated', { 
      keyId, 
      userId, 
      telegramChatId,
      keyType: accessKey.key_type 
    });

    return NextResponse.json({
      success: true,
      message: 'Ключ успешно активирован',
      user: {
        id: result.id,
        email: result.email,
        telegramChatId: result.telegram_chat_id,
        twoFAEnabled: result.two_fa_enabled,
      },
    });

  } catch (error) {
    logger.error('Activate bot key error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
