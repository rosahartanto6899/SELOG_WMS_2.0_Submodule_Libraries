import swaggerJsdoc from 'swagger-jsdoc';
import {
  SWAGGER_CONFIG,
  CORS_HEADERS,
  CORS_RESPONSE_PARAMETERS,
  MOCK_CORS_RESPONSE_PARAMETERS,
  DEFAULT_ERROR_RESPONSES,
} from '@/shared-libs/constants';
import {
  HttpProxyIntegrationOptions,
  ProcessEndpointOptions,
  SwaggerIntegration,
  SwaggerOptionsConfig,
  SwaggerPath,
} from '@/shared-libs/interfaces';

/**
 * Creates Swagger/OpenAPI options configuration
 * @param config - Configuration object for Swagger documentation
 * @returns Swagger JSDoc options
 */
export function createSwaggerOptions(
  config: SwaggerOptionsConfig
): swaggerJsdoc.Options {
  return {
    definition: {
      openapi: config.openapiVersion || SWAGGER_CONFIG.OPENAPI_VERSION,
      info: {
        title: config.title,
        version: config.version || SWAGGER_CONFIG.API_VERSION,
      },
      servers: [{ url: config.serverUrl }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          api_key: {
            type: 'apiKey',
            name: 'x-api-key',
            in: 'header',
          },
        },
      },
    },
    apis: [...config.apiPaths],
  };
}

/**
 * Creates an OPTIONS method configuration for CORS preflight requests
 * @returns OPTIONS method configuration object
 */
export function createOptionsMethod() {
  return {
    responses: {
      '200': {
        description: '200 response',
        headers: CORS_HEADERS,
      },
    },
    'x-amazon-apigateway-integration': {
      responses: {
        default: {
          statusCode: '200',
          responseParameters: CORS_RESPONSE_PARAMETERS,
        },
      },
      requestTemplates: {
        'application/json': '{"statusCode": 200}',
      },
      passthroughBehavior: 'when_no_match',
      type: 'mock',
    },
  };
}

/**
 * Extracts path parameters from a path string (e.g., /users/{id}/posts/{postId})
 * @param path - The path string containing parameters in curly braces
 * @returns Array of parameter names
 */
export function extractPathParameters(path: string): string[] {
  return [...path.matchAll(/{([a-zA-Z_]\w{0,49})}/g)].map((match) => match[1]);
}

/**
 * Creates path parameter definitions for OpenAPI specification
 * @param pathParams - Array of parameter names
 * @returns Array of parameter definition objects
 */
export function createPathParameters(pathParams: string[]) {
  return pathParams.map((param) => ({
    name: param,
    in: 'path' as const,
    required: true,
    schema: { type: 'string' },
  }));
}

/**
 * Adds CORS headers to all responses in an integration
 * @param integration - The swagger integration object to modify
 */
export function addCorsHeaders(integration: SwaggerIntegration): void {
  if (!integration.responses) return;

  Object.values(integration.responses).forEach((response: any) => {
    if (response && !response.headers) {
      response.headers = { ...CORS_HEADERS };
    }
  });
}

/**
 * Type guard to check if a status code has a default error response
 * @param statusCode - The HTTP status code to check
 * @returns True if the status code has a default error response
 */
export function isErrorStatusCode(
  statusCode: string
): statusCode is keyof typeof DEFAULT_ERROR_RESPONSES {
  return statusCode in DEFAULT_ERROR_RESPONSES;
}

/**
 * Creates a mock integration response for AWS API Gateway
 * @param statusCode - HTTP status code
 * @param integration - The swagger integration containing response examples
 * @returns Mock integration response object
 */
