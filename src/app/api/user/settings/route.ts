/**
 * User Settings API
 * GET /api/user/settings - Get user settings
 * PATCH /api/user/settings - Update user settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

/**
 * GET - Get user settings
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Невалидный токен' },
        { status: 401 }
      );
    }

    // Get or create settings
    let settings = await prisma.user_settings.findUnique({
      where: { user_id: payload.userId },
    });

    // Create default settings if not exist
    if (!settings) {
      settings = await prisma.user_settings.create({
        data: {
          user_id: payload.userId,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
    });

  } catch (error) {
    logger.error('Get settings error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update user settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Невалидный токен' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      emailNotifications,
      smsNotifications,
      pushNotifications,
      telegramNotifications,
      showOnlineStatus,
      showPhone,
      showEmail,
      theme,
      compactMode,
    } = body;

    // Update settings (create if not exist - upsert)
    const settings = await prisma.user_settings.upsert({
      where: { user_id: payload.userId },
      update: {
        ...(emailNotifications !== undefined && { email_notifications: emailNotifications }),
        ...(smsNotifications !== undefined && { sms_notifications: smsNotifications }),
        ...(pushNotifications !== undefined && { push_notifications: pushNotifications }),
        ...(telegramNotifications !== undefined && { telegram_notifications: telegramNotifications }),
        ...(showOnlineStatus !== undefined && { show_online_status: showOnlineStatus }),
        ...(showPhone !== undefined && { show_phone: showPhone }),
        ...(showEmail !== undefined && { show_email: showEmail }),
        ...(theme !== undefined && { theme }),
        ...(compactMode !== undefined && { compact_mode: compactMode }),
      },
      create: {
        user_id: payload.userId,
        ...(emailNotifications !== undefined && { email_notifications: emailNotifications }),
        ...(smsNotifications !== undefined && { sms_notifications: smsNotifications }),
        ...(pushNotifications !== undefined && { push_notifications: pushNotifications }),
        ...(telegramNotifications !== undefined && { telegram_notifications: telegramNotifications }),
        ...(showOnlineStatus !== undefined && { show_online_status: showOnlineStatus }),
        ...(showPhone !== undefined && { show_phone: showPhone }),
        ...(showEmail !== undefined && { show_email: showEmail }),
        ...(theme !== undefined && { theme }),
        ...(compactMode !== undefined && { compact_mode: compactMode }),
      },
    });

    logger.info('Settings updated', { userId: payload.userId });

    return NextResponse.json({
      success: true,
      settings,
    });

  } catch (error) {
    logger.error('Update settings error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
