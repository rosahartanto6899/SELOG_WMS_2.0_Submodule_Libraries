// Map routes to specific client credentials
export const driverAuthRoutes: Array<{
  pattern: RegExp;
  description: string;
}> = [
    {
      pattern: /^\/v1\/driver-mini-apps\/pod\/loading(\?.*)?$/,
      description: '/v1/driver-mini-apps/pod/loading',
    },
    {
      pattern: /^\/v1\/driver-mini-apps\/pod\/unloading(\?.*)?$/,
      description: '/v1/driver-mini-apps/pod/unloading',
    },
    {
      pattern: /^\/v1\/driver-mini-apps\/pod\/timestamp(\?.*)?$/,
      description: '/v1/driver-mini-apps/pod/timestamp',
    },
    {
      pattern: /^\/v1\/driver-mini-apps\/pod\/receipt(\?.*)?$/,
      description: '/v1/driver-mini-apps/pod/receipt',
    },
    {
      pattern: /^\/v1\/driver-mini-apps\/pod\/[0-9a-fA-F-]+(\?.*)?$/,
      description: '/v1/driver-mini-apps/pod/:id',
    },
    {
      pattern: /^\/v1\/shipment\/[0-9a-fA-F-]+\/travel-document(\?.*)?$/,
      description: '/v1/shipment/:id/travel-document',
    },
    {
      pattern: /^\/v1\/driver-health-assessment(\?.*)?$/,
      description: '/v1/driver-health-assessment',
    },
    {
      pattern: /^\/v1\/health-assessment-questions(\?.*)?$/,
      description: '/v1/health-assessment-questions',
    },
  ];
