/**
 * Telegram Bot Instance
 * Manages bot initialization and core functionality
 */

import { Bot, webhookCallback } from 'grammy';
import type { Context } from 'grammy';
import { logger } from '@/lib/logger';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN?.trim();

// Custom context type for type safety
export type BotContext = Context;

export const bot = BOT_TOKEN ? new Bot<BotContext>(BOT_TOKEN) : null;

export function getTelegramBot(): Bot<BotContext> {
  if (!bot) {
    throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
  }
  return bot;
}

// Bot info (cached)
let botInfo: { username: string; id: number } | null = null;

/**
 * Get bot information
 */
export async function getBotInfo() {
  if (!bot) return null;

  if (!botInfo) {
    const me = await bot.api.getMe();
    botInfo = {
      username: me.username || '',
      id: me.id,
    };
  }
  return botInfo;
}

/**
 * Webhook callback for Next.js API route
 */
type WebhookHandler = ReturnType<typeof webhookCallback<BotContext, 'next-js'>>;

export const webhookHandler: WebhookHandler = bot
  ? webhookCallback(bot, 'next-js')
  : async () => {
      throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
    };

/**
 * Set webhook URL
 */
export async function setWebhook(url: string, secretToken?: string) {
  try {
    const telegramBot = getTelegramBot();
    await telegramBot.api.setWebhook(url, {
      secret_token: secretToken,
      allowed_updates: ['message', 'callback_query'],
    });
    logger.info('Webhook set successfully', { url });
    return true;
  } catch (error) {
    logger.error('Failed to set webhook', error);
    return false;
  }
}

export async function configureBotProfile() {
  const telegramBot = getTelegramBot();
  await telegramBot.api.setMyName('🍽 CaféFlow Bot');
  await telegramBot.api.setMyDescription(
    '🍽 CaféFlow — система управления рестораном\n\n' +
    '✨ Возможности:\n' +
    '• Безопасная авторизация через Telegram\n' +
    '• Двухфакторная аутентификация (2FA)\n' +
    '• Управление пользователями и ролями\n' +
    '• Уведомления о заказах и бронированиях\n' +
    '• Доступ к админ-панели\n\n' +
    '🔐 Безопасность превыше всего!\n' +
    'Коды действуют только 5 минут.'
  );
  await telegramBot.api.setMyShortDescription('🍽 CaféFlow — управление рестораном и безопасная авторизация');
  await telegramBot.api.setMyCommands([
    { command: 'start', description: '🏠 Начать работу с ботом' },
    { command: 'activate', description: '🔑 Активировать аккаунт по ключу' },
    { command: 'login', description: '🔐 Получить ссылку для входа' },
    { command: 'status', description: '📊 Проверить статус активации' },
    { command: 'admin', description: '👑 Команды администратора' },
    { command: 'help', description: '❓ Справка по командам' },
  ]);
  logger.info('Telegram bot profile configured');
}

/**
 * Delete webhook (for development with long polling)
 */
export async function deleteWebhook() {
  try {
    const telegramBot = getTelegramBot();
    await telegramBot.api.deleteWebhook();
    logger.info('Webhook deleted');
    return true;
  } catch (error) {
    logger.error('Failed to delete webhook', error);
    return false;
  }
}

/**
 * Get webhook info
 */
export async function getWebhookInfo() {
  if (!bot) return null;

  try {
    const info = await bot.api.getWebhookInfo();
    return info;
  } catch (error) {
    logger.error('Failed to get webhook info', error);
    return null;
  }
}

/**
 * Start bot with long polling (development only)
 */
export async function startPolling() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Long polling should not be used in production. Use webhooks instead.');
  }
  
  await deleteWebhook();
  logger.info('Starting bot with long polling');
  await getTelegramBot().start();
}

/**
 * Stop bot
 */
export async function stopBot() {
  await getTelegramBot().stop();
  logger.info('Bot stopped');
}

// Handle errors
bot?.catch((err) => {
  logger.error('Bot error', err);
});

export default bot;
