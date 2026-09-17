import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';

const allowed = ['pending', 'authorized', 'paid', 'failed', 'refunded', 'partial'] as const;
type PaymentStatus = (typeof allowed)[number];

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await verifyAdminOrManager(request, 'manage_payments');
  if (!auth.success || !auth.userId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { orderId } = await params;
  const body = await request.json().catch(() => ({})) as { status?: PaymentStatus; amount?: string; reason?: string };
  if (!body.status || !allowed.includes(body.status)) return NextResponse.json({ error: 'Недопустимый статус оплаты' }, { status: 400 });
  if (!auth.tenantId) return NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 });
  const payment = await prisma.payments.findFirst({ where: { order_id: orderId, tenant_id: auth.tenantId, order: auth.branchIds ? { branch_id: { in: auth.branchIds } } : auth.branchId ? { branch_id: auth.branchId } : undefined }, include: { order: { select: { id: true, total: true, payment_status: true } } } });
  if (!payment) return NextResponse.json({ error: 'Платёж не найден' }, { status: 404 });
  if (['refunded', 'failed'].includes(payment.status) && body.status === 'paid') return NextResponse.json({ error: 'Нельзя вернуть платёж в paid' }, { status: 409 });
  const amount = body.amount ? new Prisma.Decimal(body.amount) : payment.amount;
  if (amount.lt(0) || amount.gt(payment.order.total)) return NextResponse.json({ error: 'Некорректная сумма платежа' }, { status: 400 });
  const transactionStatus = body.status === 'partial' ? 'paid' : body.status;
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.payments.update({ where: { id: payment.id }, data: { status: transactionStatus, amount, operation: body.status === 'refunded' ? 'refund' : body.status === 'paid' || body.status === 'partial' ? 'capture' : payment.operation, paid_at: body.status === 'paid' || body.status === 'partial' ? new Date() : payment.paid_at } });
    await tx.orders.update({ where: { id: orderId }, data: { payment_status: body.status === 'refunded' ? 'refunded' : body.status === 'paid' ? 'paid' : body.status === 'partial' ? 'partial' : body.status === 'failed' ? 'failed' : 'pending' } });
    await tx.activity_logs.create({ data: { tenant_id: auth.tenantId, actor_user_id: auth.userId, action: 'admin.payment.status_changed', entity_type: 'payments', entity_id: payment.id, before_data: { status: payment.status, amount: payment.amount }, after_data: { status: changed.status, amount: changed.amount, reason: body.reason || null } } });
    return changed;
  });
  return NextResponse.json({ payment: { id: updated.id, status: updated.status, amount: updated.amount, paid_at: updated.paid_at } });
}