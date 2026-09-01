import { EventHubProducerClient } from '@azure/event-hubs';
import SecretManager from '@/shared-libs/utils/secret-manager.util';
import logger from '@/shared-libs/utils/logger.util';

interface IEventHub {
  sendMessage(data: any): Promise<void>;
  setEventHubClient(
    connectionString: string,
    eventHubName: string,
    eventHubClient?: EventHubProducerClient
  ): Promise<void>;
}

export class EventHubManager implements IEventHub {
  private static instance: EventHubManager;
  private _eventHubClient: EventHubProducerClient;

  private constructor() {
    this.initializeClient();
  }

  public static getInstance(): EventHubManager {
    if (!EventHubManager.instance) {
      EventHubManager.instance = new EventHubManager();
    }
    return EventHubManager.instance;
  }

  private initializeClient(): void {
    try {
      const connectionString = SecretManager.env
        .EVENT_HUB_CONNECTION_STRING as string;
      const eventHubName = SecretManager.env.EVENT_HUB_NAME as string;

      if (!connectionString || !eventHubName) {
        throw new Error(
          'Event Hub connection string or name is not configured'
        );
      }

      this._eventHubClient = new EventHubProducerClient(
        connectionString,
        eventHubName,
        {
          retryOptions: {
            maxRetries: 2,
            retryDelayInMs: 100,
          },
        }
      );

      logger.info('Event Hub client initialized successfully');
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.stack || error.message
          : JSON.stringify(error);
      logger.error(`Failed to initialize Event Hub client: ${errMsg}`);
      throw error;
    }
  }

  public async setEventHubClient(
    connectionString: string,
    eventHubName: string,
    eventHubClient?: EventHubProducerClient
  ): Promise<void> {
    try {
      if (!connectionString || !eventHubName) {
        throw new Error('Connection string and event hub name are required');
      }

      this._eventHubClient =
        eventHubClient ||
        new EventHubProducerClient(connectionString, eventHubName, {
          retryOptions: {
            maxRetries: 2,
            retryDelayInMs: 100,
          },
        });

      logger.info('Event Hub client configuration updated successfully');
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.stack || error.message
          : JSON.stringify(error);
      logger.error(`Failed to initialize Event Hub client: ${errMsg}`);
      throw error;
    }
  }

  public async sendMessage(data: any): Promise<void> {
    try {
      if (!this._eventHubClient) {
        throw new Error('Event Hub client is not initialized');
      }

      const eventDataBatch = await this._eventHubClient.createBatch();
      const messageAdded = eventDataBatch.tryAdd({ body: data });

      if (!messageAdded) {
        throw new Error(
          'Failed to add message to batch - message may be too large'
        );
      }

      await this._eventHubClient.sendBatch(eventDataBatch);
      logger.info('Message sent to Event Hub successfully');
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.stack || error.message
          : JSON.stringify(error);
      logger.error(`Failed to initialize Event Hub client: ${errMsg}`);
      throw error;
    }
  }

  public async close(): Promise<void> {
    try {
      if (this._eventHubClient) {
        await this._eventHubClient.close();
        logger.info('Event Hub client closed successfully');
      }
    } catch (error) {
      const errMsg =
        error instanceof Error
          ? error.stack || error.message
          : JSON.stringify(error);
      logger.error(`Failed to initialize Event Hub client: ${errMsg}`);
      throw error;
    }
  }
}

class EventHub {
  private static instance: IEventHub;

  private constructor() {}

  public static getInstance(): IEventHub {
    const eventHubHandlers = {
      'event-hub': () => EventHubManager.getInstance(),
    };

    if (!EventHub.instance) {
      const service = SecretManager.env.EVENT_HUB_SERVICE || 'event-hub';
      const createEventHubInstance = eventHubHandlers[service];

      if (!createEventHubInstance) {
        throw new Error('Unknown Event Hub service');
      }

      EventHub.instance = createEventHubInstance();
    }

    return EventHub.instance;
  }
}

// lazy proxy — only construct EventHubManager when actually used,
// so services without EVENT_HUB config don't crash at import time
const eventHub: IEventHub = new Proxy({} as IEventHub, {
  get(_t, prop) {
    if (prop === 'sendMessage' || prop === 'setEventHubClient') {
      return EventHub.getInstance()[prop];
    }
    return undefined;
  },
});

export default eventHub;
