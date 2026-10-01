// Map routes to specific client credentials
export const basicAuthRoutes: Array<{
  pattern: RegExp;
  clientId: string;
  description: string;
}> = [
  {
    pattern: /^\/v1\/materials\/internal\/by-code\/[^/?]+(\/)?(\?.*)?$/,
    clientId: 'default',
    description: '/v1/materials/internal/by-code/:code',
  },
  {
    // m2m Basic auth SERVICE_ACCOUNT — dipakai ServiceIncoming incoming-file-processor
    // (parity GetWarehouseFromInternalServiceAsync, ganti MasterData legacy)
    pattern: /^\/v1\/warehouses\/internal\/all(\/)?(\?.*)?$/,
    clientId: 'default',
    description: '/v1/warehouses/internal/all',
  },
  {
    // m2m Basic auth — guard stop-transaction binning (ServiceIncoming)
    // & picking (ServiceOutgoing)
    pattern: /^\/v1\/warehouses\/internal\/stop-transaction\/[^/?]+(\/)?(\?.*)?$/,
    clientId: 'default',
    description: '/v1/warehouses/internal/stop-transaction/:code',
  },
];
