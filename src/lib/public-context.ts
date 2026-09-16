import { prisma } from '@/lib/prisma';

export async function getPublicCafeContext(request?: Request) {
  const urlTenant = request ? new URL(request.url).searchParams.get('tenant') : null;
  const tenantSlug = urlTenant?.trim() || request?.headers.get('x-cafeflow-tenant')?.trim() || process.env.CAFEFLOW_DEFAULT_TENANT_SLUG?.trim();
  if (!tenantSlug) return null;

  const tenant = await prisma.tenants.findUnique({
    where: { slug: tenantSlug },
    select: { id: true, currency: true },
  });
  if (!tenant) return null;

  const activeTenant = await prisma.tenants.findFirst({
    where: { id: tenant.id, status: { in: ['trial', 'active'] } },
    select: { id: true, currency: true },
  });
  if (!activeTenant) return null;

  const branch = await prisma.branches.findFirst({
    where: { tenant_id: activeTenant.id, status: 'active' },
    orderBy: { created_at: 'asc' },
    select: { id: true },
  });

  return { tenant: activeTenant, branch };
}
