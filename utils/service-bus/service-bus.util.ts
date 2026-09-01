import { IPubSub } from '@/shared-libs/interfaces/pubsub.interface';
import SecretManager from '@/shared-libs/utils/secret-manager.util';
import logger from '@/shared-libs/utils/logger.util';

import {
  ServiceBusClient,
  delay,
  ProcessErrorArgs,
  isServiceBusError,
  ServiceBusReceivedMessage,
  ServiceBusMessage,
  ServiceBusAdministrationClient,
  CreateTopicOptions,
  CreateSubscriptionOptions,
  SqlRuleFilter,
} from '@azure/service-bus';
import moment from 'moment';
import Long from 'long';

/**
 * Service Bus Utility Class
 * Provides Azure Service Bus functionality as a shared utility
 * Can be used across different services for pub/sub messaging
 */
export class ServiceBusUtil implements IPubSub {
  private static sbClient: ServiceBusClient;

  /**
   * Get or create Service Bus client instance (singleton pattern)
   */
  private static getClient(): ServiceBusClient {
    const connectionString = SecretManager.env.SB_CONNECTION_STRING;
    if (!ServiceBusUtil.sbClient) {
      ServiceBusUtil.sbClient = new ServiceBusClient(connectionString, {
        retryOptions: {
          maxRetries: 5,
          retryDelayInMs: 30000,
        },
      });
    }

    return ServiceBusUtil.sbClient;
  }

