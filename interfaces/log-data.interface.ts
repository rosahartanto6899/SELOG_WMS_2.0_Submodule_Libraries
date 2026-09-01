export interface ILogData {
  userId: string;
  userAgent: string | undefined;
  action: string;
  endPoint: string;
  method: string;
  payload: any;
  referer: string;
  httpCode: number;
  product: string;
  createdAt: Date;
  createdBy: string;
  collection: string;
}
