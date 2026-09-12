/**
 * Bot Key Validation API
 * POST /api/bot/validate-key - Validate bot access key
 * Used by Telegram bot to verify access keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

interface ValidateKeyRequest {
  key: string;
  telegramChatId: string;
  telegramUsername?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidateKeyRequest = await request.json();
    const { key, telegramChatId, telegramUsername } = body;

    // Validation
    if (!key || !telegramChatId) {
      return NextResponse.json(
        { error: 'Ключ и Telegram Chat ID обязательны' },
        { status: 400 }
      );
    }

    // Find key
    const accessKey = await prisma.bot_access_keys.findUnique({
      where: { key },
      select: {
        id: true,
        key: true,
        key_type: true,
        description: true,
        max_uses: true,
        uses_count: true,
        expires_at: true,
        is_active: true,
      },
    });

    // Key not found
    if (!accessKey) {
      logger.warn('Invalid bot key attempted', { key, telegramChatId });
      
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Неверный ключ доступа' 
        },
        { status: 401 }
      );
    }

    // Check if key is active
    if (!accessKey.is_active) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Ключ деактивирован' 
        },
        { status: 401 }
      );
    }

    // Check if key is expired
    if (accessKey.expires_at && new Date(accessKey.expires_at) < new Date()) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Срок действия ключа истёк' 
        },
        { status: 401 }
      );
    }

    // Check max uses
    if (accessKey.max_uses !== null && accessKey.uses_count >= accessKey.max_uses) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Достигнут лимит использований ключа' 
        },
        { status: 401 }
      );
    }

    // Check if this Telegram account already activated a key
    const existingUser = await prisma.users.findFirst({
      where: { 
        telegram_chat_id: telegramChatId 
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        telegram_activated_with_key: true,
      },
    });

    if (existingUser && existingUser.telegram_activated_with_key) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Этот Telegram аккаунт уже активирован',
          user: {
            email: existingUser.email,
            firstName: existingUser.first_name,
          },
        },
        { status: 409 }
      );
    }

    logger.info('Bot key validated successfully', { 
      keyId: accessKey.id, 
      keyType: accessKey.key_type,
      telegramChatId 
    });

    // Return key info (without incrementing uses yet - that happens on activation)
    return NextResponse.json({
      valid: true,
      key: {
        id: accessKey.id,
        keyType: accessKey.key_type,
        description: accessKey.description,
        remainingUses: accessKey.max_uses 
          ? accessKey.max_uses - accessKey.uses_count 
          : null,
      },
    });

  } catch (error) {
    logger.error('Validate bot key error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
