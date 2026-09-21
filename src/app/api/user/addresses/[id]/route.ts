import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/api-middleware';
import { parseAddressUpdate } from '@/lib/customer-address';
import { apiError, apiUserMessage } from '@/lib/api-response';

async function getAddressActor(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.success || !auth.userId) return { error: auth.error || apiError(request, 'unauthorized', 401) };
  const user = await prisma.users.findFirst({ where: { id: auth.userId, status: 'active' }, select: { id: true, tenant_id: true } });
  if (!user?.tenant_id) return { error: apiError(request, 'tenantNotConfigured', 409) };
  return { user: { id: user.id, tenantId: user.tenant_id } };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAddressActor(request);
  if ('error' in actor) return actor.error;
  const { id } = await params;
  const input = parseAddressUpdate(await request.json().catch(() => null));
  if (!input) return NextResponse.json({ error: apiUserMessage(request, 'addressUpdateInvalid') }, { status: 400 });
  const existing = await prisma.customer_addresses.findFirst({
    where: { id, tenant_id: actor.user.tenantId, user_id: actor.user.id },
    select: { id: true, is_default: true },
  });
  if (!existing) return NextResponse.json({ error: apiUserMessage(request, 'addressNotFound') }, { status: 404 });

  try {
    const address = await prisma.$transaction(async (tx) => {
      if (input.is_default === true) {
        await tx.customer_addresses.updateMany({
          where: { tenant_id: actor.user.tenantId, user_id: actor.user.id, id: { not: id }, is_default: true },
          data: { is_default: false },
        });
      }
      if (input.is_default === false && existing.is_default) {
        const replacement = await tx.customer_addresses.findFirst({
          where: { tenant_id: actor.user.tenantId, user_id: actor.user.id, id: { not: id } },
          orderBy: { updated_at: 'desc' },
          select: { id: true },
        });
        if (!replacement) throw new Error('ONLY_DEFAULT_ADDRESS');
        await tx.customer_addresses.update({ where: { id: replacement.id }, data: { is_default: true } });
      }
      const updated = await tx.customer_addresses.update({ where: { id }, data: input });
      await tx.activity_logs.create({
        data: { tenant_id: actor.user.tenantId, actor_user_id: actor.user.id, action: 'user.address.updated', entity_type: 'customer_addresses', entity_id: id },
      });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return NextResponse.json({ address });
  } catch (error) {
    if (error instanceof Error && error.message === 'ONLY_DEFAULT_ADDRESS') return NextResponse.json({ error: apiUserMessage(request, 'onlyDefaultAddress') }, { status: 409 });
    throw error;
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAddressActor(request);
  if ('error' in actor) return actor.error;
  const { id } = await params;
  const existing = await prisma.customer_addresses.findFirst({
    where: { id, tenant_id: actor.user.tenantId, user_id: actor.user.id },
    select: { id: true, is_default: true },
  });
  if (!existing) return NextResponse.json({ error: apiUserMessage(request, 'addressNotFound') }, { status: 404 });
  await prisma.$transaction(async (tx) => {
    if (existing.is_default) {
      const replacement = await tx.customer_addresses.findFirst({
        where: { tenant_id: actor.user.tenantId, user_id: actor.user.id, id: { not: id } },
        orderBy: { updated_at: 'desc' },
        select: { id: true },
      });
      if (replacement) await tx.customer_addresses.update({ where: { id: replacement.id }, data: { is_default: true } });
    }
    await tx.customer_addresses.delete({ where: { id } });
    await tx.activity_logs.create({
      data: { tenant_id: actor.user.tenantId, actor_user_id: actor.user.id, action: 'user.address.deleted', entity_type: 'customer_addresses', entity_id: id },
    });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  return NextResponse.json({ success: true });
}