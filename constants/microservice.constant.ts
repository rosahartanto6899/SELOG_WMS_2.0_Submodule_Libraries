/**
 * Microservice identifier constants for logging and tracking across the SELOG platform.
 *
 * These constants are used in the logUserActivity middleware to identify which
 * microservice generated specific log entries. This is crucial for distributed
 * systems monitoring and debugging.
 *
 * @remarks
 * - Use these constants instead of hardcoding service names
 * - Follow the naming convention: selog.wms.[service-name].api
 * - Update this file when new microservices are added
 */
/** @type {*} */
export const MICROSERVICE_IDENTIFIERS = {
  SERVICE_USER: 'selog.wms.user.api',
  SERVICE_MASTER_DATA: 'selog.wms.masterdata.api',
  SERVICE_VEHICLE: 'selog.wms.vehicle.api',
  SERVICE_DRIVER: 'selog.wms.driver.api',
  SERVICE_ORDER: 'selog.wms.order.api',
  SERVICE_JOURNEY: 'selog.wms.journey.api',
  SERVICE_BILLING: 'selog.wms.billing.api',

  /** Default fallback for unknown services */
  UNKNOWN: 'selog.wms.unknown.api',
} as const;

/**
 * Type for microservice identifier values
 */
export type MicroserviceIdentifier =
  (typeof MICROSERVICE_IDENTIFIERS)[keyof typeof MICROSERVICE_IDENTIFIERS];

/**
 * Helper function to get the current microservice identifier.
 *
 * @returns The identifier for the current microservice (ServiceUser)
 */
export const getCurrentMicroserviceId = (): MicroserviceIdentifier => {
  return MICROSERVICE_IDENTIFIERS.SERVICE_USER;
};

/**
 * Helper function to validate if a microservice identifier is valid.
 *
 * @param identifier - The identifier to validate
 * @returns True if the identifier is valid
 */
export const isValidMicroserviceId = (
  identifier: string,
): identifier is MicroserviceIdentifier => {
  return Object.values(MICROSERVICE_IDENTIFIERS).includes(
    identifier as MicroserviceIdentifier,
  );
};
