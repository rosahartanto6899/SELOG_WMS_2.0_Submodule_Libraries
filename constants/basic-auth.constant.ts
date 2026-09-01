// Map routes to specific client credentials
export const basicAuthRoutes: Array<{
  pattern: RegExp;
  clientId: string;
  description: string;
}> = [
  {
    pattern: /^\/v1\/branches\/no-filter(\?.*)?$/,
    clientId: 'default', // Uses BASIC_AUTH_USER/PASS
    description: '/v1/branches/no-filter',
  },
  {
    pattern: /^\/v1\/users\/[^/?]+\/role(\?.*)?$/,
    clientId: 'default',
    description: '/v1/users/:roleId/role',
  },
  {
    pattern: /^\/v1\/users\/ids\/role(\?.*)?$/,
    clientId: 'default',
    description: '/v1/users/ids/role',
  },
  {
    pattern: /^\/v1\/customers\/by-ids(\?.*)?$/,
    clientId: 'default',
    description: '/v1/customers/by-ids',
  },
  {
    pattern: /^\/v1\/customers\/ids(\?.*)?$/,
    clientId: 'default',
    description: '/v1/customers/ids',
  },
  {
    pattern: /^\/v1\/customers\/external(\?.*)?$/,
    clientId: 'damira',
    description: '/v1/customers/external',
  },
  {
    pattern: /^\/v1\/vehicle-types\/dropdown-no-filter(\?.*)?$/,
    clientId: 'default',
    description: '/v1/vehicle-types/dropdown-no-filter',
  },
  {
    pattern: /^\/v1\/customers\/cmd\/[^/?]+(\/)?(\?.*)?$/,
    clientId: 'default',
    description: '/v1/customers/cmd/:cmd',
  },
  {
    pattern: /^\/v1\/districts\/by-name(\?.*)?$/,
    clientId: 'default',
    description: '/v1/districts/by-name',
  },
  {
    pattern: /^\/v1\/booking-orders\/[^/?]+\/vehicle(\?.*)?$/,
    clientId: 'default',
    description: '/v1/booking-orders/:vehicleId/vehicle',
  },
  {
    pattern: /^\/v1\/schedulers\/capacity-statuses(\?.*)?$/,
    clientId: 'default',
    description: '/v1/schedulers/capacity-statuses',
  },
  {
    pattern: /^\/v1\/schedulers\/performance(\?.*)?$/,
    clientId: 'default',
    description: '/v1/schedulers/performance',
  },
  {
    pattern: /^\/v1\/drivers\/ids(\?.*)?$/,
    clientId: 'default',
    description: '/v1/drivers/ids',
  },
  {
    pattern: /^\/v1\/drivers\/register-waha(\?.*)?$/,
    clientId: 'default',
    description: '/v1/drivers/register-waha',
  },
  {
    pattern: /^\/v1\/voice-of-drivers\/external(\?.*)?$/,
    clientId: 'skyward',
    description: '/v1/voice-of-drivers/external',
  },
  {
    pattern: /^\/v1\/order-statuses\/internal\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/order-statuses/internal/:id',
  },
  {
    pattern: /^\/v1\/customers\/internal\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/customers/internal/:id',
  },
  {
    pattern: /^\/v1\/branches\/internal\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/branches/internal/:id',
  },
  {
    pattern: /^\/v1\/vehicles\/internal\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/vehicles/internal/:id',
  },
  {
    pattern: /^\/v1\/shipment\/external(\?.*)?$/,
    clientId: 'skyward',
    description: '/v1/shipment/external',
  },
  {
    pattern: /^\/v1\/shipment\/tracking(\?.*)?$/,
    clientId: 'default',
    description: '/v1/shipment/tracking',
  },
  {
    pattern: /^\/v1\/shipment\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/shipment/:id',
  },
  {
    pattern:
      /^\/v1\/shipment-expenses\/[0-9a-fA-F-]+\/cancellation-eligibility(\?.*)?$/,
    clientId: 'default',
    description: '/v1/shipment-expenses/:shipmentId/cancellation-eligibility',
  },
  {
    pattern: /^\/v1\/locations\/ids\/no-filter(\?.*)?$/,
    clientId: 'default',
    description: '/v1/locations/ids/no-filter',
  },
  {
    pattern: /^\/v1\/activity-histories\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/activity-histories/:shipmentId',
  },
  {
    pattern: /^\/v1\/activity-histories\/cancellation(\?.*)?$/,
    clientId: 'default',
    description: '/v1/activity-histories/cancellation',
  },
  {
    pattern: /^\/v1\/activity-histories\/bulk(\?.*)?$/,
    clientId: 'default',
    description: '/v1/activity-histories/bulk',
  },
  {
    pattern: /^\/v1\/driver-activities\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/driver-activities/:shipmentId',
  },
  {
    description: '/v1/users/ids',
    clientId: 'default',
    pattern: /^\/v1\/users\/ids(\/)?(\?.*)?$/,
  },
  {
    pattern: /^\/v1\/shipment\/[0-9a-fA-F-]+\/vehicle(\?.*)?$/,
    clientId: 'default',
    description: '/v1/shipment/:id/vehicle',
  },
  {
    pattern: /^\/v1\/shipment\/[0-9a-fA-F-]+\/update-journey-date(\?.*)?$/,
    clientId: 'default',
    description: '/v1/shipment/:id/update-journey-date',
  },
  {
    pattern: /^\/v1\/drivers\/[^/?]+\/vkvd(\/)?(\?.*)?$/,
    clientId: 'default',
    description: '/v1/drivers/:id/vkvd',
  },
  {
    pattern: /^\/v1\/order-statuses\/active-ids(\?.*)?$/,
    clientId: 'default',
    description: '/v1/order-statuses/active-ids',
  },
  {
    pattern: /^\/v1\/voice-of-drivers\/[0-9a-fA-F-]+\/external(\?.*)?$/,
    clientId: 'skyward',
    description: '/v1/voice-of-drivers/:id/external',
  },
  {
    pattern: /^\/v1\/roles\/internal\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/roles/internal/:id',
  },
  {
    pattern: /^\/v1\/internal\/journey-activities\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/internal/journey-activities/:id',
  },
  {
    pattern: /^\/v1\/pod\/[0-9a-fA-F-]+\/termin(\?.*)?$/,
    clientId: 'default',
    description: '/v1/pod/:shipmentId/termin',
  },
  {
    pattern: /^\/v1\/driver-performances\/on-time-delivery(\?.*)?$/,
    clientId: 'default',
    description: '/v1/driver-performances/on-time-delivery',
  },
  {
    pattern: /^\/v1\/driver-performances\/on-time-pod-return(\?.*)?$/,
    clientId: 'default',
    description: '/v1/driver-performances/on-time-pod-return',
  },
  {
    pattern: /^\/v1\/driver-performances\/on-time-pickup(\?.*)?$/,
    clientId: 'default',
    description: '/v1/driver-performances/on-time-pickup',
  },
  {
    pattern: /^\/v1\/locations\/[^/?]+\/code(\/)?(\?.*)?$/,
    clientId: 'default',
    description: '/v1/locations/:id/code',
  },
  {
    pattern: /^\/v1\/branch-sales-group-mappings\/branch\/[^/?]+(\/)?(\?.*)?$/,
    clientId: 'default',
    description: '/v1/branch-sales-group-mappings/branch/:branchId',
  },
  {
    pattern: /^\/v1\/users\/internal\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/users/internal/:id',
  },
  {
    pattern: /^\/v1\/shipment\/check-other-shipment(\?.*)?$/,
    clientId: 'default',
    description: '/v1/shipment/check-other-shipment',
  },
  {
    pattern: /^\/v1\/shipment\/check-other-shipment\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/shipment/check-other-shipment/:id',
  },
  {
    pattern: /^\/v1\/shipment-expenses\/shipment\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/shipment-expenses/shipment/:id',
  },
  {
    pattern: /^\/v1\/locations\/internal\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/locations/internal/:customerId',
  },
  {
    pattern: /^\/v1\/cities\/ids(\?.*)?$/,
    clientId: 'default',
    description: '/v1/cities/ids',
  },
  {
    pattern: /^\/v1\/location-hierarchies\/districts\/resolve-by-names(\?.*)?$/,
    clientId: 'default',
    description: '/v1/location-hierarchies/districts/resolve-by-names',
  },
  {
    clientId: 'default',
    description: '/v1/shipment-expenses/:id/transaction',
    pattern: /^\/v1\/shipment-expenses\/[0-9a-fA-F-]+\/transaction(\?.*)?$/,
  },
  {
    pattern: /^\/v1\/location-hierarchies\/districts(\?.*)?$/,
    clientId: 'default',
    description: '/v1/location-hierarchies/districts',
  },
  {
    pattern: /^\/v1\/location-hierarchies\/locations\/resolve-by-ids(\?.*)?$/,
    clientId: 'default',
    description: '/v1/location-hierarchies/locations/resolve-by-ids',
  },
  {
    pattern: /^\/v1\/location-hierarchies\/provinces\/resolve-by-names(\?.*)?$/,
    clientId: 'default',
    description: '/v1/location-hierarchies/provinces/resolve-by-names',
  },
  {
    pattern: /^\/v1\/location-hierarchies\/cities\/resolve-by-names(\?.*)?$/,
    clientId: 'default',
    description: '/v1/location-hierarchies/cities/resolve-by-names',
  },
  {
    pattern: /^\/v1\/journey-supports\/[0-9a-fA-F-]+\/plan-otd(\?.*)?$/,
    clientId: 'default',
    description: '/v1/journey-supports/:id/plan-otd',
  },
  {
    pattern: /^\/v1\/activity-histories\/shipment\/ids(\?.*)?$/,
    clientId: 'default',
    description: '/v1/activity-histories/shipment/ids',
  },
  {
    pattern: /^\/v1\/journey-histories\/internal\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/journey-histories/internal/:shipmentId',
  },
  {
    pattern: /^\/v1\/journey-supports\/shipment-ids(\?.*)?$/,
    clientId: 'default',
    description: '/v1/journey-supports/shipment-ids',
  },
  {
    pattern:
      /^\/v1\/shipment-expense-actual\/[0-9a-fA-F-]+\/transferred-termin-1(\?.*)?$/,
    clientId: 'default',
    description: '/v1/shipment-expense-actual/:id/transferred-termin-1',
  },
  {
    pattern: /^\/v1\/drop-centers\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/drop-centers/:id',
  },
  {
    pattern:
      /^\/v1\/branch-sales-group-mappings\/drop-center\/[^/?]+(\/)?(\?.*)?$/,
    clientId: 'default',
    description: '/v1/branch-sales-group-mappings/drop-center/:dropCenterId',
  },
  {
    pattern: /^\/v1\/order-confirmations\/ai-shipment-confirmed(\?.*)?$/,
    clientId: 'default',
    description: '/v1/order-confirmations/ai-shipment-confirmed',
  },
  {
    pattern: /^\/v1\/outstanding-approvals\/approval-matrix(\?.*)?$/,
    clientId: 'default',
    description: '/v1/outstanding-approvals/approval-matrix',
  },
  {
    pattern: /^\/v1\/customer-contracts\/internal\/[0-9a-fA-F-]+(\?.*)?$/,
    clientId: 'default',
    description: '/v1/customer-contracts/internal/:id',
  },
];
