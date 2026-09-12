/**
 * Telegram Webhook Endpoint
 * Receives updates from Telegram and processes them
 */

import { NextRequest, NextResponse } from 'next/server';
import { webhookHandler } from '@/lib/telegram/bot';

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
      console.error('❌ Invalid webhook secret token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get request body
    const body = await request.json();

    // Process update with grammy
    await webhookHandler(request as any, {
      status: (code: number) => ({ json: (data: any) => ({ code, data }) }),
      json: (data: any) => data,
    } as any);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
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
