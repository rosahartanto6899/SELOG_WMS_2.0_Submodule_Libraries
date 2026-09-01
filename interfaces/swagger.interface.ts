/**
 * Configuration options for an HTTP proxy integration that forwards API requests to an upstream service.
 *
 * @remarks
 * Use this interface to declare how incoming requests should be transformed and proxied to an external endpoint,
 * including path mapping, headers to forward, CORS behavior, and optional VPC routing.
 *
 * @property method - The HTTP method to use when calling the upstream service (e.g., "GET", "POST", "PUT", "DELETE").
 * @property path - The target path on the upstream service. May include parameter placeholders; parameter names should be listed in `pathParams` (without braces).
 * @property pathParams - An array of path parameter names to extract from the incoming request and substitute into the `path`.
 * @property baseUrl - The base URL (scheme + host [+ port]) of the upstream service that will be prefixed to the `path`.
 * @property vpcLinkId - Optional. Identifier of a VPC Link to route traffic through for private integrations.
 * @property headers - Optional. Names of headers to forward from the incoming request to the upstream service.
 * @property allowedOrigins - Optional. Origins to include in CORS responses; used to populate the Access-Control-Allow-Origin header.
 * @property includeCorsInResponse - Optional. When true, automatically include CORS response headers (e.g., Access-Control-Allow-Origin) in proxied responses.
 */
export interface HttpProxyIntegrationOptions {
  method: string;
  path: string;
  pathParams: string[];
  baseUrl: string;
  vpcLinkId?: string;
  headers?: string[];
  allowedOrigins?: string[];
  includeCorsInResponse?: boolean;
}

/**
 * Represents a Swagger/OpenAPI Path item containing one or more operation objects and optional shared parameters.
 *
 * The index signature allows arbitrary keys (commonly HTTP methods such as "get", "post", "put", "delete",
 * "patch", "head", "options") to map to their corresponding operation definitions. Values are left as `any`
 * to reflect the flexible shape of operation objects in different OpenAPI versions and vendor extensions.
 *
 * @remarks
 * - Implementations should treat keys case-insensitively when matching HTTP methods.
 * - The explicit `options` property mirrors the common HTTP OPTIONS operation; it is optional and may be
 *   used either for the OPTIONS operation or for custom metadata depending on the codebase convention.
 * - `parameters` are shared parameters that apply to all operations on the path unless overridden by
 *   operation-level parameters.
 *
 * @property [method: string] - An operation object or any other path-level entry (e.g., vendor extensions).
 *   Typical keys are HTTP methods ("get", "post", etc.) and each value is the corresponding operation definition.
 *
 * @property options - Optional entry commonly used for the HTTP OPTIONS operation or path-level options/metadata.
 *
 * @property parameters - Optional array of shared parameter objects for the path. Each parameter includes:
 *   - `name`: the parameter name.
 *   - `in`: where the parameter is located (e.g., "path", "query", "header", "cookie").
 *   - `required`: whether the parameter is required.
 *   - `schema`: a minimal schema object, here represented with `{ type: string }` to describe the value type.
 *
 * @example
 * // Example shape (conceptual)
 * // {
 * //   get: { /* operation object *\/ },
 * //   post: { /* operation object *\/ },
 * //   options: { /* options/operation object *\/ },
 * //   parameters: [
 * //     { name: "id", in: "path", required: true, schema: { type: "string" } }
 * //   ]
 * // }
 */
export interface SwaggerPath {
  [method: string]: any;
  options?: any;
  parameters?: Array<{
    name: string;
    in: string;
    required: boolean;
    schema: { type: string };
  }>;
}

