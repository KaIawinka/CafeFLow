/**
 * Telegram Bot Setup Endpoint
 * Used to configure webhook and get bot info
 */

import { NextRequest, NextResponse } from 'next/server';
import { setWebhook, deleteWebhook, getWebhookInfo, getBotInfo, configureBotProfile } from '@/lib/telegram/bot';
import { logger } from '@/lib/logger';
import { getRequiredServerSecret } from '@/lib/config';

function hasSetupAuthorization(request: NextRequest): boolean {
  try {
    return request.headers.get('authorization') === `Bearer ${getRequiredServerSecret('ADMIN_SETUP_TOKEN')}`;
  } catch {
    return false;
  }
}

/**
 * POST /api/telegram/setup
 * Setup or delete webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Only allow with admin token
    if (!hasSetupAuthorization(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action as 'set' | 'delete';

    if (action === 'set') {
      const webhookUrl = body.url || `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram/webhook`;
      const secretToken = getRequiredServerSecret('TELEGRAM_WEBHOOK_SECRET');

      if (!webhookUrl || !/^https:\/\//i.test(webhookUrl) || /localhost|127\.0\.0\.1/i.test(webhookUrl)) {
        return NextResponse.json(
          { error: 'Webhook URL must be a public HTTPS URL. Use ngrok for local development.' },
          { status: 400 }
        );
      }

      await configureBotProfile();
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
    // Protect bot status in every environment when a setup token is configured.
    if (!hasSetupAuthorization(request)) {
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
