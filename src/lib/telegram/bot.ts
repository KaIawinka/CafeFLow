/**
 * Telegram Bot Instance
 * Manages bot initialization and core functionality
 */

import { Bot, webhookCallback } from 'grammy';
import type { Context } from 'grammy';
import { logger } from '@/lib/logger';

// Validate environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Custom context type for type safety
export type BotContext = Context;

// Create bot instance
export const bot = new Bot<BotContext>(BOT_TOKEN);

// Bot info (cached)
let botInfo: { username: string; id: number } | null = null;

/**
 * Get bot information
 */
export async function getBotInfo() {
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
export const webhookHandler = webhookCallback(bot, 'next-js');

/**
 * Set webhook URL
 */
export async function setWebhook(url: string, secretToken?: string) {
  try {
    await bot.api.setWebhook(url, {
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
  await bot.api.setMyDescription(
    'CaféFlow: безопасный вход, уведомления и управление рестораном через Telegram.'
  );
  await bot.api.setMyShortDescription('CaféFlow: вход и управление рестораном');
  await bot.api.setMyCommands([
    { command: 'start', description: 'Начать работу с ботом' },
    { command: 'activate', description: 'Привязать аккаунт по ключу' },
    { command: 'login', description: 'Получить ссылку для входа' },
    { command: 'status', description: 'Проверить статус аккаунта' },
    { command: 'admin', description: 'Команды администратора' },
    { command: 'help', description: 'Показать справку' },
  ]);
  logger.info('Telegram bot profile configured');
}

/**
 * Delete webhook (for development with long polling)
 */
export async function deleteWebhook() {
  try {
    await bot.api.deleteWebhook();
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
  await bot.start();
}

/**
 * Stop bot
 */
export async function stopBot() {
  await bot.stop();
  logger.info('Bot stopped');
}

// Handle errors
bot.catch((err) => {
  logger.error('Bot error', err);
});

export default bot;
