import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';
import { canTransitionDeliveryStatus, deliveryRequiresCourier, deliveryStatuses, isDeliveryRetry, type DeliveryStatus } from '@/lib/orders/delivery-status';
import { canTransitionOrderStatus, type OrderStatus } from '@/lib/orders/status';

type DeliveryPatch = {
  status?: DeliveryStatus;
  courierUserId?: string | null;
  promisedAt?: string | null;
  trackingCode?: string | null;
  reason?: string;
};

function branchScope(auth: { branchIds?: string[] | null; branchId?: string | null }) {
  return auth.branchIds ? { branch_id: { in: auth.branchIds } } : auth.branchId ? { branch_id: auth.branchId } : {};
}

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item));
}

function parseDate(value: string | null | undefined) {
  if (value === undefined || value === null) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function statusMessage(status: DeliveryStatus) {
  return { pending: 'ожидает назначения', assigned: 'назначена курьеру', delivering: 'в пути', delivered: 'доставлена', failed: 'не выполнена' }[status];
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await verifyAdminOrManager(request, 'manage_orders');
  if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { orderId } = await params;
  const delivery = await prisma.order_deliveries.findFirst({
    where: { order_id: orderId, order: { tenant_id: auth.tenantId, ...branchScope(auth) } },
    include: {
      order: { select: { id: true, order_number: true, branch_id: true, status: true, payment_status: true, customer_name: true, customer_phone: true, user_id: true, status_history: true } },
      courier: { select: { id: true, first_name: true, last_name: true, phone: true } },
      zone: { select: { id: true, name: true, estimated_minutes: true } },
      events: { orderBy: { created_at: 'asc' }, include: { actor: { select: { id: true, first_name: true, last_name: true } } } },
    },
  });
  if (!delivery) return NextResponse.json({ error: 'Доставка не найдена' }, { status: 404 });
  return NextResponse.json(serialize({ delivery }));
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await verifyAdminOrManager(request, 'manage_orders');
  if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { orderId } = await params;
  const body = await request.json().catch(() => null) as DeliveryPatch | null;
  if (!body || (body.status !== undefined && !deliveryStatuses.includes(body.status)) || (body.courierUserId !== undefined && body.courierUserId !== null && (typeof body.courierUserId !== 'string' || !body.courierUserId.trim())) || (body.trackingCode !== undefined && body.trackingCode !== null && (typeof body.trackingCode !== 'string' || body.trackingCode.trim().length > 100)) || (body.reason !== undefined && (typeof body.reason !== 'string' || body.reason.trim().length > 500))) return NextResponse.json({ error: 'Некорректные данные доставки' }, { status: 400 });
  const promisedAt = parseDate(body.promisedAt);
  if (body.promisedAt !== undefined && promisedAt === undefined) return NextResponse.json({ error: 'Некорректное обещанное время' }, { status: 400 });
  const delivery = await prisma.order_deliveries.findFirst({
    where: { order_id: orderId, order: { tenant_id: auth.tenantId, ...branchScope(auth) } },
    include: { order: { select: { id: true, tenant_id: true, branch_id: true, order_number: true, status: true, status_history: true, user_id: true } } },
  });
  if (!delivery) return NextResponse.json({ error: 'Доставка не найдена' }, { status: 404 });
  const currentStatus = delivery.status as DeliveryStatus;
  const nextStatus = body.status || (body.courierUserId ? 'assigned' : currentStatus);
  if (!canTransitionDeliveryStatus(currentStatus, nextStatus)) return NextResponse.json({ error: 'Недопустимый переход доставки' }, { status: 409 });
  const courierUserId = body.courierUserId === undefined ? delivery.courier_user_id : body.courierUserId;
  if (deliveryRequiresCourier(nextStatus) && !courierUserId) return NextResponse.json({ error: 'Для этого статуса требуется курьер' }, { status: 409 });
  if (nextStatus === 'failed' && !body.reason?.trim()) return NextResponse.json({ error: 'Укажите причину проблемы с доставкой' }, { status: 400 });

  let courier: { id: string; first_name: string; last_name: string | null; phone: string | null } | null = null;
  if (courierUserId) {
    courier = await prisma.users.findFirst({
      where: {
        id: courierUserId,
        tenant_id: auth.tenantId,
        status: 'active',
        role: { in: ['employee', 'manager'] },
        ...(delivery.order.branch_id ? { branch_memberships: { some: { branch_id: delivery.order.branch_id, status: 'active' } } } : {}),
      },
      select: { id: true, first_name: true, last_name: true, phone: true },
    });
    if (!courier) return NextResponse.json({ error: 'Курьер не найден в доступном филиале' }, { status: 404 });
  }

  const now = new Date();
  try {
    const updated = await prisma.$transaction(async (tx) => {
      let nextOrderStatus: OrderStatus | null = null;
      if (nextStatus === 'delivering' && delivery.order.status !== 'delivering') nextOrderStatus = 'delivering';
      if (nextStatus === 'delivered' && delivery.order.status !== 'completed') nextOrderStatus = 'completed';
      if (nextOrderStatus && !canTransitionOrderStatus(delivery.order.status as OrderStatus, nextOrderStatus)) throw new Error('ORDER_STATUS_CONFLICT');

      const changed = await tx.order_deliveries.update({
        where: { id: delivery.id },
        data: {
          status: nextStatus,
          ...(body.courierUserId !== undefined ? { courier_user_id: courierUserId, courier_name: courier ? [courier.first_name, courier.last_name].filter(Boolean).join(' ') : null, courier_phone: courier?.phone || null } : {}),
          ...(body.promisedAt !== undefined ? { promised_at: promisedAt } : {}),
          ...(body.trackingCode !== undefined ? { tracking_code: body.trackingCode?.trim() || null } : {}),
          ...(nextStatus === 'assigned' && currentStatus !== 'assigned' ? { assigned_at: now } : {}),
          ...(nextStatus === 'delivering' && currentStatus !== 'delivering' ? { picked_up_at: now } : {}),
          ...(nextStatus === 'delivered' && currentStatus !== 'delivered' ? { delivered_at: now, failure_reason: null } : {}),
          ...(nextStatus === 'failed' ? { failed_at: now, failure_reason: body.reason?.trim() } : {}),
          ...(isDeliveryRetry(currentStatus, nextStatus) ? { retry_count: { increment: 1 }, failed_at: null, failure_reason: null } : {}),
        },
        include: { courier: { select: { id: true, first_name: true, last_name: true, phone: true } } },
      });
      if (nextStatus !== currentStatus) {
        await tx.order_delivery_events.create({ data: { delivery_id: delivery.id, from_status: currentStatus, to_status: nextStatus, actor_user_id: auth.userId, reason: body.reason?.trim() || null } });
      }
      if (nextOrderStatus) {
        const history = Array.isArray(delivery.order.status_history) ? delivery.order.status_history : [];
        await tx.orders.update({ where: { id: orderId }, data: { status: nextOrderStatus, status_history: [...history, { from: delivery.order.status, to: nextOrderStatus, changedAt: now.toISOString(), changedBy: auth.userId }], ...(nextOrderStatus === 'completed' ? { completed_at: now } : {}) } });
      }
      if (nextStatus === 'failed' || isDeliveryRetry(currentStatus, nextStatus)) {
        await tx.orders.update({ where: { id: orderId }, data: { problem: nextStatus === 'failed' ? body.reason?.trim() : null } });
      }
      const recipients = [delivery.order.user_id, courierUserId].filter((id): id is string => Boolean(id));
      if (recipients.length) await tx.notifications.createMany({ data: recipients.map((userId) => ({ tenant_id: auth.tenantId!, user_id: userId, channel: 'in_app' as const, type: 'order_status' as const, subject: 'Статус доставки', body: `Доставка заказа ${delivery.order.order_number} ${statusMessage(nextStatus)}`, status: 'queued' as const, attempts: 0 })) });
      await tx.activity_logs.create({ data: { tenant_id: auth.tenantId!, actor_user_id: auth.userId, action: 'admin.delivery.updated', entity_type: 'order_deliveries', entity_id: delivery.id, before_data: { status: currentStatus, courierUserId: delivery.courier_user_id }, after_data: { status: nextStatus, courierUserId, reason: body.reason?.trim() || null } } });
      return changed;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json(serialize({ delivery: updated }));
  } catch (error) {
    if (error instanceof Error && error.message === 'ORDER_STATUS_CONFLICT') return NextResponse.json({ error: 'Статус заказа не позволяет изменить доставку' }, { status: 409 });
    throw error;
  }
}