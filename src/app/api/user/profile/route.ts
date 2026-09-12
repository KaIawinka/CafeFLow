/**
 * User Profile API
 * GET /api/user/profile - Get current user profile
 * PATCH /api/user/profile - Update user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

/**
 * GET - Get current user profile
 */
export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Невалидный токен' },
        { status: 401 }
      );
    }

    // Get user profile
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        display_name: true,
        avatar_file_id: true,
        bio: true,
        role: true,
        status: true,
        language: true,
        timezone: true,
        email_verified_at: true,
        phone_verified_at: true,
        telegram_chat_id: true,
        telegram_username: true,
        telegram_activated_with_key: true,
        two_fa_enabled: true,
        requires_approval: true,
        last_login_at: true,
        last_seen_at: true,
        created_at: true,
        updated_at: true,
        avatar_file: {
          select: {
            storage_key: true,
            mime_type: true,
          },
        },
        user_settings: {
          select: {
            email_notifications: true,
            sms_notifications: true,
            push_notifications: true,
            telegram_notifications: true,
            show_online_status: true,
            show_phone: true,
            show_email: true,
            theme: true,
            compact_mode: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Пользователь не найден' },
        { status: 404 }
      );
    }

    // Update last seen
    await prisma.users.update({
      where: { id: user.id },
      data: { last_seen_at: new Date() },
    });

    return NextResponse.json({
      success: true,
      user,
    });

  } catch (error) {
    logger.error('Get profile error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = await verifyAccessToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Невалидный токен' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      displayName,
      bio,
      phone,
      language,
      timezone,
    } = body;

    // Update user
    const updatedUser = await prisma.users.update({
      where: { id: payload.userId },
      data: {
        ...(firstName !== undefined && { first_name: firstName }),
        ...(lastName !== undefined && { last_name: lastName }),
        ...(displayName !== undefined && { display_name: displayName }),
        ...(bio !== undefined && { bio }),
        ...(phone !== undefined && { phone }),
        ...(language !== undefined && { language }),
        ...(timezone !== undefined && { timezone }),
        last_seen_at: new Date(),
      },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        display_name: true,
        bio: true,
        role: true,
        status: true,
        language: true,
        timezone: true,
        updated_at: true,
      },
    });

    logger.info('Profile updated', { userId: payload.userId });

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });

  } catch (error) {
    logger.error('Update profile error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
