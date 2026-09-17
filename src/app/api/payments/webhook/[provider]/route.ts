import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

type WebhookPayload = { eventId?: string; paymentId?: string; orderId?: string; status?: 'authorized' | 'paid' | 'failed' | 'refunded' | 'chargeback'; amount?: string; currency?: string };

function validSignature(raw: string, signature: string | null, secret: string): boolean {
  if (!signature) return false;
  const expected = createHmac('sha256', secret).update(raw).digest('hex');
  const actual = signature.replace(/^sha256=/, '');
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const secret = process.env.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret) return NextResponse.json({ error: 'Payment webhook is not configured' }, { status: 503 });
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get('x-payment-signature'), secret)) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  let body: WebhookPayload;
  try { body = JSON.parse(raw) as WebhookPayload; } catch { return NextResponse.json({ error: 'Invalid payload' }, { status: 400 }); }
  if (!body.eventId || !body.paymentId || !body.status) return NextResponse.json({ error: 'eventId, paymentId and status are required' }, { status: 400 });
  const payment = await prisma.payments.findUnique({ where: { id: body.paymentId }, select: { id: true, order_id: true, amount: true, currency: true, status: true, tenant_id: true, provider_event_id: true, captured_amount: true, refunded_amount: true, chargeback_amount: true } });
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  if (payment.provider_event_id === body.eventId) return NextResponse.json({ success: true, duplicate: true });
  let eventAmount: Prisma.Decimal;
  try { eventAmount = body.amount ? new Prisma.Decimal(body.amount) : payment.amount; } catch { return NextResponse.json({ error: 'Invalid amount' }, { status: 400 }); }
  if (eventAmount.lte(0) || eventAmount.gt(payment.amount)) return NextResponse.json({ error: 'Amount mismatch' }, { status: 409 });
  const availableCaptured = payment.captured_amount.sub(payment.refunded_amount).sub(payment.chargeback_amount);
  if (body.status === 'paid' && payment.captured_amount.add(eventAmount).gt(payment.amount)) return NextResponse.json({ error: 'Capture exceeds payment amount' }, { status: 409 });
  if ((body.status === 'refunded' || body.status === 'chargeback') && eventAmount.gt(availableCaptured)) return NextResponse.json({ error: 'Refund exceeds captured amount' }, { status: 409 });
  if (body.currency && body.currency !== payment.currency) return NextResponse.json({ error: 'Currency mismatch' }, { status: 409 });
  const orderPaymentStatus = body.status === 'paid' ? 'paid' : body.status === 'refunded' || body.status === 'chargeback' ? 'refunded' : body.status === 'failed' ? 'failed' : 'pending';
  const payloadHash = createHash('sha256').update(raw).digest('hex');
  try {
    await prisma.$transaction(async (tx) => {
      await tx.payment_events.create({ data: { payment_id: payment.id, tenant_id: payment.tenant_id, provider, event_id: body.eventId!, event_type: body.status!, status: body.status!, amount: eventAmount, currency: payment.currency, payload_hash: payloadHash, payload: body as Prisma.InputJsonValue } });
      await tx.payments.update({ where: { id: payment.id }, data: { provider, provider_event_id: body.eventId, status: body.status, provider_payment_id: body.paymentId, captured_amount: body.status === 'paid' ? { increment: eventAmount } : undefined, refunded_amount: body.status === 'refunded' ? { increment: eventAmount } : undefined, chargeback_amount: body.status === 'chargeback' ? { increment: eventAmount } : undefined, paid_at: body.status === 'paid' ? new Date() : undefined } });
      await tx.orders.update({ where: { id: payment.order_id }, data: { payment_status: orderPaymentStatus } });
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return NextResponse.json({ success: true, duplicate: true });
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}