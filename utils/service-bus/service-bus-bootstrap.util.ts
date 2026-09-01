import logger from '@/shared-libs/utils/logger.util';
import { container } from '@/shared-libs/utils';
import { ServiceBusListenerRegistry } from './service-bus-registry.util';
import { ServiceBusListenerService } from './service-bus-service.util';

/**
 * Initializes and registers all Service Bus listeners in the application.
 *
 * This function binds the necessary listener services to the Inversify container,
 * retrieves the environment configuration, and registers each listener with
 * environment-specific overrides. It logs the initialization process and handles errors.
 *
 * @param listenerConfigs - Array of listener configurations to register
 * @param environmentConfig - Environment-specific configuration overrides
 * @returns {Promise<void>} A promise that resolves when all listeners are registered.
 * @throws Will log and rethrow any errors encountered during initialization.
 */
export async function initializeServiceBusListeners(
  listenerConfigs: any[],
): Promise<void> {
  try {
    // Bind services to Inversify container
    container.bind(ServiceBusListenerRegistry).toSelf().inSingletonScope();
    container.bind(ServiceBusListenerService).toSelf().inSingletonScope();

    // Get registry instance
    const registry = container.get(ServiceBusListenerRegistry);

    // Register all configured listeners
    for (const listenerConfig of listenerConfigs) {
      // Apply environment-specific overrides
      const finalConfig = {
        ...listenerConfig.config,
      };

      registry.registerListener({
        ...listenerConfig,
        config: finalConfig,
      });
    }
  } catch (error) {
    logger.error({
      message: 'Failed to initialize Service Bus listeners',
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
    throw error;
  }
}

/**
 * Start Service Bus Listeners
 * This function starts all registered and enabled listeners
 */
export async function startServiceBusListeners(): Promise<void> {
  try {
    const listenerService = container.get(ServiceBusListenerService);

    // Initialize all listeners (create topics/subscriptions)
    await listenerService.initializeAllListeners();

    // Start listening for messages
    await listenerService.startAllListeners();
  } catch (error) {
    logger.error({
      message: `Failed to start Service Bus listeners`,
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });

    throw error;
  }
}

/**
 * Start DLQ Processing for all listeners
 * This function starts dead letter queue processing for all registered listeners
 */
export async function startDLQProcessing(): Promise<void> {
  try {
    const listenerService = container.get(ServiceBusListenerService);

    // Start DLQ processing for all listeners
    await listenerService.startDLQProcessing();
  } catch (error) {
    logger.error({
      message: 'Failed to start DLQ processing',
      error:
        error instanceof Error
          ? { message: error.message, stack: error.stack }
          : error,
    });
    throw error;
  }
}
