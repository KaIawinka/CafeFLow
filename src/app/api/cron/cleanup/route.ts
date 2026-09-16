import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getRequiredServerSecret } from '@/lib/config';
import { logger } from '@/lib/logger';

function isAuthorized(request: NextRequest): boolean {
  try {
    return request.headers.get('authorization') === `Bearer ${getRequiredServerSecret('CRON_SECRET')}`;
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const now = new Date();
    const loginAttemptsCutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const [sessions, verificationCodes, telegramCodes, loginAttempts] = await prisma.$transaction([
      prisma.auth_sessions.deleteMany({ where: { expires_at: { lte: now } } }),
      prisma.verification_codes.deleteMany({ where: { expires_at: { lte: now } } }),
      prisma.telegram_link_codes.deleteMany({ where: { OR: [{ expires_at: { lte: now } }, { used_at: { not: null } }] } }),
      prisma.login_attempts.deleteMany({ where: { created_at: { lt: loginAttemptsCutoff } } }),
    ]);
    const deleted = {
      authSessions: sessions.count,
      verificationCodes: verificationCodes.count,
      telegramLinkCodes: telegramCodes.count,
      loginAttempts: loginAttempts.count,
    };
    logger.info('Technical data cleanup completed', deleted);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    logger.error('Technical data cleanup failed', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}