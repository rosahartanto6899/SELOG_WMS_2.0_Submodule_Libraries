export const noAuthRoutes = new Set([
  '/',
  '/v1/login',
  '/v1/logout',
  '/v1/login/provider',
  '/v1/login/local',
  '/v1/register',
  '/v1/forgot-password',
  '/v1/refresh-token',
  '/v1/auths', // Allow POST /v1/auths for driver authentication
  '/v1/health',
  '/v1/customer-auth/login',
  '/v1/customer-auth/register-waha',
]);
