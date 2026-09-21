import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { canCustomerCancelOrder, canTransitionOrderStatus, type OrderStatus } from '@/lib/orders/status';
import { apiError, apiUserMessage } from '@/lib/api-response';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload) return apiError(request, 'unauthorized', 401);

  const body = await request.json().catch(() => ({})) as { action?: 'cancel' | 'problem'; reason?: string };
  const reason = body.reason?.trim() || '';
  const { id } = await params;
  const order = await prisma.orders.findFirst({
    where: { id, user_id: payload.userId },
    select: { id: true, tenant_id: true, order_number: true, status: true, payment_status: true, status_history: true },
  });
  if (!order) return NextResponse.json({ error: apiUserMessage(request, 'orderNotFound') }, { status: 404 });

  if (body.action === 'cancel') {
    if (!canCustomerCancelOrder(order.status as OrderStatus) || !canTransitionOrderStatus(order.status as OrderStatus, 'cancelled')) {
      return NextResponse.json({ error: apiUserMessage(request, 'orderCannotCancel') }, { status: 409 });
    }
    const now = new Date();
    const history = Array.isArray(order.status_history) ? order.status_history : [];
    const updated = await prisma.$transaction(async (tx) => {
      const changedCount = await tx.orders.updateMany({
        where: { id: order.id, user_id: payload.userId, status: order.status },
        data: {
          status: 'cancelled',
          cancelled_at: now,
          status_history: [...history, { from: order.status, to: 'cancelled', changedAt: now.toISOString(), changedBy: payload.userId, reason: reason || 'Отменено клиентом' }],
        },
      });
      if (changedCount.count !== 1) throw new Error('ORDER_CANCEL_CONFLICT');
      const changed = await tx.orders.findUnique({ where: { id: order.id }, select: { id: true, order_number: true, status: true, payment_status: true, cancelled_at: true } });
      if (!changed) throw new Error('ORDER_CANCEL_CONFLICT');
      const staff = await tx.users.findMany({ where: { tenant_id: order.tenant_id, status: 'active', role: { in: ['admin', 'manager', 'kitchen', 'employee'] } }, select: { id: true } });
      if (staff.length) await tx.notifications.createMany({ data: staff.map((member) => ({ tenant_id: order.tenant_id, user_id: member.id, channel: 'in_app' as const, type: 'order_status' as const, subject: 'Заказ отменён клиентом', body: `Заказ ${order.order_number} отменён клиентом`, status: 'queued' as const, attempts: 0 })) });
      return changed;
    }).catch((error) => {
      if (error instanceof Error && error.message === 'ORDER_CANCEL_CONFLICT') return null;
      throw error;
    });
    if (!updated) return NextResponse.json({ error: apiUserMessage(request, 'orderCancelConflict') }, { status: 409 });
    await prisma.activity_logs.create({ data: { tenant_id: order.tenant_id, actor_user_id: payload.userId, action: 'customer.order.cancelled', entity_type: 'orders', entity_id: order.id, before_data: order, after_data: updated } });
    return NextResponse.json({ order: updated });
  }

  if (body.action === 'problem') {
    if (!reason || reason.length > 500) return NextResponse.json({ error: apiUserMessage(request, 'problemTooLong') }, { status: 400 });
    if (order.status === 'cancelled') return NextResponse.json({ error: apiUserMessage(request, 'problemOnCancelledOrder') }, { status: 409 });
    const updated = await prisma.orders.update({ where: { id: order.id }, data: { problem: reason }, select: { id: true, order_number: true, status: true, problem: true } });
    await prisma.activity_logs.create({ data: { tenant_id: order.tenant_id, actor_user_id: payload.userId, action: 'customer.order.problem_reported', entity_type: 'orders', entity_id: order.id, before_data: { problem: null }, after_data: updated } });
    return NextResponse.json({ order: updated }, { status: 201 });
  }

  return NextResponse.json({ error: apiUserMessage(request, 'orderActionInvalid') }, { status: 400 });
}