import { prisma } from '@/lib/prisma';

export interface TenantContext {
  tenant: {
    id: string;
    currency: string;
    slug: string;
  };
  branch: {
    id: string;
  } | null;
}

export interface AdminContext {
  userId: string;
  tenantId: string | null;
  branchId: string | null;
  branchIds: string[] | null;
}

export async function resolvePublicTenantContext(request?: Request): Promise<TenantContext | null> {
  const url = request ? new URL(request.url) : null;
  const tenantSlug = url?.searchParams.get('tenant')?.trim()
    || request?.headers.get('x-cafeflow-tenant')?.trim()
    || process.env.CAFEFLOW_DEFAULT_TENANT_SLUG?.trim();
  const requestedBranchId = url?.searchParams.get('branch')?.trim()
    || request?.headers.get('x-cafeflow-branch')?.trim()
    || request?.headers.get('cookie')?.match(/(?:^|;\s*)cafeflowBranch=([^;]+)/)?.[1]?.trim();
  const host = request?.headers.get('x-forwarded-host')?.split(',')[0]?.trim().toLowerCase()
    || request?.headers.get('host')?.trim().toLowerCase();
  const hostname = host?.replace(/:\d+$/, '');
  const domainTenant = hostname
    ? await prisma.tenant_domains.findFirst({
      where: { hostname, status: 'verified' },
      select: { tenant: { select: { id: true, currency: true, slug: true } } },
    })
    : null;
  const tenant = domainTenant?.tenant || (tenantSlug
    ? await prisma.tenants.findUnique({ where: { slug: tenantSlug }, select: { id: true, currency: true, slug: true } })
    : null);
  if (!tenant) return null;

  const activeTenant = await prisma.tenants.findFirst({
    where: { id: tenant.id, status: { in: ['trial', 'active'] } },
    select: { id: true, currency: true, slug: true },
  });
  if (!activeTenant) return null;

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
  const branch = requestedBranchId ? branches[0] || null : branches.length === 1 ? branches[0] : null;
  return { tenant: activeTenant, branch };
}

export async function resolveAdminContext(userId: string): Promise<AdminContext | null> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { tenant_id: true, branch_id: true },
  });
  if (!user) return null;

  const memberships = await prisma.branch_memberships.findMany({
    where: { user_id: userId, status: 'active' },
    select: { branch_id: true },
  });
  const branchIds = memberships.length ? memberships.map((membership) => membership.branch_id) : null;
  return {
    userId,
    tenantId: user.tenant_id,
    branchId: user.branch_id,
    branchIds,
  };
}