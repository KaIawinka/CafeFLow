import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
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
    const occupied = new Set(conflicts.flatMap((reservation) => Array.isArray(reservation.table_ids) ? reservation.table_ids.filter((id): id is string => typeof id === 'string') : []));
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
    const table = await prisma.restaurant_tables.findFirst({ where: { id: body.tableId, tenant_id: context.tenant.id, branch_id: context.branch.id, status: 'active', capacity: { gte: guests } }, select: { id: true, name: true } });
    if (!table) return NextResponse.json({ error: 'Столик недоступен' }, { status: 409 });
    const conflicts = await prisma.reservations.findMany({ where: { tenant_id: context.tenant.id, branch_id: context.branch.id, status: { in: ['pending', 'confirmed', 'seated'] }, start_at: { lt: endAt }, end_at: { gt: startAt } }, select: { table_ids: true } });
    if (conflicts.some((reservation) => Array.isArray(reservation.table_ids) && reservation.table_ids.includes(table.id))) return NextResponse.json({ error: 'Этот столик уже занят на выбранное время' }, { status: 409 });
    const reservationToken = token();
    const reservation = await prisma.reservations.create({ data: { tenant_id: context.tenant.id, branch_id: context.branch.id, guest_name: body.name.trim(), guest_phone: body.phone.trim(), guests_count: guests, start_at: startAt, end_at: endAt, status: 'pending', table_ids: [table.id], comment: body.comment?.trim() || null, guest_token: reservationToken }, select: { id: true, status: true, start_at: true, end_at: true, table_ids: true, guest_token: true } });
    const response = NextResponse.json(serialize({ reservation }), { status: 201 });
    response.cookies.set('guestReservationToken', reservationToken, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
    return response;
  } catch (error) {
    console.error('Public reservation create error', error);
    return NextResponse.json({ error: 'Не удалось создать бронирование' }, { status: 500 });
  }
}
