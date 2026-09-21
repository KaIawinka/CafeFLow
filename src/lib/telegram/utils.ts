/**
 * Telegram Bot Utility Functions
 */

import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Generate unique link code for Telegram account linking
 */
export async function generateTelegramLinkCode(userId: string): Promise<string> {
  const code = crypto.randomUUID().replace(/-/g, '');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.$transaction([
    prisma.telegram_link_codes.deleteMany({
      where: { user_id: userId, used_at: null },
    }),
    prisma.telegram_link_codes.create({
      data: {
        user_id: userId,
        code,
        expires_at: expiresAt,
      },
    }),
  ]);

  return code;
}

/**
 * Generate 6-digit verification code
 */
export function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Create verification code in database
 */
export async function createVerificationCode(
  userId: string,
  type: string = '2fa_login',
  ipAddress?: string
): Promise<string> {
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.verification_codes.create({
    data: {
      user_id: userId,
      code,
      type,
      expires_at: expiresAt,
      ip_address: ipAddress || null,
    },
  });

  return code;
}

/**
 * Verify code from user input
 */
export async function verifyCode(
  userId: string,
  inputCode: string,
  type: string = '2fa_login'
): Promise<{
  valid: boolean;
  error?: string;
  errorKey?: 'telegramCodeMissingOrExpired' | 'telegramAttemptsExceeded' | 'telegramInvalidCode';
  attemptsLeft?: number;
}> {
  // Find active code
  const verification = await prisma.verification_codes.findFirst({
    where: {
      user_id: userId,
      type,
      used_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: { created_at: 'desc' },
  });

  if (!verification) {
    return {
      valid: false,
      error: 'Код не найден или истёк. Запросите новый код.',
      errorKey: 'telegramCodeMissingOrExpired',
    };
  }

  // Check attempts limit
  if (verification.attempts >= 3) {
    return {
      valid: false,
      error: 'Превышен лимит попыток. Запросите новый код.',
      errorKey: 'telegramAttemptsExceeded',
      attemptsLeft: 0,
    };
  }

  // Increment attempts
  await prisma.verification_codes.update({
    where: { id: verification.id },
    data: { attempts: { increment: 1 } },
  });

  const attemptsLeft = 3 - (verification.attempts + 1);

  // Check code
  if (verification.code !== inputCode) {
    return {
      valid: false,
      error: `Неверный код. Осталось попыток: ${attemptsLeft}`,
      errorKey: 'telegramInvalidCode',
      attemptsLeft,
    };
  }

  // Mark as used
  await prisma.verification_codes.update({
    where: { id: verification.id },
    data: { used_at: new Date() },
  });

  return { valid: true, attemptsLeft };
}

/**
 * Check if user has Telegram linked
 */
export async function isUserTelegramLinked(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { telegram_chat_id: true, two_fa_enabled: true },
  });

  return !!(user?.telegram_chat_id && user?.two_fa_enabled);
}

/**
 * Get Telegram link URL for bot
 */
export function getTelegramLinkUrl(code: string, botUsername?: string): string {
  const username = (botUsername || process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME)?.replace(/^@/, '').trim();
  
  if (!username) {
    throw new Error('NEXT_PUBLIC_TELEGRAM_BOT_USERNAME is not defined');
  }

  return `https://t.me/${username}?start=${encodeURIComponent(code)}`;
}

/**
 * Validate Telegram link code
 */
export async function validateTelegramLinkCode(
  code: string
): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const linkCode = await prisma.telegram_link_codes.findFirst({
    where: {
      code,
      used_at: null,
      expires_at: { gt: new Date() },
    },
  });

  if (!linkCode) {
    return {
      valid: false,
      error: 'Код недействителен или истёк',
    };
  }

  return {
    valid: true,
    userId: linkCode.user_id,
  };
}

export async function consumeTelegramLinkCode(
  code: string,
  telegramChatId: string,
  telegramUsername?: string,
): Promise<{ success: boolean; userId?: string; error?: string }> {
  const now = new Date();

  try {
    return await prisma.$transaction(async (tx) => {
      const linkCode = await tx.telegram_link_codes.findFirst({
        where: {
          code,
          used_at: null,
          expires_at: { gt: now },
        },
        select: { id: true, user_id: true },
      });

      if (!linkCode) {
        return { success: false, error: 'Код привязки недействителен или истёк.' };
      }

      const user = await tx.users.findUnique({
        where: { id: linkCode.user_id },
        select: { id: true, telegram_chat_id: true, two_fa_enabled: true },
      });

      if (!user) {
        return { success: false, error: 'Пользователь не найден.' };
      }

      if (user.telegram_chat_id && user.telegram_chat_id !== telegramChatId && user.two_fa_enabled) {
        return { success: false, error: 'Сначала отключите 2FA в аккаунте перед заменой Telegram.' };
      }

      const existingTelegram = await tx.users.findFirst({
        where: {
          telegram_chat_id: telegramChatId,
          id: { not: user.id },
        },
        select: { id: true },
      });

      if (existingTelegram) {
        return { success: false, error: 'Этот Telegram уже привязан к другому аккаунту.' };
      }

      const claimed = await tx.telegram_link_codes.updateMany({
        where: {
          id: linkCode.id,
          used_at: null,
          expires_at: { gt: now },
        },
        data: { used_at: now },
      });

      if (claimed.count !== 1) {
        return { success: false, error: 'Код привязки уже использован.' };
      }

      await tx.users.update({
        where: { id: user.id },
        data: {
          telegram_chat_id: telegramChatId,
          telegram_username: telegramUsername || null,
          telegram_activated_with_key: null,
          two_fa_enabled: true,
        },
      });

      return { success: true, userId: user.id };
    });
  } catch (error) {
    logger.error('Telegram link code consumption failed', error);
    return { success: false, error: 'Не удалось привязать Telegram. Попробуйте ещё раз.' };
  }
}

/**
 * Cleanup expired codes (should be run as cron job)
 */
export async function cleanupExpiredCodes(): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const result = await prisma.$transaction([
    // Delete old verification codes
    prisma.verification_codes.deleteMany({
      where: {
        created_at: { lt: oneDayAgo },
      },
    }),
    // Delete old telegram link codes
    prisma.telegram_link_codes.deleteMany({
      where: {
        created_at: { lt: oneDayAgo },
      },
    }),
  ]);

  const totalDeleted = result[0].count + result[1].count;
  
  if (totalDeleted > 0) {
    logger.info(`🧹 Cleaned up ${totalDeleted} expired codes`);
  }

  return totalDeleted;
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format as +X (XXX) XXX-XX-XX
  if (cleaned.length === 12 && cleaned.startsWith('996')) {
    return `+${cleaned.slice(0, 3)} (${cleaned.slice(3, 6)}) ${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}-${cleaned.slice(11)}`;
  }
  
  return phone;
}

/**
 * Escape HTML for Telegram messages
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Rate limiting check for code generation
 */
export async function checkCodeGenerationRateLimit(
  userId: string,
  windowMinutes: number = 5,
  maxCodes: number = 3
): Promise<{ allowed: boolean; error?: string }> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  const recentCodes = await prisma.verification_codes.count({
    where: {
      user_id: userId,
      created_at: { gte: windowStart },
    },
  });

  if (recentCodes >= maxCodes) {
    return {
      allowed: false,
      error: `Слишком много запросов кода. Попробуйте через ${windowMinutes} минут.`,
    };
  }

  return { allowed: true };
}
