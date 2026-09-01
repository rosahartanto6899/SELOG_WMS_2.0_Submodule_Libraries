/**
 * Multi-tenant helpers: Customer entity is the tenant.
 * Tenant access comes from the token session (roles[].customers).
 */
export function getActiveCustomerId(user: any): string | null {
  return user?.tokenCustomerId ?? null;
}

export function getAccessibleCustomerIds(user: any): string[] {
  const roles = user?.tokenRoles || [];
  return Array.from(
    new Set(
      roles.flatMap((role: any) => role?.customers || []),
    ),
  );
}

export function hasCustomerAccess(user: any, customerId: string): boolean {
  if (!customerId) return false;
  return getAccessibleCustomerIds(user).includes(customerId);
}

export function isTenantSuperadmin(user: any): boolean {
  // superadmin bypass tenant scoping; refine when tenant admins exist
  return user?.tokenRole === 'SUPERADMIN';
}
