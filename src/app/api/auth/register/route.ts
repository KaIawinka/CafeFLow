/**
 * POST /api/auth/register
 * User registration endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { generateTokenPair } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
  phone?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { email, password, firstName, lastName, phone } = body;

    // Validation
    if (!email || !password || !firstName) {
      return NextResponse.json(
        { error: 'Email, пароль и имя обязательны' },
        { status: 400 }
      );
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    // Password strength validation
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Пароль должен быть минимум 8 символов' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.users.findFirst({
      where: { 
        email: email.toLowerCase() 
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Пользователь с таким email уже существует' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.users.create({
        data: {
          email: email.toLowerCase(),
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName || null,
          phone: phone || null,
          display_name: `${firstName}${lastName ? ' ' + lastName : ''}`,
          role: 'customer',
          status: 'active',
          two_fa_enabled: false,
          requires_approval: false,
          language: 'ru',
          timezone: 'Asia/Bishkek',
          last_login_at: new Date(),
          last_seen_at: new Date(),
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          display_name: true,
          role: true,
          status: true,
        },
      });

      await transaction.user_settings.create({
        data: {
          user_id: createdUser.id,
          email_notifications: true,
          sms_notifications: false,
          push_notifications: true,
          telegram_notifications: true,
          show_online_status: true,
          show_phone: false,
          show_email: false,
          theme: 'light',
          compact_mode: false,
        },
      });

      return createdUser;
    });

    logger.info('User registered successfully', { 
      email: user.email, 
      role: user.role 
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      requiresApproval: false,
      sessionId: crypto.randomUUID(),
    };

    const { accessToken, refreshToken } = await generateTokenPair(tokenPayload);

    // Return tokens and user info
    return NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        displayName: user.display_name,
        role: user.role,
        status: user.status,
      },
    }, { status: 201 });

  } catch (error) {
    logger.error('Registration error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
