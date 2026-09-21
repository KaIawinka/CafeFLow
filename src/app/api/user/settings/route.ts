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

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        language: true,
        two_fa_enabled: true,
        email_verified_at: true,
        phone_verified_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

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
      settings: {
        language: user.language,
        language_ui: user.language,
        twoFAEnabled: user.two_fa_enabled,
        emailVerified: Boolean(user.email_verified_at),
        phoneVerified: Boolean(user.phone_verified_at),
        emailNotifications: settings.email_notifications,
        smsNotifications: settings.sms_notifications,
        pushNotifications: settings.push_notifications,
        telegramNotifications: settings.telegram_notifications,
        showOnlineStatus: settings.show_online_status,
        showPhone: settings.show_phone,
        showEmail: settings.show_email,
        theme: settings.theme,
        compactMode: settings.compact_mode,
      },
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

    const body = await request.json() as {
      language?: string;
      language_ui?: string;
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      pushNotifications?: boolean;
      telegramNotifications?: boolean;
      showOnlineStatus?: boolean;
      showPhone?: boolean;
      showEmail?: boolean;
      theme?: string;
      compactMode?: boolean;
    };
    const language = body.language_ui || body.language;
    const supportedLanguages = ['ru', 'en', 'kg'];
    if (language !== undefined && !supportedLanguages.includes(language)) {
      return NextResponse.json({ error: 'Недопустимый язык интерфейса' }, { status: 400 });
    }
    if (body.theme !== undefined && !['light', 'dark', 'system'].includes(body.theme)) {
      return NextResponse.json({ error: 'Недопустимая тема оформления' }, { status: 400 });
    }
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

    await prisma.users.update({
      where: { id: payload.userId },
      data: {
        ...(language !== undefined ? { language } : {}),
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
