import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hashPassword, validatePasswordStrength, verifyPassword } from '@/lib/auth/password';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('accessToken')?.value;
    const payload = token ? await verifyAccessToken(token) : null;
    if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

    const body = await request.json() as { currentPassword?: string; newPassword?: string; confirmPassword?: string };
    const currentPassword = body.currentPassword || '';
    const newPassword = body.newPassword || '';
    const confirmPassword = body.confirmPassword || '';

    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json({ error: 'Заполните текущий пароль и новый пароль дважды' }, { status: 400 });
    }
    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'Новые пароли не совпадают' }, { status: 400 });
    }
    if (currentPassword === newPassword) {
      return NextResponse.json({ error: 'Новый пароль должен отличаться от текущего' }, { status: 400 });
    }

    const passwordErrors = validatePasswordStrength(newPassword);
    if (passwordErrors.length > 0) {
      return NextResponse.json({ error: passwordErrors[0] }, { status: 400 });
    }

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: { id: true, password_hash: true },
    });
    if (!user || !(await verifyPassword(currentPassword, user.password_hash))) {
      return NextResponse.json({ error: 'Текущий пароль указан неверно' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: { password_hash: await hashPassword(newPassword) },
      }),
      prisma.auth_sessions.deleteMany({ where: { user_id: user.id } }),
    ]);

    const response = NextResponse.json({ success: true, message: 'Пароль изменён. Войдите снова на всех устройствах.' });
    response.cookies.delete('accessToken');
    response.cookies.delete('refreshToken');
    logger.info('Password changed from authenticated profile', { userId: user.id });
    return response;
  } catch (error) {
    logger.error('Change password error', error);
    return NextResponse.json({ error: 'Не удалось изменить пароль' }, { status: 500 });
  }
}
