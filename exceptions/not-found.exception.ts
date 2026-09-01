export class NotFoundException extends Error {
  public httpCode: number;
  public data: any;

  constructor(message: string, data: any = null) {
    super(message);
    this.httpCode = 404;
    this.data = data;
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}
