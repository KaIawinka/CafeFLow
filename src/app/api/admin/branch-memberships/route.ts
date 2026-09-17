import { NextRequest, NextResponse } from 'next/server';
import { branch_capability, branch_membership_status } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';
import { canAccessBranch, canGrantCapabilities } from '@/lib/auth/branch-access';

function validCapabilities(value: unknown): value is branch_capability[] {
  return Array.isArray(value) && value.length <= 20 && value.every((item) => Object.values(branch_capability).includes(item as branch_capability));
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'manage_staff');
  if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const branchId = request.nextUrl.searchParams.get('branchId')?.trim();
  const memberships = await prisma.branch_memberships.findMany({
    where: {
      tenant_id: auth.tenantId,
      ...(auth.branchIds ? { branch_id: { in: auth.branchIds } } : {}),
      ...(branchId ? { branch_id: branchId } : {}),
    },
    orderBy: { created_at: 'desc' },
    include: {
      branch: { select: { id: true, name: true, code: true } },
      user: { select: { id: true, email: true, first_name: true, last_name: true, role: true, status: true } },
      capabilities: { select: { capability: true } },
    },
  });
  return NextResponse.json({ memberships });
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'manage_staff');
  if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });

  const body = await request.json().catch(() => ({})) as { userId?: string; branchId?: string; status?: branch_membership_status; capabilities?: unknown };
  const userId = body.userId?.trim();
  const branchId = body.branchId?.trim();
  const capabilities = body.capabilities === undefined ? [] as branch_capability[] : body.capabilities;
  if (!userId || !branchId || !validCapabilities(capabilities)) return NextResponse.json({ error: 'userId, branchId и capabilities обязательны' }, { status: 400 });
  if (!canGrantCapabilities(auth.role, capabilities)) return NextResponse.json({ error: 'Недостаточно прав для выдачи этих capabilities' }, { status: 403 });
  if (!canAccessBranch(branchId, auth.branchIds ?? null)) return NextResponse.json({ error: 'Филиал недоступен' }, { status: 403 });

  const [user, branch] = await Promise.all([
    prisma.users.findFirst({ where: { id: userId, tenant_id: auth.tenantId, role: { in: ['employee', 'kitchen', 'manager'] } }, select: { id: true } }),
    prisma.branches.findFirst({ where: { id: branchId, tenant_id: auth.tenantId, status: 'active' }, select: { id: true } }),
  ]);
  if (!user || !branch) return NextResponse.json({ error: 'Пользователь или филиал не найден' }, { status: 404 });

  const membership = await prisma.$transaction(async (tx) => {
    const record = await tx.branch_memberships.upsert({
      where: { user_id_branch_id: { user_id: userId, branch_id: branchId } },
      create: { tenant_id: auth.tenantId!, user_id: userId, branch_id: branchId, status: body.status || 'active' },
      update: { status: body.status || 'active' },
    });
    await tx.branch_membership_capabilities.deleteMany({ where: { membership_id: record.id } });
    if (capabilities.length) await tx.branch_membership_capabilities.createMany({ data: capabilities.map((capability) => ({ membership_id: record.id, capability })) });
    return tx.branch_memberships.findUnique({ where: { id: record.id }, include: { capabilities: true } });
  });
  await prisma.activity_logs.create({ data: { tenant_id: auth.tenantId, actor_user_id: auth.userId, action: 'admin.branch_membership.updated', entity_type: 'branch_memberships', entity_id: membership?.id, after_data: membership || undefined } });
  return NextResponse.json({ membership }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'manage_staff');
  if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const membershipId = request.nextUrl.searchParams.get('id')?.trim();
  if (!membershipId) return NextResponse.json({ error: 'id обязателен' }, { status: 400 });
  const membership = await prisma.branch_memberships.findFirst({ where: { id: membershipId, tenant_id: auth.tenantId, ...(auth.branchIds ? { branch_id: { in: auth.branchIds } } : {}) }, select: { id: true, status: true } });
  if (!membership) return NextResponse.json({ error: 'Доступ не найден' }, { status: 404 });
  const updated = await prisma.branch_memberships.update({ where: { id: membership.id }, data: { status: 'revoked' } });
  await prisma.activity_logs.create({ data: { tenant_id: auth.tenantId, actor_user_id: auth.userId, action: 'admin.branch_membership.revoked', entity_type: 'branch_memberships', entity_id: updated.id, before_data: membership, after_data: updated } });
  return NextResponse.json({ success: true, membership: updated });
}