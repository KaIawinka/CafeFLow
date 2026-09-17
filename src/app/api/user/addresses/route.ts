import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/api-middleware';

type AddressInput = {
  label?: string;
  addressText?: string;
  entrance?: string;
  floor?: string;
  apartment?: string;
  comment?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  isDefault?: boolean;
};

function parseInput(body: AddressInput) {
  const addressText = body.addressText?.trim() || '';
  if (!addressText || addressText.length > 500) return null;
  const decimal = (value: number | string | null | undefined) => value === null || value === undefined || value === '' ? null : new Prisma.Decimal(value);
  return {
    label: body.label?.trim().slice(0, 80) || null,
    address_text: addressText,
    entrance: body.entrance?.trim().slice(0, 30) || null,
    floor: body.floor?.trim().slice(0, 20) || null,
    apartment: body.apartment?.trim().slice(0, 20) || null,
    comment: body.comment?.trim().slice(0, 500) || null,
    latitude: decimal(body.latitude),
    longitude: decimal(body.longitude),
    is_default: body.isDefault === true,
  };
}

async function getUserScope(userId: string) {
  return prisma.users.findUnique({ where: { id: userId }, select: { id: true, tenant_id: true } });
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.success || !auth.userId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const user = await getUserScope(auth.userId);
  if (!user?.tenant_id) return NextResponse.json({ addresses: [] });
  const addresses = await prisma.customer_addresses.findMany({ where: { tenant_id: user.tenant_id, user_id: user.id }, orderBy: [{ is_default: 'desc' }, { updated_at: 'desc' }] });
  return NextResponse.json({ addresses });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.success || !auth.userId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const user = await getUserScope(auth.userId);
  if (!user?.tenant_id) return NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 });
  const input = parseInput(await request.json().catch(() => ({})) as AddressInput);
  if (!input) return NextResponse.json({ error: 'Адрес обязателен и должен быть корректным' }, { status: 400 });
  const address = await prisma.$transaction(async (tx) => {
    if (input.is_default) await tx.customer_addresses.updateMany({ where: { tenant_id: user.tenant_id!, user_id: user.id, is_default: true }, data: { is_default: false } });
    return tx.customer_addresses.create({ data: { ...input, tenant_id: user.tenant_id!, user_id: user.id } });
  });
  return NextResponse.json({ address }, { status: 201 });
}