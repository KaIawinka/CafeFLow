import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';
import { apiAdminMessage, apiError } from '@/lib/api-response';
import { canTransitionReservationStatus, reservationStatuses, type ReservationStatus } from '@/lib/reservations/status';
import { parseLocalDateTime } from '@/lib/reservations/time';

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item));
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'manage_reservations');
  if (!auth.success || !auth.userId) return auth.error || apiError(request, 'unauthorized', 401);
  try {
    if (!auth.tenantId) return NextResponse.json({ reservations: [], tables: [] });
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = 25;
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const validDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
    const branchScope = auth.branchIds ? { branch_id: { in: auth.branchIds } } : auth.branchId ? { branch_id: auth.branchId } : {};
    const dateFilter = validDate ? {
      OR: (await prisma.branches.findMany({ where: { tenant_id: auth.tenantId, ...branchScope }, select: { id: true, timezone: true } })).flatMap((branch) => {
        const nextDate = new Date(`${validDate}T00:00:00Z`);
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
        const timeZone = branch.timezone || 'UTC';
        const startAt = parseLocalDateTime(validDate, '00:00', timeZone);
        const endAt = parseLocalDateTime(nextDate.toISOString().slice(0, 10), '00:00', timeZone);
        return startAt && endAt ? [{ branch_id: branch.id, start_at: { gte: startAt, lt: endAt } }] : [];
      }),
    } : undefined;
    const reservationWhere = {
      tenant_id: auth.tenantId,
      ...branchScope,
      ...(reservationStatuses.includes(status as ReservationStatus) ? { status: status as ReservationStatus } : {}),
      ...(dateFilter || {}),
    };
    const [reservations, total, tables] = await Promise.all([
      prisma.reservations.findMany({
        where: reservationWhere,
        orderBy: { start_at: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: { id: true, guest_name: true, guest_phone: true, guests_count: true, start_at: true, end_at: true, status: true, table_ids: true, comment: true, guest_token: true },
      }),
      prisma.reservations.count({ where: reservationWhere }),
      prisma.restaurant_tables.findMany({
        where: { tenant_id: auth.tenantId, ...branchScope, status: 'active' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, zone: true, capacity: true },
      }),
    ]);
    return NextResponse.json(serialize({ reservations, tables, pagination: { page, pageSize, total } }));
  } catch (error) {
    console.error('Admin reservations read error', error);
    return NextResponse.json({ error: apiAdminMessage(request, 'reservationsLoadFailed') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'manage_reservations');
  if (!auth.success || !auth.userId) return auth.error || apiError(request, 'unauthorized', 401);
  try {
    const body = await request.json() as { id?: string; status?: ReservationStatus };
    if (!auth.tenantId || !body.id || !body.status || !reservationStatuses.includes(body.status)) return NextResponse.json({ error: apiAdminMessage(request, 'reservationInputInvalid') }, { status: 400 });
    const existing = await prisma.reservations.findFirst({ where: { id: body.id, tenant_id: auth.tenantId, ...(auth.branchIds ? { branch_id: { in: auth.branchIds } } : auth.branchId ? { branch_id: auth.branchId } : {}) }, select: { id: true, tenant_id: true, status: true } });
    if (!existing) return NextResponse.json({ error: apiAdminMessage(request, 'reservationNotFound') }, { status: 404 });
    if (!canTransitionReservationStatus(existing.status as ReservationStatus, body.status)) return NextResponse.json({ error: apiAdminMessage(request, 'invalidReservationTransition') }, { status: 409 });
    const reservation = await prisma.reservations.update({ where: { id: existing.id }, data: { status: body.status }, select: { id: true, status: true, guest_name: true, guest_phone: true, guests_count: true, start_at: true, end_at: true, table_ids: true, comment: true } });
    await prisma.activity_logs.create({ data: { tenant_id: existing.tenant_id, actor_user_id: auth.userId, action: 'admin.reservation.status_changed', entity_type: 'reservations', entity_id: reservation.id, before_data: { status: existing.status }, after_data: { status: reservation.status } } });
    return NextResponse.json(serialize({ reservation }));
  } catch (error) {
    console.error('Admin reservation update error', error);
    return NextResponse.json({ error: apiAdminMessage(request, 'reservationUpdateFailed') }, { status: 500 });
  }
}
