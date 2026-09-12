/**
 * Telegram Message Templates and Sending Functions
 */

import { bot } from './bot';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Send 2FA verification code to user
 */
export async function sendVerificationCode(
  userId: string,
  code: string,
  attemptsLeft: number = 3
): Promise<{ success: boolean; error?: string }> {
  try {
    // Get user's telegram chat ID
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { telegram_chat_id: true, display_name: true, email: true },
    });

    if (!user?.telegram_chat_id) {
      return {
        success: false,
        error: 'Telegram не привязан к аккаунту',
      };
    }

    // Format message
    const message = formatVerificationMessage(code, attemptsLeft);

    // Send message
    await bot.api.sendMessage(user.telegram_chat_id, message, {
      parse_mode: 'HTML',
    });

    return { success: true };
  } catch (error) {
    logger.error('Error sending verification code', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Format verification code message
 */
export function formatVerificationMessage(
  code: string,
  attemptsLeft: number = 3
): string {
  return (
    `🔐 <b>Код для входа в CaféFlow Admin</b>\n\n` +
    `Ваш код: <code>${code}</code>\n\n` +
    `⏰ Действителен <b>5 минут</b>\n` +
    `🔢 Осталось попыток: <b>${attemptsLeft}</b>\n\n` +
    `⚠️ Если это не вы, немедленно свяжитесь с администратором!\n\n` +
    `<i>Никому не сообщайте этот код</i>`
  );
}

/**
 * Send account linked notification
 */
export async function sendAccountLinkedNotification(
  chatId: string,
  userName: string,
  userEmail: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const message =
      `✅ <b>Аккаунт успешно привязан</b>\n\n` +
      `👤 ${userName}\n` +
      `📧 ${userEmail}\n\n` +
      `🔐 Двухфакторная аутентификация активирована\n\n` +
      `Теперь при входе вы будете получать коды в этот бот.\n\n` +
      `Используйте /status для проверки статуса`;

    await bot.api.sendMessage(chatId, message, {
      parse_mode: 'HTML',
    });

    return { success: true };
  } catch (error) {
    logger.error('Error sending linked notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send login alert (successful login notification)
 */
export async function sendLoginAlert(
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { telegram_chat_id: true },
    });

    if (!user?.telegram_chat_id) {
      return { success: false, error: 'Telegram not linked' };
    }

    const timestamp = new Date().toLocaleString('ru-RU', {
      timeZone: 'Asia/Bishkek',
      dateStyle: 'short',
      timeStyle: 'short',
    });

    const message =
      `✅ <b>Успешный вход в систему</b>\n\n` +
      `🕐 ${timestamp}\n` +
      `🌐 IP: <code>${ipAddress}</code>\n` +
      `💻 ${userAgent.substring(0, 50)}...\n\n` +
      `Если это были не вы, немедленно свяжитесь с администратором!`;

    await bot.api.sendMessage(user.telegram_chat_id, message, {
      parse_mode: 'HTML',
    });

    return { success: true };
  } catch (error) {
    logger.error('Error sending login alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send security alert (suspicious activity)
 */
export async function sendSecurityAlert(
  userId: string,
  alertType: 'failed_attempts' | 'ip_blocked' | 'password_changed' | 'telegram_unlinked',
  details: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { telegram_chat_id: true },
    });

    if (!user?.telegram_chat_id) {
      return { success: false, error: 'Telegram not linked' };
    }

    const alertEmoji = {
      failed_attempts: '⚠️',
      ip_blocked: '🚫',
      password_changed: '🔑',
      telegram_unlinked: '🔓',
    };

    const alertTitle = {
      failed_attempts: 'Множественные неудачные попытки входа',
      ip_blocked: 'IP адрес заблокирован',
      password_changed: 'Пароль изменён',
      telegram_unlinked: 'Telegram отвязан от аккаунта',
    };

    const message =
      `${alertEmoji[alertType]} <b>${alertTitle[alertType]}</b>\n\n` +
      `${details}\n\n` +
      `🕐 ${new Date().toLocaleString('ru-RU')}\n\n` +
      `⚠️ Если это были не вы, <b>немедленно</b> обратитесь к администратору!`;

    await bot.api.sendMessage(user.telegram_chat_id, message, {
      parse_mode: 'HTML',
    });

    return { success: true };
  } catch (error) {
    logger.error('Error sending security alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send system notification to admin
 */
export async function sendAdminNotification(
  message: string,
  adminUserId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // If specific admin provided, send to them
    if (adminUserId) {
      const user = await prisma.users.findUnique({
        where: { id: adminUserId },
        select: { telegram_chat_id: true },
      });

      if (user?.telegram_chat_id) {
        await bot.api.sendMessage(user.telegram_chat_id, message, {
          parse_mode: 'HTML',
        });
        return { success: true };
      }
    }

    // Otherwise send to all admins with Telegram linked
    const admins = await prisma.users.findMany({
      where: {
        role: 'admin',
        telegram_chat_id: { not: null },
        status: 'active',
      },
      select: { telegram_chat_id: true },
    });

    for (const admin of admins) {
      if (admin.telegram_chat_id) {
        await bot.api.sendMessage(admin.telegram_chat_id, message, {
          parse_mode: 'HTML',
        });
      }
    }

    return { success: true };
  } catch (error) {
    logger.error('Error sending admin notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test bot connection by sending a message to a chat
 */
export async function testBotConnection(chatId: string): Promise<boolean> {
  try {
    await bot.api.sendMessage(chatId, '✅ Бот работает!');
    return true;
  } catch (error) {
    logger.error('Bot connection test failed:', error);
    return false;
  }
}
