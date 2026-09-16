import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPublicCafeContext } from '@/lib/public-context';

function token() { return randomBytes(48).toString('base64url'); }
function serialize<T>(value: T): T { return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item)); }

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get('date');
  const time = request.nextUrl.searchParams.get('time');
  const guests = Number(request.nextUrl.searchParams.get('guests') || 1);
  if (!date || !Number.isInteger(guests) || guests < 1) return NextResponse.json({ error: 'Дата и количество гостей обязательны' }, { status: 400 });
  try {
    const context = await getPublicCafeContext();
    if (!context?.branch) return NextResponse.json({ error: 'Филиал кафе пока не настроен' }, { status: 503 });
    const tables = await prisma.restaurant_tables.findMany({ where: { tenant_id: context.tenant.id, branch_id: context.branch.id, status: 'active', capacity: { gte: guests } }, select: { id: true, name: true, zone: true, capacity: true, position: true }, orderBy: { name: 'asc' } });
    if (!time || !/^\d{2}:\d{2}$/.test(time)) return NextResponse.json(serialize({ tables }));
    const startAt = new Date(`${date}T${time}:00`);
    const endAt = new Date(startAt.getTime() + 90 * 60 * 1000);
    const conflicts = await prisma.reservations.findMany({ where: { tenant_id: context.tenant.id, branch_id: context.branch.id, status: { in: ['pending', 'confirmed', 'seated'] }, start_at: { lt: endAt }, end_at: { gt: startAt } }, select: { table_ids: true } });
    const blocks = await prisma.table_blocks.findMany({
      where: { tenant_id: context.tenant.id, branch_id: context.branch.id, start_at: { lt: endAt }, end_at: { gt: startAt } },
      select: { table_id: true },
    });
    const occupied = new Set([
      ...conflicts.flatMap((reservation) => Array.isArray(reservation.table_ids) ? reservation.table_ids.filter((id): id is string => typeof id === 'string') : []),
      ...blocks.map((block) => block.table_id),
    ]);
    return NextResponse.json(serialize({ tables: tables.filter((table) => !occupied.has(table.id)) }));
  } catch (error) {
    console.error('Public reservation availability error', error);
    return NextResponse.json({ error: 'Не удалось загрузить доступные столики' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { date?: string; time?: string; guests?: number; name?: string; phone?: string; tableId?: string; comment?: string };
    const guests = Number(body.guests);
    if (!body.date || !/^\d{2}:\d{2}$/.test(body.time || '') || !body.name?.trim() || !body.phone?.trim() || !body.tableId || !Number.isInteger(guests) || guests < 1 || guests > 50) return NextResponse.json({ error: 'Заполните дату, время, гостей, имя, телефон и столик' }, { status: 400 });
    const startAt = new Date(`${body.date}T${body.time}:00`);
    if (Number.isNaN(startAt.getTime()) || startAt < new Date()) return NextResponse.json({ error: 'Выберите корректную дату и время' }, { status: 400 });
    const endAt = new Date(startAt.getTime() + 90 * 60 * 1000);
    const context = await getPublicCafeContext();
    if (!context?.branch) return NextResponse.json({ error: 'Филиал кафе пока не настроен' }, { status: 503 });
    const branch = context.branch;
    const guestName = body.name.trim();
    const guestPhone = body.phone.trim();
    const table = await prisma.restaurant_tables.findFirst({ where: { id: body.tableId, tenant_id: context.tenant.id, branch_id: branch.id, status: 'active', capacity: { gte: guests } }, select: { id: true, name: true } });
    if (!table) return NextResponse.json({ error: 'Столик недоступен' }, { status: 409 });
    const reservationToken = token();
    let reservation;
    try {
      reservation = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw(Prisma.sql`SELECT pg_advisory_xact_lock(hashtext(${`${context.tenant.id}:${branch.id}:${table.id}`}))`);

        const [conflict, block] = await Promise.all([
          tx.reservations.findFirst({ where: { tenant_id: context.tenant.id, branch_id: branch.id, status: { in: ['pending', 'confirmed', 'seated'] }, start_at: { lt: endAt }, end_at: { gt: startAt }, table_ids: { array_contains: [table.id] } }, select: { id: true } }),
          tx.table_blocks.findFirst({ where: { tenant_id: context.tenant.id, branch_id: branch.id, table_id: table.id, start_at: { lt: endAt }, end_at: { gt: startAt } }, select: { id: true } }),
        ]);
        if (conflict || block) throw new Error('RESERVATION_SLOT_UNAVAILABLE');

        return tx.reservations.create({ data: { tenant_id: context.tenant.id, branch_id: branch.id, guest_name: guestName, guest_phone: guestPhone, guests_count: guests, start_at: startAt, end_at: endAt, status: 'pending', table_ids: [table.id], comment: body.comment?.trim() || null, guest_token: reservationToken }, select: { id: true, status: true, start_at: true, end_at: true, table_ids: true, guest_token: true } });
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'RESERVATION_SLOT_UNAVAILABLE') {
        return NextResponse.json({ error: 'Этот столик уже занят или заблокирован на выбранное время' }, { status: 409 });
      }
      throw error;
    }
    const response = NextResponse.json(serialize({ reservation }), { status: 201 });
    response.cookies.set('guestReservationToken', reservationToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
    return response;
  } catch (error) {
    console.error('Public reservation create error', error);
    return NextResponse.json({ error: 'Не удалось создать бронирование' }, { status: 500 });
  }
}
