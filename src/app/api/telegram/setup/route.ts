/**
 * Telegram Bot Setup Endpoint
 * Used to configure webhook and get bot info
 */

import { NextRequest, NextResponse } from 'next/server';
import { setWebhook, deleteWebhook, getWebhookInfo, getBotInfo } from '@/lib/telegram/bot';
import { logger } from '@/lib/logger';

/**
 * POST /api/telegram/setup
 * Setup or delete webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow with admin token
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.ADMIN_SETUP_TOKEN;

    if (adminToken && authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action as 'set' | 'delete';

    if (action === 'set') {
      const webhookUrl = body.url || `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
      const secretToken = process.env.TELEGRAM_WEBHOOK_SECRET;

      const result = await setWebhook(webhookUrl, secretToken);

      if (result) {
        logger.info('Webhook set successfully', { url: webhookUrl });
        return NextResponse.json({
          success: true,
          message: 'Webhook set successfully',
          url: webhookUrl,
        });
      } else {
        logger.error('Failed to set webhook');
        return NextResponse.json(
          { error: 'Failed to set webhook' },
          { status: 500 }
        );
      }
    } else if (action === 'delete') {
      const result = await deleteWebhook();

      if (result) {
        logger.info('Webhook deleted successfully');
        return NextResponse.json({
          success: true,
          message: 'Webhook deleted successfully',
        });
      } else {
        logger.error('Failed to delete webhook');
        return NextResponse.json(
          { error: 'Failed to delete webhook' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Setup error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram/setup
 * Get current webhook info and bot info
 */
export async function GET(request: NextRequest) {
  try {
    // Only allow with admin token in production
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.ADMIN_SETUP_TOKEN;

    if (process.env.NODE_ENV === 'production' && adminToken && authHeader !== `Bearer ${adminToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [webhookInfo, botInfo] = await Promise.all([
      getWebhookInfo(),
      getBotInfo(),
    ]);

    return NextResponse.json({
      bot: botInfo,
      webhook: webhookInfo,
      env: {
        app_url: process.env.NEXT_PUBLIC_APP_URL,
        has_webhook_secret: !!process.env.TELEGRAM_WEBHOOK_SECRET,
        has_bot_token: !!process.env.TELEGRAM_BOT_TOKEN,
      },
    });
  } catch (error) {
    logger.error('Get info error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
