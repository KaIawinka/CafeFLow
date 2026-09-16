import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { getPublicCafeContext } from '@/lib/public-context';

function token() { return randomBytes(36).toString('base64url'); }

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as { name?: string; phone?: string; guests?: number; date?: string; time?: string; note?: string };
  const guests = Number(body.guests);
  if (!body.name?.trim() || !body.phone?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(body.date || '') || !/^\d{2}:\d{2}$/.test(body.time || '') || !Number.isInteger(guests) || guests < 1 || guests > 50) return NextResponse.json({ error: 'Заполните имя, телефон, дату, время и гостей' }, { status: 400 });
  const desiredDate = body.date as string;
  const desiredTime = body.time as string;
  const context = await getPublicCafeContext(request);
  if (!context?.branch) return NextResponse.json({ error: 'Филиал кафе пока не настроен' }, { status: 503 });
  const guestToken = token();
  const entry = await prisma.reservation_waitlist.create({ data: { tenant_id: context.tenant.id, branch_id: context.branch.id, guest_name: body.name.trim(), guest_phone: body.phone.trim(), guests_count: guests, desired_date: new Date(`${desiredDate}T00:00:00Z`), desired_time: desiredTime, status: 'waiting', guest_token: guestToken, note: body.note?.trim() || null } });
  return NextResponse.json({ waitlist: { id: entry.id, token: entry.guest_token, status: entry.status, created_at: entry.created_at } }, { status: 201 });
}