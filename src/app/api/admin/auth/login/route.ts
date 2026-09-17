/**
 * POST /api/admin/auth/login
 * Admin login with email/password and send 2FA code via Telegram
 * Uses settings table for ADMIN_TELEGRAM_USER_ID and ADMIN_TELEGRAM_BOT_TOKEN
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { logger } from '@/lib/logger';
import crypto from 'crypto';
import { getClientIp, isLoginRateLimited, recordLoginAttempt } from '@/lib/auth/login-attempts';

interface LoginRequest {
  email: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Get client IP
    const normalizedEmail = email.trim().toLowerCase();
    const ipAddress = getClientIp(request);

    if (await isLoginRateLimited(normalizedEmail, ipAddress)) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_rate_limit_exceeded' });
      return NextResponse.json({ error: 'Слишком много попыток входа. Попробуйте позже.' }, { status: 429 });
    }

    // Find admin user by email
    const user = await prisma.users.findFirst({
      where: { 
        email: normalizedEmail,
        role: 'admin', // Only admins can login to admin panel
      },
      select: {
        id: true,
        email: true,
        password_hash: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        telegram_chat_id: true,
      },
    });

    // User not found or not admin
    if (!user) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_invalid_credentials' });
      logger.warn('Admin login failed: User not found or not admin', { email, ipAddress });
      
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (user.status !== 'active') {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_account_inactive', userId: user.id });
      logger.warn('Admin login failed: User inactive', { email, status: user.status });
      
      return NextResponse.json(
        { error: 'Аккаунт заблокирован. Обратитесь к администратору.' },
        { status: 403 }
      );
    }

    // Verify password
    if (!user.password_hash) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_missing_password_hash', userId: user.id });
      logger.warn('Admin login failed: No password hash', { email });
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_invalid_credentials', userId: user.id });
      logger.warn('Admin login failed: Invalid password', { email, ipAddress });
      
      return NextResponse.json(
        { error: 'Неверный email или пароль' },
        { status: 401 }
      );
    }

    // Password is correct
    await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: true, reason: 'admin_2fa_required', userId: user.id });
    logger.info('Admin password verified', { email: user.email });

    // Check if user has Telegram linked
    if (!user.telegram_chat_id) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_telegram_not_linked', userId: user.id });
      logger.error('Admin has no Telegram linked', { email: user.email });
      return NextResponse.json(
        { error: 'У вас не привязан Telegram. Обратитесь к администратору системы для настройки 2FA.' },
        { status: 400 }
      );
    }

    const adminTelegramChatId = user.telegram_chat_id;

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();

    // Store code in verification_codes table
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await prisma.verification_codes.create({
      data: {
        user_id: user.id,
        code,
        type: 'admin_2fa_login',
        expires_at: expiresAt,
        ip_address: ipAddress,
      },
    });

    // Send code via Telegram
    try {
      // Try to get bot token from settings first, fallback to env
      const telegramBotTokenSetting = await prisma.settings.findUnique({
        where: { key: 'ADMIN_TELEGRAM_BOT_TOKEN' },
      });

      const botToken = telegramBotTokenSetting?.value || process.env.TELEGRAM_BOT_TOKEN;

      if (!botToken) {
        throw new Error('ADMIN_TELEGRAM_BOT_TOKEN not configured');
      }

      const message = 
        `🔐 <b>Код для входа в CaféFlow Admin</b>\n\n` +
        `Ваш код: <code>${code}</code>\n\n` +
        `⏰ Действителен <b>5 минут</b>\n` +
        `🔢 Осталось попыток: <b>3</b>\n\n` +
        `⚠️ Если это не вы, немедленно смените пароль!\n\n` +
        `<i>Никому не сообщайте этот код</i>`;

      const telegramRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: adminTelegramChatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (!telegramRes.ok) {
        const errorData = await telegramRes.json();
        logger.error('Failed to send Telegram message', undefined, { error: errorData });
        throw new Error('Failed to send Telegram message');
      }

      logger.info('2FA code sent to admin via Telegram', { email: user.email });

      return NextResponse.json({
        requires2FA: true,
        message: 'Код подтверждения отправлен в Telegram',
        expiresInMinutes: 5,
      });

    } catch (error) {
      await recordLoginAttempt({ email: normalizedEmail, ipAddress, userAgent: request.headers.get('user-agent'), success: false, reason: 'admin_2fa_delivery_failed', userId: user.id });
      logger.error('Failed to send 2FA code via Telegram', error);
      
      return NextResponse.json(
        { error: 'Не удалось отправить код подтверждения. Попробуйте позже.' },
        { status: 500 }
      );
    }

  } catch (error) {
    logger.error('Admin login error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
