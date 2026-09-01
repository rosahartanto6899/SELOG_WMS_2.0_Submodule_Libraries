export class CustomErrorException extends Error {
  public httpCode: number;
  public data: any;

  constructor(message: string, httpCode: number, data: any = null) {
    super(message);
    this.httpCode = httpCode;
    this.data = data;
    Object.setPrototypeOf(this, CustomErrorException.prototype);
  }
}
