export class BadRequestException extends Error {
  public httpCode: number;
  public errors: any[];
  public data: any;

  constructor(message: string, errors: any[] = [], data: any = null) {
    super(message);
    this.httpCode = 400;
    this.errors = errors;
    this.data = data;
    Object.setPrototypeOf(this, BadRequestException.prototype);
  }
}
