import { inject, injectable } from 'inversify';
import { ServiceBusListenerRegistry } from './service-bus-registry.util';
import logger from '@/shared-libs/utils/logger.util';

/**
 * Service Bus Listener Service
 * Manages the lifecycle of all Service Bus listeners
 */
@injectable()
export class ServiceBusListenerService {
  constructor(
    @inject(ServiceBusListenerRegistry)
    private readonly listenerRegistry: ServiceBusListenerRegistry,
  ) {}

  /**
   * Initialize all Service Bus listeners
   */
  async initializeAllListeners(): Promise<void> {
    try {
      // Initialize topics and subscriptions
      await this.listenerRegistry.initializeListeners();
    } catch (error) {
      logger.error(
        `Failed to initialize Service Bus listener service: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Start all Service Bus listeners
   */
  async startAllListeners(): Promise<void> {
    try {
      await this.listenerRegistry.startListeners();
    } catch (error) {
      logger.error(
        `Failed to start Service Bus listeners: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
      throw error;
    }
  }

  /**
   * Start DLQ processing for all registered listeners
   */
  async startDLQProcessing(): Promise<void> {
    try {
      await this.listenerRegistry.startDLQProcessing();
    } catch (error) {
      logger.error(
        `Failed to start DLQ processing: ${
          error instanceof Error ? error.message : JSON.stringify(error)
        }`,
      );
      throw error;
    }
  }
}
