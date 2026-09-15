import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyCode } from '@/lib/email/verification';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email?: string; code?: string; password?: string };
    const email = body.email?.trim().toLowerCase();
    const code = body.code?.trim();
    const password = body.password || '';

    if (!email || !code || !password) {
      return NextResponse.json({ error: 'Email, код и новый пароль обязательны' }, { status: 400 });
    }
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ error: 'Код должен состоять из 6 цифр' }, { status: 400 });
    }
    const passwordErrors = validatePasswordStrength(password);
    if (passwordErrors.length > 0) {
      return NextResponse.json({ error: passwordErrors[0] }, { status: 400 });
    }

    const user = await prisma.users.findUnique({ where: { email }, select: { id: true } });
    if (!user) return NextResponse.json({ error: 'Неверный код или email' }, { status: 400 });

    const verification = await verifyCode(user.id, code, 'password_reset');
    if (!verification.success) return NextResponse.json({ error: verification.error }, { status: 400 });

    await prisma.users.update({
      where: { id: user.id },
      data: { password_hash: await hashPassword(password) },
    });

    // Revoke active sessions after a password change.
    await prisma.auth_sessions.deleteMany({ where: { user_id: user.id } });
    logger.info('Password reset completed', { userId: user.id });
    return NextResponse.json({ success: true, message: 'Пароль успешно изменён' });
  } catch (error) {
    logger.error('Reset password error', error);
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 });
  }
}