  /**
   * Publish a message to a Service Bus topic
   *
   * If `scheduleEnqueueTime` is provided, the message will be **scheduled**
   * for delayed delivery at the specified date and time.
   * Otherwise, the message is sent immediately.
   *
   * @param topicName - The name of the topic to publish to
   * @param body - The message body to publish
   * @param scheduleEnqueueTime - Optional. The UTC date and time when the message should be enqueued.
   *
   */
  async publish(
    topicName: string,
    body: any,
    scheduleEnqueueTime?: Date,
    subject?: string,
    applicationProperties?: Record<string, string | number | boolean | Date>,
  ): Promise<void | string> {
    const sbClient = ServiceBusUtil.getClient();
    const sender = sbClient.createSender(topicName);

    try {
      const adjustBody = {
        ...body,
      };

      const message: ServiceBusMessage = {
        body: adjustBody,
        contentType: 'application/json',
        subject: subject ?? undefined,
        applicationProperties: applicationProperties ?? undefined,
      };

      if (scheduleEnqueueTime) {
        const scheduledEnqueueTimeUtc = new Date(scheduleEnqueueTime);
        message.scheduledEnqueueTimeUtc = scheduledEnqueueTimeUtc;
        const sequenceNumbers = await sender.scheduleMessages(
          message,
          scheduleEnqueueTime,
        );

        return sequenceNumbers.toString();
      }

      await sender.sendMessages(message);
      logger.info(`Message published to topic: ${topicName}`);
    } catch (error) {
      logger.error({
        message: `Failed to publish message to topic ${topicName}`,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    } finally {
      await sender.close();
    }
  }

  /**
   * Cancel a scheduled message in Service Bus
   *
   * @param topicName - The name of the topic where the message was scheduled
   * @param sequenceNumber - The sequence number of the scheduled message to cancel
   */
  async cancelScheduledMessage(
    topicName: string,
    sequenceNumber: string,
  ): Promise<void> {
    const sbClient = ServiceBusUtil.getClient();
    const sender = sbClient.createSender(topicName);

    try {
      // Convert string sequence number to Long type for Azure Service Bus
      const sequenceNumberLong = Long.fromString(sequenceNumber);
      await sender.cancelScheduledMessages(sequenceNumberLong);
      logger.info(
        `Scheduled message ${sequenceNumber} cancelled from topic: ${topicName}`,
      );
    } catch (error) {
      logger.error({
        message: `Failed to cancel scheduled message ${sequenceNumber} from topic ${topicName}`,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    } finally {
      await sender.close();
    }
  }

  /**
   * Subscribe to a Service Bus topic and process incoming messages
   * @param topicName - The name of the topic to subscribe to
   * @param subscriptionName - The name of the subscription within the topic
   * @param processMessageCallback - A callback function to handle processing of each message received
   */
  async subscribe(
    topicName: string,
    subscriptionName: string,
    processMessageCallback: (
      message: ServiceBusReceivedMessage,
    ) => Promise<void>,
    options?: { autoComplete?: boolean; maxConcurrentCalls?: number },
  ): Promise<void> {
    const sbClient = ServiceBusUtil.getClient();
    const receiver = sbClient.createReceiver(topicName, subscriptionName, {
      receiveMode: 'peekLock',
    });

    try {
      receiver.subscribe(
        {
          processMessage: async (message: ServiceBusReceivedMessage) => {
            try {
              const loggerData = {
                topicName,
                subscriptionName,
                messageId: message.messageId,
                payload: message.body,
              };

              logger.info({
                message: `Service Bus message received: ${message.messageId}`,
                data: loggerData,
              });

              await processMessageCallback(message);

              // Complete message after successful processing
              await receiver.completeMessage(message);

              logger.info(
                `Message processed successfully: ${message.messageId}`,
              );
            } catch (error: any) {
              logger.error({
                message: `Message processing failed: ${message.messageId}`,
                error:
                  error instanceof Error
                    ? { message: error.message, stack: error.stack }
                    : error,
              });

              const errorDescription =
                typeof error === 'object' && error !== null
                  ? JSON.stringify(error, Object.getOwnPropertyNames(error))
                  : String(error);

              await receiver.deadLetterMessage(message, {
                deadLetterReason: error.message || 'ProcessingError',
                deadLetterErrorDescription: errorDescription,
              });
            }
          },
          processError: async (args: ProcessErrorArgs) => {
            logger.error({
              message: `Service Bus error from source ${args.errorSource}`,
              error:
                args.error instanceof Error
                  ? { message: args.error.message, stack: args.error.stack }
                  : args.error,
            });

            if (isServiceBusError(args.error)) {
              switch (args.error.code) {
                case 'MessagingEntityDisabled':
                case 'MessagingEntityNotFound':
                case 'UnauthorizedAccess':
                  logger.error(
                    `Unrecoverable Service Bus error: ${args.error.code}`,
                  );
                  break;
                case 'MessageLockLost':
                  logger.warn(
                    `Service Bus message lock lost: ${args.error.message}`,
                  );
                  break;
                case 'ServiceBusy':
                  logger.warn('Service Bus is busy, retrying after delay...');
                  await delay(1000);
                  break;
                default:
                  logger.error(
                    `Service Bus error: ${args.error.code} - ${args.error.message}`,
                  );
              }
            }
          },
        },
        options,
      );
    } catch (err) {
      logger.error({
        message: `Error occurred while subscribing to Service Bus`,
        error:
          err instanceof Error
            ? { message: err.message, stack: err.stack }
            : err,
      });
      throw err;
    }
  }

  /**
   * Process dead letter queue messages
   * Receive messages from a service bus topic subscription's dead letter queue
   * and either complete them if they have expired or send them back to the
   * original topic if they have not expired.
   *
   * @param topicName - The name of the topic to receive messages from
   * @param subscriptionName - The name of the subscription to receive messages from
   */
  async dlq(topicName: string, subscriptionName: string): Promise<void> {
    const sbClient = ServiceBusUtil.getClient();
    const receiver = sbClient.createReceiver(topicName, subscriptionName, {
      receiveMode: 'peekLock',
      subQueueType: 'deadLetter',
    });
    const sender = sbClient.createSender(topicName);

    try {
      receiver.subscribe({
        processMessage: async (message: ServiceBusReceivedMessage) => {
          try {
            const publishedAt = message.body?.publishedAt
              ? moment(message.body?.publishedAt)
              : null;

            const messageAge = publishedAt
              ? moment().diff(publishedAt, 'minutes')
              : 0;

            logger.info(
              `Processing DLQ message ${message.messageId} for ${topicName}/${subscriptionName}, age: ${messageAge} minutes`,
            );

            // If message is older than 20 minutes, complete it (discard)

            // Message is not expired, requeue it to the original topic
            logger.info(
              `Message ${message.messageId} not expired (${messageAge} minutes old), requeuing...`,
            );

            const currentRetryCount =
              message.applicationProperties?.dlq_retry_count;
            const retryCount =
              typeof currentRetryCount === 'number' ? currentRetryCount + 1 : 1;

            const requeueMessage: ServiceBusMessage = {
              body: message.body,
              contentType: message.contentType || 'application/json',
              applicationProperties: {
                ...message.applicationProperties,
                subscription_name: subscriptionName,
                dlq_retry_count: retryCount,
                dlq_retry_timestamp: new Date().toISOString(),
              },
              subject: message.subject,
            };

            await sender.sendMessages(requeueMessage);
            await receiver.completeMessage(message);

            logger.info(
              `DLQ message requeued: ${message.messageId} for ${topicName}/${subscriptionName}`,
            );
          } catch (error: any) {
            logger.error({
              message: `DLQ message processing failed: ${message.messageId}`,
              error:
                error instanceof Error
                  ? { message: error.message, stack: error.stack }
                  : error,
            });

            const errorDescription =
              typeof error === 'object' && error !== null
                ? JSON.stringify(error, Object.getOwnPropertyNames(error))
                : String(error);

            await receiver.deadLetterMessage(message, {
              deadLetterReason: error.message || 'DLQProcessingError',
              deadLetterErrorDescription: errorDescription,
            });
          }
        },
        processError: async (args: ProcessErrorArgs) => {
          logger.error({
            message: `DLQ processing error from source ${args.errorSource}`,
            error:
              args.error instanceof Error
                ? { message: args.error.message, stack: args.error.stack }
                : args.error,
          });

          if (isServiceBusError(args.error)) {
            switch (args.error.code) {
              case 'MessagingEntityDisabled':
              case 'MessagingEntityNotFound':
              case 'UnauthorizedAccess':
                logger.error({
                  message: `Unrecoverable DLQ processing error: ${args.error.code}`,
                  error:
                    args.error instanceof Error
                      ? { message: args.error.message, stack: args.error.stack }
                      : args.error,
                });
                break;
              case 'MessageLockLost':
                logger.warn(`DLQ message lock lost: ${args.error.message}`);
                break;
              case 'ServiceBusy':
                logger.warn(
                  'Service Bus is busy during DLQ processing, retrying after delay...',
                );
                await delay(1000);
                break;
              default:
                logger.error(
                  `DLQ processing error: ${args.error.code} - ${args.error.message}`,
                );
            }
          }
        },
      });
    } catch (error) {
      logger.error({
        message: `DLQ processing failed for ${topicName}/${subscriptionName}`,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    }
  }

  /**
   * Initialize topics and subscriptions based on an array of topics and subscriptions
   * @param topicSubscriptions Array of objects containing topic and subscription details.
   *   Each subscription can be a plain string (no filter) or an object with an optional
   *   `sqlFilter` to restrict which messages the subscription receives.
   */
  async initializeTopicsAndSubscriptions(
    topicSubscriptions: {
      topicName: string;
      subscriptions: (string | { name: string; sqlFilter?: string })[];
    }[],
  ): Promise<void> {
    const connectionString = SecretManager.env.SB_CONNECTION_STRING;
    const adminClient = new ServiceBusAdministrationClient(connectionString);

    try {
      for (const { topicName, subscriptions } of topicSubscriptions) {
        // Ensure the topic exists
        const topicExists = await adminClient
          .getTopic(topicName)
          .catch(() => null);

        if (!topicExists) {
          logger.info(`Creating Service Bus topic: ${topicName}`);
          const topicOptions: CreateTopicOptions = {
            maxSizeInMegabytes: 1024 * 5,
            defaultMessageTimeToLive: 'P14D',
            enablePartitioning: true,
          };
          await adminClient.createTopic(topicName, topicOptions);
        }

        // Ensure the subscriptions exist
        for (const subscriptionEntry of subscriptions) {
          const subscriptionName =
            typeof subscriptionEntry === 'string'
              ? subscriptionEntry
              : subscriptionEntry.name;
          const sqlFilter =
            typeof subscriptionEntry === 'string'
              ? undefined
              : subscriptionEntry.sqlFilter;

          const subscriptionExists = await adminClient
            .getSubscription(topicName, subscriptionName)
            .catch(() => null);

          if (!subscriptionExists) {
            logger.info(
              `Creating Service Bus subscription: ${subscriptionName} for topic: ${topicName}`,
            );

            const subscriptionOptions: CreateSubscriptionOptions = {
              maxDeliveryCount: 1,
              autoDeleteOnIdle: 'P10675199DT2H48M5.4775807S', // Never auto-delete (effectively infinite)
              defaultMessageTimeToLive: 'P14D', // 14 days
              lockDuration: 'PT1M', // 1 minute
            };

            await adminClient.createSubscription(
              topicName,
              subscriptionName,
              subscriptionOptions,
            );

            if (sqlFilter) {
              // Replace the default TrueFilter rule with a SQL filter so only
              // messages matching this subscription's criteria are delivered.
              await adminClient
                .deleteRule(topicName, subscriptionName, '$Default')
                .catch(() => {
                  // $Default rule may not exist on some tiers; ignore
                });

              const sqlRuleFilter: SqlRuleFilter = {
                sqlExpression: sqlFilter,
              };

              await adminClient.createRule(
                topicName,
                subscriptionName,
                'SubscriptionTargetFilter',
                sqlRuleFilter,
              );

              logger.info(
                `Created SQL filter rule for subscription: ${subscriptionName} on topic: ${topicName}`,
              );
            }
          }
        }
      }
    } catch (error) {
      logger.error({
        message: `Failed to initialize Service Bus topics and subscriptions`,
        error:
          error instanceof Error
            ? { message: error.message, stack: error.stack }
            : error,
      });
      throw error;
    }
  }
}
