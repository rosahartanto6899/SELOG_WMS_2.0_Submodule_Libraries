export class UnauthorizedException extends Error {
  public httpCode: number;
  public data: any;

  constructor(message: string, data: any = null) {
    super(message);
    this.httpCode = 401;
    this.data = data;
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}
