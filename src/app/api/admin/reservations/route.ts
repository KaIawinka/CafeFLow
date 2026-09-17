import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';

const allowedStatuses = ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'] as const;
type ReservationStatus = (typeof allowedStatuses)[number];

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item));
}

async function actorScope(userId: string) {
  return prisma.users.findUnique({ where: { id: userId }, select: { tenant_id: true, branch_id: true } });
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'manage_reservations');
  if (!auth.success || !auth.userId) return auth.error;
  try {
    const actor = await actorScope(auth.userId);
    if (!actor?.tenant_id) return NextResponse.json({ reservations: [], tables: [] });
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = 25;
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const reservationWhere = {
      tenant_id: actor.tenant_id,
      ...(actor.branch_id ? { branch_id: actor.branch_id } : {}),
      ...(allowedStatuses.includes(status as ReservationStatus) ? { status: status as ReservationStatus } : {}),
      ...(date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { start_at: { gte: new Date(`${date}T00:00:00`), lt: new Date(`${date}T23:59:59.999`) } } : {}),
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
        where: { tenant_id: actor.tenant_id, ...(actor.branch_id ? { branch_id: actor.branch_id } : {}), status: 'active' },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, zone: true, capacity: true },
      }),
    ]);
    return NextResponse.json(serialize({ reservations, tables, pagination: { page, pageSize, total } }));
  } catch (error) {
    console.error('Admin reservations read error', error);
    return NextResponse.json({ error: 'Не удалось загрузить бронирования' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'manage_reservations');
  if (!auth.success || !auth.userId) return auth.error;
  try {
    const actor = await actorScope(auth.userId);
    const body = await request.json() as { id?: string; status?: ReservationStatus };
    if (!actor?.tenant_id || !body.id || !body.status || !allowedStatuses.includes(body.status)) return NextResponse.json({ error: 'Некорректные данные бронирования' }, { status: 400 });
    const existing = await prisma.reservations.findFirst({ where: { id: body.id, tenant_id: actor.tenant_id, ...(actor.branch_id ? { branch_id: actor.branch_id } : {}) }, select: { id: true, tenant_id: true, status: true } });
    if (!existing) return NextResponse.json({ error: 'Бронирование не найдено' }, { status: 404 });
    const reservation = await prisma.reservations.update({ where: { id: existing.id }, data: { status: body.status }, select: { id: true, status: true, guest_name: true, guest_phone: true, guests_count: true, start_at: true, end_at: true, table_ids: true, comment: true } });
    await prisma.activity_logs.create({ data: { tenant_id: existing.tenant_id, actor_user_id: auth.userId, action: 'admin.reservation.status_changed', entity_type: 'reservations', entity_id: reservation.id, before_data: { status: existing.status }, after_data: { status: reservation.status } } });
    return NextResponse.json(serialize({ reservation }));
  } catch (error) {
    console.error('Admin reservation update error', error);
    return NextResponse.json({ error: 'Не удалось обновить бронирование' }, { status: 500 });
  }
}
