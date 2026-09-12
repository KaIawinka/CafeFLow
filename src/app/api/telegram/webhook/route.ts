/**
 * Telegram Webhook Endpoint
 * Receives updates from Telegram and processes them
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Update } from '@grammyjs/types';
import { webhookHandler } from '@/lib/telegram/bot';
import { logger } from '@/lib/logger';

// Import handlers to register commands
import '@/lib/telegram/handlers';

/**
 * POST /api/telegram/webhook
 * Telegram sends updates here
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret token
    const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
    const expectedToken = process.env.TELEGRAM_WEBHOOK_SECRET;

    if (expectedToken && secretToken !== expectedToken) {
      logger.warn('Invalid webhook secret token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as Update;
    const headers = Object.fromEntries(request.headers.entries());

    type WebhookResponse = {
      end: (callback?: () => void) => WebhookResponse;
      status: (code: number) => WebhookResponse;
      json: (data: string) => WebhookResponse;
      send: (data: string) => WebhookResponse;
    };

    let responseStatus = 200;
    let responseBody: string | undefined;
    const response: WebhookResponse = {
      end: (callback) => {
        callback?.();
        return response;
      },
      status: (code) => {
        responseStatus = code;
        return response;
      },
      json: (data) => {
        responseBody = data;
        return response;
      },
      send: (data) => {
        responseBody = data;
        return response;
      },
    };

    // Process update with grammy
    await webhookHandler({ body, headers }, response);

    return new NextResponse(responseBody, { status: responseStatus });
  } catch (error) {
    logger.error('Webhook error', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/telegram/webhook
 * Check webhook status
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    message: 'Telegram webhook endpoint',
  });
}
