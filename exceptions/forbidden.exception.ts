export class ForbiddenException extends Error {
  public httpCode: number;
  public data: any;

  constructor(message: string, data: any = null) {
    super(message);
    this.httpCode = 403;
    this.data = data;
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}
