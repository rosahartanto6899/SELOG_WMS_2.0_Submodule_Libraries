import { ServiceBusReceivedMessage } from "@azure/service-bus";

/**
 * Options accepted when starting a Service Bus listener.
 *
 * All members are optional so existing `startListening()` calls remain valid.
 */
export interface IListenerStartOptions {
  /**
   * Maximum number of messages the receiver processes concurrently.
   *
   * Resolution order is: this option -> the listener's own `maxConcurrentCalls`
   * -> `DEFAULT_MAX_CONCURRENT_CALLS` (1). Must be a positive integer;
   * invalid values are ignored and logged.
   */
  maxConcurrentCalls?: number;
}

/**
 * Interface for Service Bus message listeners
 * Each listener must implement this interface to handle specific message types
 */
export interface IServiceBusListener {
  /**
   * The topic name this listener subscribes to
   */
  readonly topicName: string;

  /**
   * The subscription name for this listener
   */
  readonly subscriptionName: string;

  /**
   * Optional per-listener concurrency override.
   * Leave undefined to keep the default of 1 message at a time.
   */
  readonly maxConcurrentCalls?: number;

  /**
   * Process the received message
   * @param message - The Service Bus message received
   */
  processMessage(message: ServiceBusReceivedMessage): Promise<void>;

  /**
   * Initialize the listener (setup topics, subscriptions, etc.)
   */
  initialize?(): Promise<void>;

  /**
   * Start listening for messages
   * @param options - Optional runtime overrides (e.g. `maxConcurrentCalls`).
   *                  Implementations that ignore the argument stay compatible.
   */
  startListening(options?: IListenerStartOptions): Promise<void>;

  /**
   * Stop listening for messages
   */
  stopListening?(): Promise<void>;

  /**
   * Start DLQ processing for this listener's topic and subscription
   */
  startDLQProcessing?(): Promise<void>;
}

/**
 * Configuration for Service Bus listener registration
 */
export interface IListenerConfig {
  topicName: string;
  subscriptionName: string;
  enabled: boolean;
  autoStart?: boolean;
  sendEmail?: boolean; // Custom flag to indicate if email notification should be sent after retries
  /**
   * Maximum number of messages this listener processes concurrently.
   * Optional - when omitted the listener keeps the previous behaviour of
   * processing one message at a time.
   */
  maxConcurrentCalls?: number;
}

/**
 * Service Bus listener registration metadata
 */
export interface IListenerRegistration {
  listenerClass: new (...args: any[]) => IServiceBusListener;
  config: IListenerConfig;
}
