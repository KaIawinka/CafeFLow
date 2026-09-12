/**
 * POST /api/admin/auth/logout
 * Logout admin and clear session cookies
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear auth cookies
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');

    logger.info('Admin logged out');

    return NextResponse.redirect(new URL('/admin/login', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
  } catch (error) {
    logger.error('Logout error', error);
    
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
