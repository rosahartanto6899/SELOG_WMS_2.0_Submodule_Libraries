import { injectable } from 'inversify';
import { ServiceBusReceivedMessage } from '@azure/service-bus';
import { ServiceBusUtil } from './service-bus.util';
import {
  IListenerStartOptions,
  IServiceBusListener,
} from '@/shared-libs/interfaces';
import logger from '@/shared-libs/utils/logger.util';

/**
 * Number of messages processed concurrently when no override is supplied.
 * Kept at 1 so listeners that do not configure concurrency behave exactly
 * as they did before this option existed.
 */
export const DEFAULT_MAX_CONCURRENT_CALLS = 1;

/**
 * Abstract base class for Service Bus listeners
 * Provides common functionality and enforces consistent patterns
 */
@injectable()
export abstract class BaseServiceBusListener implements IServiceBusListener {
  protected serviceBus: ServiceBusUtil;

  constructor() {
    this.serviceBus = new ServiceBusUtil();
  }

  /**
   * The topic name this listener subscribes to
   * Must be implemented by concrete classes
   */
  abstract readonly topicName: string;

  /**
   * The subscription name for this listener
   * Must be implemented by concrete classes
   */
  abstract readonly subscriptionName: string;

  /**
   * Optional Azure Service Bus SQL filter expression applied to this subscription.
   * When set, only messages matching this expression will be delivered to the subscription.
   *
   * Example:
   *   "subscription_name IS NULL OR subscription_name = 'service-notification'"
   *
   * This is used to prevent DLQ/retry requeues for one subscription from being
   * delivered to other subscriptions on the same topic.
   */
  readonly subscriptionFilter?: string;

  /**
   * Optional per-listener concurrency override.
   *
   * Override this in a concrete listener to let it process more than one
   * message at a time:
   *
   *   readonly maxConcurrentCalls = 10;
   *
   * A value passed to `startListening()` (e.g. from `IListenerConfig`) takes
   * precedence over this field. When neither is set the listener falls back to
   * `DEFAULT_MAX_CONCURRENT_CALLS` (1).
   *
   * Note: raising this means messages are no longer processed strictly in
   * order, so only increase it for handlers that are safe to run in parallel.
   */
  readonly maxConcurrentCalls?: number;

  /**
   * Process the received message
   * Must be implemented by concrete classes
   * @param message - The Service Bus message received
   */
  abstract processMessage(message: ServiceBusReceivedMessage): Promise<void>;

  /**
   * Initialize topics and subscriptions if needed
   */
  async initialize(): Promise<void> {
    try {
      const subscriptionEntry = this.subscriptionFilter
        ? { name: this.subscriptionName, sqlFilter: this.subscriptionFilter }
        : this.subscriptionName;

      await this.serviceBus.initializeTopicsAndSubscriptions([
        {
          topicName: this.topicName,
          subscriptions: [subscriptionEntry],
        },
      ]);
    } catch (error) {
      logger.error({
        message: `Failed to initialize Service Bus listener: ${this.subscriptionName}`,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    }
  }

  /**
   * Resolve the effective concurrency for this listener.
   *
   * Precedence: explicit override (from `startListening` options) -> the
   * listener's own `maxConcurrentCalls` -> `DEFAULT_MAX_CONCURRENT_CALLS`.
   *
   * Values are coerced and validated because they often originate from
   * environment variables, which arrive as strings. Anything that is not a
   * positive integer is ignored and logged rather than passed to the SDK.
   *
   * @param override - Value supplied by the caller, if any
   * @returns A positive integer safe to pass to the Service Bus receiver
   */
  protected resolveMaxConcurrentCalls(override?: number): number {
    for (const candidate of [override, this.maxConcurrentCalls]) {
      if (candidate === undefined || candidate === null) continue;

      const value = Number(candidate);
      if (Number.isInteger(value) && value > 0) return value;

      logger.warn(
        `Ignoring invalid maxConcurrentCalls "${candidate}" for listener: ${this.subscriptionName}. Expected a positive integer.`,
      );
    }

    return DEFAULT_MAX_CONCURRENT_CALLS;
  }

  /**
   * Start listening for messages
   * @param options - Optional overrides. `maxConcurrentCalls` controls how many
   *                  messages are processed in parallel; when omitted the
   *                  listener's own value, then the default of 1, is used.
   */
  async startListening(options?: IListenerStartOptions): Promise<void> {
    const maxConcurrentCalls = this.resolveMaxConcurrentCalls(
      options?.maxConcurrentCalls,
    );

    try {
      logger.info(
        `Starting Service Bus listener: ${this.subscriptionName} on topic: ${this.topicName} (maxConcurrentCalls: ${maxConcurrentCalls})`,
      );

      await this.serviceBus.subscribe(
        this.topicName,
        this.subscriptionName,
        async (message: ServiceBusReceivedMessage) => {
          await this.processMessage(message);
        },
        {
          maxConcurrentCalls,
        },
      );
    } catch (error) {
      logger.error({
        message: `Failed to start Service Bus listener: ${this.subscriptionName}`,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    }
  }

  /**
   * Stop listening for messages
   * Override if specific cleanup is needed
   */
  async stopListening(): Promise<void> {
    logger.info(`Stopping Service Bus listener: ${this.subscriptionName}`);
    // Default implementation - override if specific cleanup is needed
  }

  /**
   * Start DLQ processing for this listener's topic and subscription
   * Processes messages from the dead letter queue in the background
   */
  async startDLQProcessing(): Promise<void> {
    try {
      logger.info(
        `Starting DLQ processing for listener: ${this.subscriptionName} on topic: ${this.topicName}`,
      );

      // Start DLQ processing in the background (fire and forget)
      // The dlq method contains an infinite loop, so we don't await it
      this.serviceBus
        .dlq(this.topicName, this.subscriptionName)
        .catch((error) => {
          logger.error({
            message: `DLQ processing error for ${this.subscriptionName}`,
            error:
              error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error,
          });
        });
    } catch (error) {
      logger.error({
        message: `Failed to start DLQ processing for listener: ${this.subscriptionName}`,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    }
  }

  /**
   * Log message processing info with consistent format
   */
  protected logMessageProcessing(
    message: ServiceBusReceivedMessage,
    operation: string,
  ): void {
    const logData = {
      listener: this.subscriptionName,
      topic: this.topicName,
      operation,
      messageId: message.messageId,
      body: message.body,
    };
    logger.info({
      message: `Service Bus ${operation} processed: ${message.messageId}`,
      data: logData,
    });
  }

  /**
   * Log message processing error with consistent format
   */
  protected logMessageError(
    message: ServiceBusReceivedMessage,
    error: any,
    operation: string,
  ): void {
    const logData = {
      listener: this.subscriptionName,
      topic: this.topicName,
      operation,
      messageId: message.messageId,
      error: error.message || error,
      body: message.body,
    };

    logger.error({
      message: `Service Bus ${operation} error: ${message.messageId}`,
      data: logData,
    });
  }
}