/**
 * Describes optional OpenAPI/Swagger metadata that can be associated with a route, controller, or operation.
 *
 * - Intended to carry high-level operation metadata (tags, response definitions, and other OpenAPI-compatible fields).
 * - Allows arbitrary additional properties to support vendor extensions or framework-specific annotations.
 *
 * Properties:
 * - tags?: string[]
 *   - An optional list of tag names used to group operations in generated documentation.
 *   - Each entry is typically a short, human-readable category name (e.g., "Users", "Orders").
 *
 * - responses?: Record<string, any>
 *   - An optional mapping of response codes (e.g., "200", "404", "default") to response description/metadata.
 *   - Values are intentionally typed as `any` here — in practice they should follow the OpenAPI Response Object shape
 *     (description, headers, content, examples, etc.).
 *
 * - [key: string]: any
 *   - Permits additional arbitrary properties for extensibility (for example OpenAPI fields like `summary`, `description`,
 *     `operationId`, `deprecated`, or vendor extensions such as `x-*`).
 *   - Consumers should prefer OpenAPI conventions for additional fields and ensure values are serializable.
 *
 * Usage notes:
 * - This interface is a lightweight container for Swagger-related annotations and is not a full OpenAPI schema.
 * - When possible, validate `responses` values against your OpenAPI tooling to ensure generated docs are accurate.
 *
 * Example:
 * {
 *   tags: ["Users"],
 *   responses: {
 *     "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } }
 *   },
 *   "x-internal": true
 * }
 */
export interface SwaggerIntegration {
  tags?: string[];
  responses?: Record<string, any>;
  [key: string]: any;
}

/**
 * Configuration options for building Swagger / OpenAPI documentation for an application.
 *
 * Provides metadata and discovery rules used by a Swagger generator to produce
 * the API specification and populate the servers section.
 *
 * @property title - Human-readable title for the API documentation (required).
 * @property version - Optional API version string (for example: "1.0.0"). If omitted, the consumer may apply a default.
 * @property openapiVersion - Optional OpenAPI specification version (for example: "3.0.0"). If omitted, the consumer may apply a default.
 * @property serverUrl - Base URL of the API server (for example: "https://api.example.com"). This value is used to populate the `servers` entry in the generated spec.
 * @property apiPaths - Read-only array of file path patterns or globs that identify source files to scan for API endpoints and decorators (for example: ["src/**\/*.controller.ts"]).
 *
 * @remarks
 * - Implementations should treat `version` and `openapiVersion` as optional and document any defaults they apply.
 * - `apiPaths` is readonly to emphasize that the array of discovery patterns should not be mutated by consumers.
 *
 * @example
 * const opts: SwaggerOptionsConfig = {
 *   title: "My Service API",
 *   version: "1.2.0",
 *   openapiVersion: "3.0.3",
 *   serverUrl: "https://api.myservice.com",
 *   apiPaths: ["src/modules/**\/controllers/*.ts"]
 * };
 */
export interface SwaggerOptionsConfig {
  title: string;
  version?: string;
  openapiVersion?: string;
  serverUrl: string;
  apiPaths: readonly string[];
}

/**
 * Configuration options used to create or process an API endpoint derived from a Swagger/OpenAPI definition.
 *
 * Describes how the endpoint should be exposed (HTTP method and path), how it integrates with a backend,
 * and any transport- or CORS-related metadata required when wiring the endpoint into an API gateway or proxy.
 *
 * @property method - The HTTP method for the endpoint (e.g., "GET", "POST", "PUT", "DELETE").
 * @property integration - The SwaggerIntegration value describing the type/details of the backend integration.
 * @property path - The endpoint path template (for example "/users/{id}"), including any parameter placeholders.
 * @property pathParams - An array of path parameter names extracted from `path` (e.g., ["id"] for "/users/{id}").
 * @property baseUrl - The base URL of the upstream service (scheme + host and optional base path) to which requests are forwarded.
 * @property vpcLinkId - Optional identifier of a VPC Link to use when the integration must route traffic into a VPC.
 * @property headers - Optional list of header names that should be forwarded to the integration or otherwise included in requests.
 * @property allowedOrigins - Optional list of allowed origins for CORS; used to populate Access-Control-Allow-Origin responses.
 * @property includeCorsInResponse - When true, include standard CORS response headers (e.g., Allow-Origin, Allow-Methods) on responses.
 */
export interface ProcessEndpointOptions {
  method: string;
  integration: SwaggerIntegration;
  path: string;
  pathParams: string[];
  baseUrl: string;
  vpcLinkId?: string;
  headers?: string[];
  allowedOrigins?: string[];
  includeCorsInResponse?: boolean;
}
