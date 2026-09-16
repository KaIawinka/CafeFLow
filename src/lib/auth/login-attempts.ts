import { isIP } from 'node:net';
import { prisma } from '@/lib/prisma';

const EMAIL_WINDOW_MS = 15 * 60 * 1000;
const IP_WINDOW_MS = 60 * 60 * 1000;
const MAX_EMAIL_FAILURES = 5;
const MAX_IP_FAILURES = 20;

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const candidate = forwarded || request.headers.get('x-real-ip')?.trim() || '';
  return isIP(candidate) ? candidate : '0.0.0.0';
}

export async function isLoginRateLimited(email: string, ipAddress: string): Promise<boolean> {
  const now = Date.now();
  const [emailFailures, ipFailures] = await Promise.all([
    prisma.login_attempts.count({
      where: { email, ip_address: ipAddress, success: false, created_at: { gte: new Date(now - EMAIL_WINDOW_MS) } },
    }),
    prisma.login_attempts.count({
      where: { ip_address: ipAddress, success: false, created_at: { gte: new Date(now - IP_WINDOW_MS) } },
    }),
  ]);
  return emailFailures >= MAX_EMAIL_FAILURES || ipFailures >= MAX_IP_FAILURES;
}

export async function recordLoginAttempt(params: {
  email: string;
  ipAddress: string;
  userAgent: string | null;
  success: boolean;
  reason: string;
  userId?: string;
}): Promise<void> {
  await prisma.login_attempts.create({
    data: {
      email: params.email,
      ip_address: params.ipAddress,
      user_agent: params.userAgent?.slice(0, 500) || null,
      success: params.success,
      reason: params.reason,
      usersId: params.userId,
    },
  });
}