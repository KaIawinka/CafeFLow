import { prisma } from '@/lib/prisma';

export async function getPublicCafeContext(request?: Request) {
  const urlTenant = request ? new URL(request.url).searchParams.get('tenant') : null;
  const urlBranch = request ? new URL(request.url).searchParams.get('branch') : null;
  const tenantSlug = urlTenant?.trim() || request?.headers.get('x-cafeflow-tenant')?.trim() || process.env.CAFEFLOW_DEFAULT_TENANT_SLUG?.trim();
  const host = request?.headers.get('x-forwarded-host')?.split(',')[0]?.trim().toLowerCase() || request?.headers.get('host')?.trim().toLowerCase();
  const hostname = host?.replace(/:\d+$/, '');
  const domainTenant = hostname
    ? await prisma.tenant_domains.findFirst({ where: { hostname, status: 'verified' }, select: { tenant: { select: { id: true, currency: true, slug: true } } } })
    : null;
  const tenant = domainTenant?.tenant || (tenantSlug ? await prisma.tenants.findUnique({ where: { slug: tenantSlug }, select: { id: true, currency: true, slug: true } }) : null);
  if (!tenant) return null;

  const activeTenant = await prisma.tenants.findFirst({
    where: { id: tenant.id, status: { in: ['trial', 'active'] } },
    select: { id: true, currency: true, slug: true },
  });
  if (!activeTenant) return null;

  const requestedBranchId = urlBranch?.trim() || request?.headers.get('x-cafeflow-branch')?.trim();
  const branches = await prisma.branches.findMany({
    where: {
      tenant_id: activeTenant.id,
      status: 'active',
      ...(requestedBranchId ? { id: requestedBranchId } : {}),
    },
    orderBy: { created_at: 'asc' },
    take: requestedBranchId ? 1 : 2,
    select: { id: true },
  });

  const branch = requestedBranchId
    ? branches[0] || null
    : branches.length === 1
      ? branches[0]
      : null;

  return { tenant: activeTenant, branch };
}
