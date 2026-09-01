// Map routes to specific client credentials
export const customerAuthRoutes: Array<{
  pattern: RegExp;
  description: string;
}> = [
  {
    pattern: /^\/v1\/customer-orders\/?(\?.*)?$/,
    description: '/v1/customer-orders',
  },
  {
    pattern: /^\/v1\/customer-sales\/dropdown(\?.*)?$/,
    description: '/v1/customer-sales/dropdown',
  },
  {
    pattern: /^\/v1\/customer-locations(\?.*)?$/,
    description: '/v1/customer-locations',
  },
  {
    pattern: /^\/v1\/customer-locations\/[0-9a-fA-F-]+(\?.*)?$/,
    description: '/v1/customer-locations/:id',
  },
  {
    pattern: /^\/v1\/customer-orders\/template(\?.*)?$/,
    description: '/v1/customer-orders/template',
  },
  {
    pattern: /^\/v1\/vehicle-types\/dropdown\/customer(\?.*)?$/,
    description: '/v1/vehicle-types/dropdown/customer',
  },
  {
    pattern: /^\/v1\/customer-orders\/getEta(\?.*)?$/,
    description: '/v1/customer-orders/getEta',
  },
  {
    pattern: /^\/v1\/customer-orders\/[0-9a-fA-F-]+(\?.*)?$/,
    description: '/v1/customer-orders/:id',
  },
  {
    pattern: /^\/v1\/locations\/dropdown\/customer(\?.*)?$/,
    description: '/v1/locations/dropdown/customer',
  },
];
