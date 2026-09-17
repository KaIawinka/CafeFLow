import { describe, expect, it } from 'vitest';
import { canAccessBranch, canGrantCapabilities } from './branch-access';

describe('branch access policy', () => {
  it('allows an admin to grant any capability', () => {
    expect(canGrantCapabilities('admin', ['manage_staff', 'manage_settings', 'view_audit'])).toBe(true);
  });

  it('prevents a manager from granting system capabilities', () => {
    expect(canGrantCapabilities('manager', ['manage_staff'])).toBe(false);
    expect(canGrantCapabilities('manager', ['manage_orders', 'manage_menu'])).toBe(true);
  });

  it('limits branch-bound users to their memberships', () => {
    expect(canAccessBranch('branch-a', ['branch-a', 'branch-b'])).toBe(true);
    expect(canAccessBranch('branch-c', ['branch-a', 'branch-b'])).toBe(false);
  });

  it('allows tenant-wide users to access any branch', () => {
    expect(canAccessBranch('branch-c', null)).toBe(true);
  });
});