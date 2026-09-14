/**
 * API Middleware Helpers
 * Общие функции для проверки авторизации в API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

export interface AuthResult {
  success: boolean;
  userId?: string;
  role?: string;
  error?: NextResponse;
}

/**
 * Проверяет JWT токен из cookie
 * Возвращает userId и role или ошибку
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Не авторизован' },
          { status: 401 }
        ),
      };
    }

    const payload = await verifyAccessToken(token);

    if (!payload) {
      return {
        success: false,
        error: NextResponse.json(
          { error: 'Неверный токен' },
          { status: 401 }
        ),
      };
    }

    return {
      success: true,
      userId: payload.userId,
      role: payload.role,
    };
  } catch (error) {
    logger.error('Auth verification error:', error);
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Ошибка авторизации' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Проверяет что пользователь - админ
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthResult> {
  const auth = await verifyAuth(request);

  if (!auth.success) {
    return auth;
  }

  if (auth.role !== 'admin') {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Доступ запрещён. Требуются права администратора.' },
        { status: 403 }
      ),
    };
  }

  return auth;
}

/**
 * Проверяет что пользователь - админ или менеджер
 */
export async function verifyAdminOrManager(request: NextRequest): Promise<AuthResult> {
  const auth = await verifyAuth(request);

  if (!auth.success) {
    return auth;
  }

  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return {
      success: false,
      error: NextResponse.json(
        { error: 'Доступ запрещён. Требуются права администратора или менеджера.' },
        { status: 403 }
      ),
    };
  }

  return auth;
}
