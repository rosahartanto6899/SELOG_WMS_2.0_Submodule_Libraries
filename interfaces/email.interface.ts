export interface IEmailData {
  to: string[];
  subject?: string;
  cc?: string[];
  bcc?: string[];
  attachmentPath?: string;
}

export interface IEmail {
  send(data: IEmailData, template: string): Promise<void>;
}
