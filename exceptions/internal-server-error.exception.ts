export class InternalServerErrorException extends Error {
  public httpCode: number;
  public data: any;

  constructor(message: string, data: any = null) {
    super(message);
    this.httpCode = 500;
    this.data = data;
    Object.setPrototypeOf(this, InternalServerErrorException.prototype);
  }
}
