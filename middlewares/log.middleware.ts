import { Request, Response, NextFunction } from 'express';
import {
  HTTP_MESSAGE,
  HTTP_STATUS,
} from '@/shared-libs/constants/http-status.constant';
import { default as SecretManager } from '@/shared-libs/utils/secret-manager.util';
import logger from '@/shared-libs/utils/logger.util';
import { ILogData } from '@/shared-libs/interfaces/log-data.interface';
import eventHub from '@/shared-libs/utils/event-hub.util';
import type { AuthenticatedUser } from '@/shared-libs/types/express';

/**
 * Middleware to log user activity for each successful HTTP request across microservices.
 *
 * This middleware captures relevant request and response data, sanitizes the request body,
 * and constructs a log entry. In production environments with Event Hub configuration,
 * it sends the log data to Azure Event Hub; otherwise, it logs locally.
 * Internal service calls (identified by the 'axios' user-agent) are skipped.
 *
 * @param action - A string describing the user action to be logged (e.g., 'create-menu', 'list-users').
 * @param servicePrefix - The microservice identifier prefix (e.g., 'selog.wms.serviceuser.api', 'selog.wms.masterdata.api').
 * @returns Express middleware function for logging user activity.
 *
 * @remarks
 * - This middleware is shared across multiple microservices via submodule.
 * - The servicePrefix parameter helps identify which microservice generated the log.
 * - Sensitive data is automatically removed from the request body before logging.
 * - Logging errors do not affect the response to the client.
 * - The log entry includes microservice identification, user context, and request details.
 */

/**
 * Extracts user information from authenticated request
 */
function extractUserData(req: Request) {
  const user = req.user as AuthenticatedUser | undefined;
  return {
    userId: user?.tokenUserId || (req.headers.userId as string) || '',
    userEmail: user?.tokenEmail || '',
    userRole: user?.tokenRole || '',
  };
}

/**
 * Removes sensitive data from request body
 */
function sanitizeRequestBody(body: any) {
  const sanitizedBody = { ...body };
  const sensitiveFields = ['password', 'new_password', 'confirm_new_password'];

  sensitiveFields.forEach((field) => {
    if (sanitizedBody[field]) {
      delete sanitizedBody[field];
    }
  });

  return sanitizedBody;
}

/**
 * Determines logging configuration and environment settings
 */
function getLoggingConfig(userAgent?: string) {
  return {
    isInternalCall: userAgent?.includes('axios') ?? false,
    isProduction: SecretManager.env.NODE_ENV === 'Production',
    hasEventHubConfig: !!(
      SecretManager.env.EVENT_HUB_CONNECTION_STRING &&
      SecretManager.env.EVENT_HUB_NAME
    ),
  };
}

/**
 * Creates log data object from request and user information
 */
function createLogData(
  req: Request,
  res: Response,
  action: string,
  servicePrefix: string,
  userData: { userId: string; userEmail: string; userRole: string },
): ILogData {
  const sanitizedBody = sanitizeRequestBody(req.body);

  return {
    userId: userData.userId,
    userAgent: req.headers['user-agent'],
    action: (req.headers.action as string) ?? `${servicePrefix}.${action}`,
    endPoint: SecretManager.env.BASE_URL + req.originalUrl,
    method: req.method,
    payload: sanitizedBody,
    referer: (req.headers.origin as string) ?? req.headers.referer ?? '',
    httpCode: res.statusCode,
    product: 'SELOG.WMS',
    createdAt: new Date(),
    createdBy: userData.userId,
    collection: 'log_wms',
  };
}

/**
 * Handles logging to Event Hub with fallback to local logging
 */
async function logToEventHub(
  logData: ILogData,
  servicePrefix: string,
  action: string,
  userId: string,
  userEmail: string,
) {
  try {
    await eventHub.sendMessage(logData);
    logger.info(
      `[${servicePrefix}] User activity logged to Event Hub - Action: ${action}, User: ${userId} (${userEmail})`,
    );
  } catch (eventHubError) {
    logger.error(`Failed to send log to Event Hub: ${eventHubError}`);
    logLocally(servicePrefix, action, userId, userEmail, 'Event Hub fallback');
  }
}

/**
 * Handles local logging
 */
function logLocally(
  servicePrefix: string,
  action: string,
  userId: string,
  userEmail: string,
  reason: string = 'development mode',
) {
  logger.info(
    `[${servicePrefix}] User Activity Log (${reason}) - Action: ${action}, User: ${userId} (${userEmail})`,
  );
}

export function logUserActivity(
  action: string,
  servicePrefix: string = 'selog.wms.unknown.api',
) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      res.on('finish', async () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          await handleSuccessfulRequest(req, res, action, servicePrefix);
        }
      });

      next();
    } catch (error) {
      handleMiddlewareError(res, error);
    }
  };
}

/**
 * Handles logging for successful requests
 */
async function handleSuccessfulRequest(
  req: Request,
  res: Response,
  action: string,
  servicePrefix: string,
) {
  const userData = extractUserData(req);
  const loggingConfig = getLoggingConfig(req.headers['user-agent'] as string);

  if (loggingConfig.isInternalCall) {
    return; // Skip logging for internal service calls
  }

  const logData = createLogData(req, res, action, servicePrefix, userData);

  if (loggingConfig.isProduction && loggingConfig.hasEventHubConfig) {
    await logToEventHub(
      logData,
      servicePrefix,
      action,
      userData.userId,
      userData.userEmail,
    );
  } else {
    const reason = !loggingConfig.isProduction
      ? 'development mode'
      : 'missing Event Hub configuration';
    logLocally(
      servicePrefix,
      action,
      userData.userId,
      userData.userEmail,
      reason,
    );
  }
}

/**
 * Handles middleware errors
 */
function handleMiddlewareError(res: Response, error: any) {
  logger.error(`Error in logUserActivity middleware: ${error}`);

  const errorResult = {
    transactionId: '0f06b466-99dd-4f59-a5df-1ad9f2a84d0a',
    code: '',
    message: HTTP_MESSAGE[HTTP_STATUS.INTERNAL_SERVER_ERROR],
    eTag: 'pfmKgK6RpIkgkAAYukTfo21KRTyCwpiA',
    errors: [],
  };

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(errorResult);
}
