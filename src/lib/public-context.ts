import { prisma } from '@/lib/prisma';

export async function getPublicCafeContext() {
  const tenant = await prisma.tenants.findFirst({
    where: { status: { in: ['trial', 'active'] } },
    orderBy: { created_at: 'asc' },
    select: { id: true, currency: true },
  });
  if (!tenant) return null;

  const branch = await prisma.branches.findFirst({
    where: { tenant_id: tenant.id, status: 'active' },
    orderBy: { created_at: 'asc' },
    select: { id: true },
  });

  return { tenant, branch };
}
