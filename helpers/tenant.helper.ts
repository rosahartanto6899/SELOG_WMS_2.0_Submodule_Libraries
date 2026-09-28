/**
 * Multi-tenant helpers: Customer entity is the tenant.
 * Tenant access comes from the token session (roles[].customers).
 */
export function getActiveCustomerId(user: any): string | null {
  return user?.tokenCustomerId ?? null;
}

export function getActiveWarehouseId(user: any): string | null {
  return user?.tokenWarehouseId ?? null;
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

interface RoleWarehouse {
  warehouse?: {
    code?: string;
    name?: string | null;
    customerId?: string | null;
  } | null;
}

/** Role warehouses → session `warehouses` unik, HANYA milik customer aktif.
 *  Role multi-customer (mis. SUPERADMIN) punya warehouse semua customernya —
 *  tanpa penyaringan, session/req.user.warehouses (SOH All SLOC, validasi
 *  AHM, switcher FE) melihat warehouse customer lain.
 *  activeCustomerId null/undefined = tanpa tenant aktif → semua (perilaku
 *  lama, setup tanpa customer). */
export function tenantScopedWarehouses(
  roleWarehouses: RoleWarehouse[],
  activeCustomerId?: string | null,
): { warehouseCode: string; warehouseName: string | null }[] {
  return Array.from(
    new Map<string, { warehouseCode: string; warehouseName: string | null }>(
      (roleWarehouses || [])
        .filter(
          (w) =>
            w.warehouse?.code &&
            (!activeCustomerId ||
              w.warehouse.customerId === activeCustomerId),
        )
        .map((w) => [
          w.warehouse.code as string,
          {
            warehouseCode: w.warehouse.code as string,
            warehouseName: w.warehouse.name ?? null,
          },
        ]),
    ).values(),
  );
}
