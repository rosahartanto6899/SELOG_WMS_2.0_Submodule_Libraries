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
];