export function createMockIntegrationResponse(
  statusCode: string,
  integration: SwaggerIntegration
) {
  const example =
    integration.responses?.[statusCode]?.content?.['application/json']?.example;

  let defaultResponse = {};
  if (statusCode === '200') {
    defaultResponse = { message: 'No example response defined' };
  } else if (isErrorStatusCode(statusCode)) {
    defaultResponse = DEFAULT_ERROR_RESPONSES[statusCode];
  }

  return {
    statusCode,
    ...(statusCode !== '200' && { selectionPattern: statusCode }),
    responseTemplates: {
      'application/json': JSON.stringify(example || defaultResponse),
    },
    responseParameters: MOCK_CORS_RESPONSE_PARAMETERS,
  };
}

/**
 * Creates a mock integration for AWS API Gateway
 * @param method - HTTP method
 * @param path - API path
 * @param integration - The swagger integration object
 * @param baseUrl - Base URL for the API
 * @returns Mock integration configuration
 */
export function createMockIntegration(
  method: string,
  path: string,
  integration: SwaggerIntegration,
  baseUrl: string
) {
  return {
    responses: {
      default: createMockIntegrationResponse('200', integration),
      '401': createMockIntegrationResponse('401', integration),
      '500': createMockIntegrationResponse('500', integration),
    },
    requestTemplates: {
      'application/json': `
        #set($responseCode = $input.params('x-mock-response-code'))
        {
          "statusCode": #if($responseCode != "") $responseCode #else 200 #end,
          "headers": {
            "Authorization": "$input.params('Authorization')",
            "x-api-key": "$input.params('x-api-key')",
            "Content-Type": "$input.params('Content-Type')"
          }
        }`,
    },
    httpMethod: method,
    uri: `${baseUrl}${path}`,
    passthroughBehavior: 'when_no_match',
    type: 'mock',
  };
}

/**
 * Creates integration responses for AWS API Gateway with CORS headers
 * @param includeCors - Whether to include CORS headers in responses (default: true)
 * @returns Integration responses configuration
 */
export function createIntegrationResponses(includeCors: boolean = true) {
  const corsResponseParameters = includeCors
    ? {
        'method.response.header.Access-Control-Allow-Origin': "'*'",
        'method.response.header.Access-Control-Allow-Headers':
          "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,User-Agent,Lang'",
        'method.response.header.Access-Control-Allow-Methods':
          "'DELETE,GET,OPTIONS,PUT,POST,PATCH'",
      }
    : {};

  return {
    default: {
      statusCode: '200',
      responseParameters: corsResponseParameters,
    },
    '201': {
      statusCode: '201',
      selectionPattern: '201',
      responseParameters: corsResponseParameters,
    },
    '400': {
      statusCode: '400',
      selectionPattern: '400',
      responseParameters: corsResponseParameters,
    },
    '401': {
      statusCode: '401',
      selectionPattern: '401',
      responseParameters: corsResponseParameters,
    },
    '403': {
      statusCode: '403',
      selectionPattern: '403',
      responseParameters: corsResponseParameters,
    },
    '404': {
      statusCode: '404',
      selectionPattern: '404',
      responseParameters: corsResponseParameters,
    },
    '422': {
      statusCode: '422',
      selectionPattern: '422',
      responseParameters: corsResponseParameters,
    },
    '500': {
      statusCode: '500',
      selectionPattern: '500',
      responseParameters: corsResponseParameters,
    },
    '503': {
      statusCode: '503',
      selectionPattern: '503',
      responseParameters: corsResponseParameters,
    },
  };
}

/**
 * Creates an HTTP proxy integration for AWS API Gateway with VPC Link
 * @param options - Configuration options for the HTTP proxy integration
 * @returns HTTP proxy integration configuration
 */
