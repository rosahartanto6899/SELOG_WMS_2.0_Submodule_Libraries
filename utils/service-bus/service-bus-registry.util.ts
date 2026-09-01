import { injectable } from 'inversify';
import {
  IServiceBusListener,
  IListenerRegistration,
} from '@/shared-libs/interfaces';
import logger from '@/shared-libs/utils/logger.util';
import { container } from '@/shared-libs/utils';

/**
 * Registry for managing Service Bus listeners.
 *
 * This class allows registration, initialization, starting, stopping, and querying of Service Bus listeners.
 * Listeners are registered with their configuration and can be managed collectively.
 *
 * @remarks
 * - Listeners are identified by a composite key of topic and subscription name.
 * - Initialization and starting of listeners are handled asynchronously.
 * - Listener status and active listeners can be queried.
 */
@injectable()
export class ServiceBusListenerRegistry {
  private readonly listeners: Map<string, IServiceBusListener> = new Map();
  private readonly registrations: Map<string, IListenerRegistration> =
    new Map();

  /**
   * Register a listener class with its configuration
   */
  registerListener(registration: IListenerRegistration): void {
    const key = `${registration.config.topicName}-${registration.config.subscriptionName}`;
    this.registrations.set(key, registration);

    logger.info(
      `Registered Service Bus listener: ${registration.config.subscriptionName} for topic: ${registration.config.topicName}`,
    );
  }

  /**
   * Initialize all registered listeners
   */
  async initializeListeners(): Promise<void> {
    for (const [key, registration] of this.registrations) {
      if (!registration.config.enabled) {
        logger.info(
          `Skipping disabled listener: ${registration.config.subscriptionName}`,
        );
        continue;
      }

      try {
        // Create listener instance using Inversify container for dependency injection
        const listener = container.get<IServiceBusListener>(
          registration.listenerClass,
        );

        // Initialize the listener
        if (listener.initialize) {
          await listener.initialize();
        }

        this.listeners.set(key, listener);
      } catch (error) {
        logger.error({
          message: `Failed to initialize listener: ${registration.config.subscriptionName
            }`,
          error:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : error,
        });
        throw error;
      }
    }
  }

  /**
   * Start all registered listeners
   */
  async startListeners(): Promise<void> {
    for (const [key, listener] of this.listeners) {
      const registration = this.registrations.get(key);

      if (
        !registration?.config.enabled ||
        registration.config.autoStart === false
      ) {
        logger.info(
          `Skipping auto-start for listener: ${listener.subscriptionName}`,
        );
        continue;
      }

      try {
        // Pass through the configured concurrency. Undefined leaves the
        // listener's own value (or the default of 1) in effect.
        await listener.startListening({
          maxConcurrentCalls: registration.config.maxConcurrentCalls,
        });
      } catch (error) {
        logger.error({
          message: `Failed to start listener: ${listener.subscriptionName}`,
          error:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : error,
        });
        throw error;
      }
    }
  }

  /**
   * Start DLQ processing for all registered listeners
   */
  async startDLQProcessing(): Promise<void> {
    for (const [key, listener] of this.listeners) {
      const registration = this.registrations.get(key);

      if (!registration?.config.enabled) {
        logger.info(
          `Skipping DLQ processing for disabled listener: ${listener.subscriptionName}`,
        );
        continue;
      }

      try {
        // Start DLQ processing in the background for each listener
        if (listener.startDLQProcessing) {
          await listener.startDLQProcessing();
        } else {
          logger.warn(
            `Listener ${listener.subscriptionName} does not support DLQ processing`,
          );
        }
      } catch (error) {
        logger.error({
          message: `Failed to start DLQ processing for listener: ${listener.subscriptionName}`,
          error:
            error instanceof Error
              ? { message: error.message, stack: error.stack }
              : error,
        });
        // Don't throw here - continue with other listeners
      }
    }
  }
}
