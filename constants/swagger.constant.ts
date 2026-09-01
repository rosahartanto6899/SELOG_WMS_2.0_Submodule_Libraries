// Swagger Configuration Constants
export const SWAGGER_CONFIG = {
  OPENAPI_VERSION: '3.0.0',
  API_VERSION: '4.0.0',
  VPC_LINK_CONNECTION_ID: 'tbr2om',
  VPC_LINK_CONNECTION_ID_PRODUCTION: '0c20yc',
} as const;

// CORS Headers Configuration
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': { schema: { type: 'string' } },
  'Access-Control-Allow-Methods': { schema: { type: 'string' } },
  'Access-Control-Allow-Headers': { schema: { type: 'string' } },
} as const;

// CORS Response Parameters
export const CORS_RESPONSE_PARAMETERS = {
  'method.response.header.Access-Control-Allow-Methods':
    "'DELETE,GET,OPTIONS,PUT,POST,PATCH'",
  'method.response.header.Access-Control-Allow-Headers':
    "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,User-Agent,Lang'",
  'method.response.header.Access-Control-Allow-Origin': "'*'",
} as const;

// Mock CORS Response Parameters (restricted methods)
export const MOCK_CORS_RESPONSE_PARAMETERS = {
  ...CORS_RESPONSE_PARAMETERS,
  'method.response.header.Access-Control-Allow-Methods': "'GET,OPTIONS'",
} as const;

// Default Error Responses
export const DEFAULT_ERROR_RESPONSES = {
  '401': { error: 'Unauthorized', message: 'Authentication required' },
  '500': { error: 'Internal Server Error', message: 'Something went wrong' },
} as const;

// Swagger API File Paths
export const SWAGGER_API_PATHS = [
  './src/features/**/*/*.controller.ts',
  './src/features/**/*/dtos/*.dto.ts',
  './src/features/**/*/dto/*.dto.ts',
] as const;
