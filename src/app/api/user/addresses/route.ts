import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/api-middleware';
import { parseAddressCreate } from '@/lib/customer-address';

const MAX_ADDRESSES_PER_CUSTOMER = 20;

async function getAddressActor(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.success || !auth.userId) return { error: auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) };
  const user = await prisma.users.findFirst({
    where: { id: auth.userId, status: 'active' },
    select: { id: true, tenant_id: true },
  });
  if (!user?.tenant_id) return { error: NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 }) };
  return { user: { id: user.id, tenantId: user.tenant_id } };
}

export async function GET(request: NextRequest) {
  const actor = await getAddressActor(request);
  if ('error' in actor) return actor.error;
  const addresses = await prisma.customer_addresses.findMany({
    where: { tenant_id: actor.user.tenantId, user_id: actor.user.id },
    orderBy: [{ is_default: 'desc' }, { updated_at: 'desc' }],
  });
  return NextResponse.json({ addresses });
}

export async function POST(request: NextRequest) {
  const actor = await getAddressActor(request);
  if ('error' in actor) return actor.error;
  const input = parseAddressCreate(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: 'Укажите корректный адрес, координаты должны передаваться парой' }, { status: 400 });

  try {
    const address = await prisma.$transaction(async (tx) => {
      const count = await tx.customer_addresses.count({ where: { tenant_id: actor.user.tenantId, user_id: actor.user.id } });
      if (count >= MAX_ADDRESSES_PER_CUSTOMER) throw new Error('ADDRESS_LIMIT_REACHED');
      const isDefault = input.is_default || count === 0;
      if (isDefault) {
        await tx.customer_addresses.updateMany({
          where: { tenant_id: actor.user.tenantId, user_id: actor.user.id, is_default: true },
          data: { is_default: false },
        });
      }
      const created = await tx.customer_addresses.create({
        data: { ...input, is_default: isDefault, tenant_id: actor.user.tenantId, user_id: actor.user.id },
      });
      await tx.activity_logs.create({
        data: { tenant_id: actor.user.tenantId, actor_user_id: actor.user.id, action: 'user.address.created', entity_type: 'customer_addresses', entity_id: created.id },
      });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ address }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'ADDRESS_LIMIT_REACHED') return NextResponse.json({ error: 'Можно сохранить не более 20 адресов' }, { status: 409 });
    throw error;
  }
}