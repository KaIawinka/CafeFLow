import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';
import { canTransitionDeliveryStatus, deliveryStatuses, type DeliveryStatus } from '@/lib/orders/delivery-status';

export async function GET(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await verifyAdminOrManager(request, 'manage_orders');
  if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { orderId } = await params;
  const delivery = await prisma.order_deliveries.findFirst({
    where: { order_id: orderId, order: { tenant_id: auth.tenantId, ...(auth.branchIds ? { branch_id: { in: auth.branchIds } } : auth.branchId ? { branch_id: auth.branchId } : {}) } },
    include: { courier: { select: { id: true, first_name: true, last_name: true, phone: true } }, events: { orderBy: { created_at: 'asc' } } },
  });
  if (!delivery) return NextResponse.json({ error: 'Доставка не найдена' }, { status: 404 });
  return NextResponse.json({ delivery });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  const auth = await verifyAdminOrManager(request, 'manage_orders');
  if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { orderId } = await params;
  const body = await request.json().catch(() => ({})) as { status?: DeliveryStatus; courierUserId?: string | null; promisedAt?: string | null; reason?: string };
  if (body.status && !deliveryStatuses.includes(body.status)) return NextResponse.json({ error: 'Недопустимый статус доставки' }, { status: 400 });
  const delivery = await prisma.order_deliveries.findFirst({ where: { order_id: orderId, order: { tenant_id: auth.tenantId, ...(auth.branchIds ? { branch_id: { in: auth.branchIds } } : auth.branchId ? { branch_id: auth.branchId } : {}) } }, include: { order: { select: { id: true, branch_id: true, status: true } } } });
  if (!delivery) return NextResponse.json({ error: 'Доставка не найдена' }, { status: 404 });
  const nextStatus = body.status || delivery.status;
  if (!canTransitionDeliveryStatus(delivery.status as DeliveryStatus, nextStatus)) return NextResponse.json({ error: 'Недопустимый переход доставки' }, { status: 409 });
  if (nextStatus === 'failed' && !body.reason?.trim()) return NextResponse.json({ error: 'Причина ошибки доставки обязательна' }, { status: 400 });
  if (body.courierUserId) {
    const courier = await prisma.users.findFirst({ where: { id: body.courierUserId, tenant_id: auth.tenantId, status: 'active', role: { in: ['employee', 'manager', 'admin'] }, ...(delivery.order.branch_id ? { branch_id: delivery.order.branch_id } : {}) }, select: { id: true } });
    if (!courier) return NextResponse.json({ error: 'Курьер не найден в филиале' }, { status: 404 });
  }
  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.order_deliveries.update({ where: { id: delivery.id }, data: { status: nextStatus, ...(body.courierUserId !== undefined ? { courier_user_id: body.courierUserId } : {}), ...(body.promisedAt !== undefined ? { promised_at: body.promisedAt ? new Date(body.promisedAt) : null } : {}), ...(nextStatus === 'assigned' && delivery.status !== 'assigned' ? { assigned_at: now } : {}), ...(nextStatus === 'delivering' && delivery.status !== 'delivering' ? { picked_up_at: now } : {}), ...(nextStatus === 'delivered' ? { delivered_at: now } : {}), ...(nextStatus === 'failed' ? { failed_at: now, failure_reason: body.reason?.trim() } : {}) } });
    if (nextStatus !== delivery.status) await tx.order_delivery_events.create({ data: { delivery_id: delivery.id, from_status: delivery.status, to_status: nextStatus, actor_user_id: auth.userId, reason: body.reason?.trim() || null } });
    if (nextStatus === 'delivering' || nextStatus === 'delivered') await tx.orders.update({ where: { id: orderId }, data: { status: nextStatus === 'delivered' ? 'completed' : 'delivering' } });
    if (nextStatus === 'failed') await tx.orders.update({ where: { id: orderId }, data: { problem: body.reason?.trim() || 'Delivery failed' } });
    return changed;
  });
  return NextResponse.json({ delivery: updated });
}