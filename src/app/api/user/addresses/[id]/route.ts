import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/api-middleware';

type AddressInput = { label?: string; addressText?: string; entrance?: string; floor?: string; apartment?: string; comment?: string; latitude?: number | string | null; longitude?: number | string | null; isDefault?: boolean };

function parseUpdate(body: AddressInput) {
  if (body.addressText !== undefined && (!body.addressText.trim() || body.addressText.trim().length > 500)) return null;
  const decimal = (value: number | string | null | undefined) => value === null || value === undefined || value === '' ? null : new Prisma.Decimal(value);
  return {
    ...(body.label !== undefined ? { label: body.label.trim().slice(0, 80) || null } : {}),
    ...(body.addressText !== undefined ? { address_text: body.addressText.trim() } : {}),
    ...(body.entrance !== undefined ? { entrance: body.entrance.trim().slice(0, 30) || null } : {}),
    ...(body.floor !== undefined ? { floor: body.floor.trim().slice(0, 20) || null } : {}),
    ...(body.apartment !== undefined ? { apartment: body.apartment.trim().slice(0, 20) || null } : {}),
    ...(body.comment !== undefined ? { comment: body.comment.trim().slice(0, 500) || null } : {}),
    ...(body.latitude !== undefined ? { latitude: decimal(body.latitude) } : {}),
    ...(body.longitude !== undefined ? { longitude: decimal(body.longitude) } : {}),
    ...(body.isDefault !== undefined ? { is_default: body.isDefault } : {}),
  };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth.success || !auth.userId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { id } = await params;
  const user = await prisma.users.findUnique({ where: { id: auth.userId }, select: { id: true, tenant_id: true } });
  if (!user?.tenant_id) return NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 });
  const input = parseUpdate(await request.json().catch(() => ({})) as AddressInput);
  if (!input) return NextResponse.json({ error: 'Некорректный адрес' }, { status: 400 });
  const existing = await prisma.customer_addresses.findFirst({ where: { id, tenant_id: user.tenant_id, user_id: user.id }, select: { id: true } });
  if (!existing) return NextResponse.json({ error: 'Адрес не найден' }, { status: 404 });
  const address = await prisma.$transaction(async (tx) => {
    if (input.is_default === true) await tx.customer_addresses.updateMany({ where: { tenant_id: user.tenant_id!, user_id: user.id, id: { not: id }, is_default: true }, data: { is_default: false } });
    return tx.customer_addresses.update({ where: { id }, data: input });
  });
  return NextResponse.json({ address });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuth(request);
  if (!auth.success || !auth.userId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { id } = await params;
  const user = await prisma.users.findUnique({ where: { id: auth.userId }, select: { tenant_id: true } });
  if (!user?.tenant_id) return NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 });
  const deleted = await prisma.customer_addresses.deleteMany({ where: { id, tenant_id: user.tenant_id, user_id: auth.userId } });
  if (!deleted.count) return NextResponse.json({ error: 'Адрес не найден' }, { status: 404 });
  return NextResponse.json({ success: true });
}