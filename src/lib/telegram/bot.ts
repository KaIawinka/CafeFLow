/**
 * Telegram Bot Instance
 * Manages bot initialization and core functionality
 */

import { Bot, webhookCallback } from 'grammy';
import type { Context } from 'grammy';

// Validate environment variables
if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Custom context type for type safety
export interface BotContext extends Context {
  // Can extend with custom properties if needed
}

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
export const webhookHandler = webhookCallback(bot, 'std-http');

/**
 * Set webhook URL
 */
export async function setWebhook(url: string, secretToken?: string) {
  try {
    await bot.api.setWebhook(url, {
      secret_token: secretToken,
      allowed_updates: ['message', 'callback_query'],
    });
    console.log(`✅ Webhook set to: ${url}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to set webhook:', error);
    return false;
  }
}

/**
 * Delete webhook (for development with long polling)
 */
export async function deleteWebhook() {
  try {
    await bot.api.deleteWebhook();
    console.log('✅ Webhook deleted');
    return true;
  } catch (error) {
    console.error('❌ Failed to delete webhook:', error);
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
    console.error('❌ Failed to get webhook info:', error);
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
  console.log('🤖 Starting bot with long polling...');
  await bot.start();
}

/**
 * Stop bot
 */
export async function stopBot() {
  await bot.stop();
  console.log('🛑 Bot stopped');
}

// Handle errors
bot.catch((err) => {
  console.error('Bot error:', err);
});

export default bot;
