export interface IPubSub {
  publish(topicName: string, body: any): Promise<void | string>;
  subscribe(
    topicName: string,
    subscriptionName: string,
    processMessageCallback: any
  ): Promise<void>;
  dlq(topicName: string, subscriptionName: string): Promise<void>;
}
