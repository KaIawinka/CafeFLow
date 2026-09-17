import { branch_capability } from '@prisma/client';

const restrictedCapabilities = new Set<branch_capability>([
  'manage_staff',
  'manage_settings',
  'manage_domains',
  'view_audit',
]);

export function canGrantCapabilities(role: string | undefined, capabilities: branch_capability[]) {
  return role === 'admin' || !capabilities.some((capability) => restrictedCapabilities.has(capability));
}

export function canAccessBranch(branchId: string, accessibleBranchIds: string[] | null) {
  return accessibleBranchIds === null || accessibleBranchIds.includes(branchId);
}

export function canAccessTenantResource(params: {
  tenantId: string;
  accessibleTenantId: string | null;
  branchId: string | null;
  accessibleBranchIds: string[] | null;
}) {
  if (!params.accessibleTenantId || params.accessibleTenantId !== params.tenantId) return false;
  if (!params.branchId) return params.accessibleBranchIds === null;
  return canAccessBranch(params.branchId, params.accessibleBranchIds);
}