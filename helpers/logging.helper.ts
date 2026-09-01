import { logUserActivity } from '@/shared-libs/middlewares/log.middleware';
import { MICROSERVICE_IDENTIFIERS } from '@/shared-libs/constants';

/**
 * Global logging helper that creates standardized logging middleware
 * for controllers across the application.
 *
 * @param action - The action being logged (e.g., 'list-users', 'create-menu')
 * @param serviceIdentifier - Optional service identifier, defaults to SERVICE_USER
 * @returns Express middleware function for logging user activity
 *
 * @example
 * // Basic usage
 * @httpGet('/', QueryValidation(ListDto), withLogging('list-menus'))
 *
 * @example
 * // With custom service identifier
 * @httpGet('/', QueryValidation(ListDto), withLogging('list-items', 'custom-service'))
 */
export const withLogging = (
  action: string,
  serviceIdentifier: string = MICROSERVICE_IDENTIFIERS.UNKNOWN
) => {
  return logUserActivity(action, serviceIdentifier);
};

/**
 * Creates a logging helper bound to a specific service identifier.
 * Useful for controllers that want to avoid repeating the service identifier.
 *
 * @param serviceIdentifier - The service identifier to bind to
 * @returns A logging function that only requires the action parameter
 *
 * @example
 * const logActivity = createServiceLogger(MICROSERVICE_IDENTIFIERS.SERVICE_USER);
 *
 * @httpGet('/', QueryValidation(ListDto), logActivity('list-menus'))
 * @httpPost('/', BodyValidation(CreateDto), logActivity('create-menu'))
 */
export const createServiceLogger = (serviceIdentifier: string) => {
  return (action: string) => logUserActivity(action, serviceIdentifier);
};

/**
 * Common logging actions for CRUD operations.
 * Provides consistent action naming across controllers.
 */
export const LoggingActions = {
  // List/Read operations
  LIST: (entity: string) => `list-${entity}`,
  VIEW: (entity: string) => `view-${entity}-detail`,
  SEARCH: (entity: string) => `search-${entity}`,

  // Create operations
  CREATE: (entity: string) => `create-${entity}`,

  // Update operations
  UPDATE: (entity: string) => `update-${entity}`,
  PATCH: (entity: string) => `patch-${entity}`,
  BULK: (entity: string) => `bulk-update-${entity}`,

  // Delete operations
  DELETE: (entity: string) => `delete-${entity}`,

  // Dropdown/selection operations
  DROPDOWN: (entity: string) => `get-${entity}-dropdown`,

  // Authentication/session operations
  LOGIN: 'login',
  LOGOUT: 'logout',
  REFRESH_TOKEN: 'refresh-token',

  // Custom actions
  CUSTOM: (action: string) => action,
} as const;

/**
 * Pre-configured logging helpers for common controller patterns.
 * These provide even more convenience for standard CRUD operations.
 */
export const ControllerLogging = {
  /**
   * Creates a set of logging functions for a specific entity
   * @param entityName - The name of the entity (e.g., 'menu', 'user', 'role')
   * @param serviceIdentifier - Optional service identifier
   */
  forEntity: (entityName: string, serviceIdentifier?: string) => ({
    list: withLogging(LoggingActions.LIST(entityName), serviceIdentifier),
    view: withLogging(LoggingActions.VIEW(entityName), serviceIdentifier),
    create: withLogging(LoggingActions.CREATE(entityName), serviceIdentifier),
    update: withLogging(LoggingActions.UPDATE(entityName), serviceIdentifier),
    bulk: withLogging(LoggingActions.BULK(entityName), serviceIdentifier),
    delete: withLogging(LoggingActions.DELETE(entityName), serviceIdentifier),
    dropdown: withLogging(
      LoggingActions.DROPDOWN(entityName),
      serviceIdentifier
    ),
    search: withLogging(LoggingActions.SEARCH(entityName), serviceIdentifier),
    // Custom action helper - returns a function that takes the custom action name
    custom: (customAction: string) =>
      withLogging(customAction, serviceIdentifier),
  }),
};
