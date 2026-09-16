import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function serialize<T>(value: T): T { return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item)); }

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const tenant = request.nextUrl.searchParams.get('tenant')?.trim() || request.headers.get('x-cafeflow-tenant')?.trim() || process.env.CAFEFLOW_DEFAULT_TENANT_SLUG?.trim();
  if (!tenant || !token) return NextResponse.json({ error: 'Контекст и токен обязательны' }, { status: 400 });
  const cafe = await prisma.tenants.findFirst({ where: { slug: tenant, status: { in: ['trial', 'active'] } }, select: { id: true } });
  if (!cafe) return NextResponse.json({ error: 'Кафе не найдено' }, { status: 404 });
  const reservation = await prisma.reservations.findFirst({ where: { guest_token: token, tenant_id: cafe.id }, select: { id: true, guest_name: true, guest_phone: true, guests_count: true, start_at: true, end_at: true, status: true, table_ids: true, comment: true, created_at: true } });
  if (!reservation) return NextResponse.json({ error: 'Бронирование не найдено' }, { status: 404 });
  return NextResponse.json(serialize({ reservation }));
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => ({})) as { tenant?: string; reason?: string };
  const tenant = body.tenant?.trim() || request.nextUrl.searchParams.get('tenant')?.trim() || request.headers.get('x-cafeflow-tenant')?.trim() || process.env.CAFEFLOW_DEFAULT_TENANT_SLUG?.trim();
  if (!tenant || !token) return NextResponse.json({ error: 'Контекст и токен обязательны' }, { status: 400 });
  const cafe = await prisma.tenants.findFirst({ where: { slug: tenant, status: { in: ['trial', 'active'] } }, select: { id: true } });
  if (!cafe) return NextResponse.json({ error: 'Кафе не найдено' }, { status: 404 });
  const reservation = await prisma.reservations.findFirst({ where: { guest_token: token, tenant_id: cafe.id }, select: { id: true, status: true } });
  if (!reservation) return NextResponse.json({ error: 'Бронирование не найдено' }, { status: 404 });
  if (['completed', 'cancelled', 'no_show'].includes(reservation.status)) return NextResponse.json({ error: 'Бронирование уже завершено' }, { status: 409 });
  const updated = await prisma.reservations.update({ where: { id: reservation.id }, data: { status: 'cancelled', cancel_reason: body.reason?.trim() || 'Отменено гостем' }, select: { id: true, status: true, cancel_reason: true } });
  return NextResponse.json({ reservation: updated });
}