export function createHttpProxyIntegration(
  options: HttpProxyIntegrationOptions
) {
  const {
    method,
    path,
    pathParams,
    baseUrl,
    vpcLinkId,
    headers,
    allowedOrigins,
    includeCorsInResponse = true,
  } = options;

  const requestParameters: Record<string, string> = {};

  // Add path parameters
  if (pathParams.length > 0) {
    pathParams.forEach((param) => {
      requestParameters[
        `integration.request.path.${param}`
      ] = `method.request.path.${param}`;
    });
  }

  // Add header parameters
  if (headers && headers.length > 0) {
    headers.forEach((header) => {
      requestParameters[
        `integration.request.header.${header}`
      ] = `method.request.header.${header}`;
    });
  }
  // Note: Authorization header is passed through automatically with http_proxy type
  // Do not explicitly map it to avoid AWS API Gateway parsing issues

  // Create request templates with origin validation if allowed origins are provided
  const requestTemplates: Record<string, string> = {};
  if (allowedOrigins && allowedOrigins.length > 0) {
    const originsArray = allowedOrigins
      .map((origin) => `"${origin}"`)
      .join(',\n  ');
    requestTemplates['application/json'] = `#set($domains = [
  ${originsArray}
])
#set($origin = $input.params("origin"))
#if(!$domains.contains($origin))
  #set($context.requestOverride.header.Authorization = '')
#end`;
  }

  return {
    httpMethod: method,
    uri: `${baseUrl}${path}`,
    connectionType: 'VPC_LINK',
    connectionId: vpcLinkId || SWAGGER_CONFIG.VPC_LINK_CONNECTION_ID,
    passthroughBehavior: 'when_no_match',
    type: 'http_proxy',
    ...(Object.keys(requestParameters).length > 0 && { requestParameters }),
    ...(Object.keys(requestTemplates).length > 0 && { requestTemplates }),
    responses: createIntegrationResponses(includeCorsInResponse),
  };
}

/**
 * Processes a single endpoint method and adds appropriate AWS API Gateway integration
 * @param options - Configuration options for processing the endpoint
 */
export function processEndpointMethod(options: ProcessEndpointOptions): void {
  const {
    method,
    integration,
    path,
    pathParams,
    baseUrl,
    vpcLinkId,
    headers,
    allowedOrigins,
    includeCorsInResponse = true,
  } = options;

  if (method === 'options') return;

  const isMockEndpoint = integration.tags?.includes('Mock');

  if (isMockEndpoint) {
    addCorsHeaders(integration);
    integration['x-amazon-apigateway-integration'] = createMockIntegration(
      method,
      path,
      integration,
      baseUrl
    );
  } else {
    integration['x-amazon-apigateway-integration'] = createHttpProxyIntegration(
      {
        method,
        path,
        pathParams,
        baseUrl,
        vpcLinkId,
        headers,
        allowedOrigins,
        includeCorsInResponse,
      }
    );
  }
}

/**
 * Processes all paths in Swagger documentation and adds API Gateway integrations
 * @param swaggerDocs - The complete swagger documentation object
 * @param baseUrl - Base URL for the API
 * @param vpcLinkId - VPC Link connection ID (optional)
 * @param headers - Optional headers to forward to integration requests (optional)
 * @param allowedOrigins - Optional array of allowed origins for Authorization header validation
 * @param includeCorsInResponse - Whether to include CORS headers in integration responses (default: true)
 */
export function processSwaggerPaths(
  swaggerDocs: any,
  baseUrl: string,
  vpcLinkId?: string,
  headers?: string[],
  allowedOrigins?: string[],
  includeCorsInResponse: boolean = true
): void {
  const optionsMethod = createOptionsMethod();

  Object.entries(swaggerDocs.paths).forEach(
    ([path, endpoint]: [string, SwaggerPath]) => {
      endpoint.options = optionsMethod;

      const pathParams = extractPathParameters(path);
      if (pathParams.length > 0) {
        endpoint.parameters = createPathParameters(pathParams);
      }

      Object.entries(endpoint).forEach(([method, integration]) => {
        if (typeof integration === 'object' && integration !== null) {
          processEndpointMethod({
            method,
            integration: integration as SwaggerIntegration,
            path,
            pathParams,
            baseUrl,
            vpcLinkId,
            headers,
            allowedOrigins,
            includeCorsInResponse,
          });
        }
      });
    }
  );
}
