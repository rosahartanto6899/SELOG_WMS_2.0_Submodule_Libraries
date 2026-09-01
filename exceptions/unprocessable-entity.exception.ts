export class UnprocessableEntityException extends Error {
  public httpCode: number;
  public errors: any[];

  constructor(errors: any[], httpCode: number = 422) {
    super(JSON.stringify(errors));
    this.httpCode = httpCode;
    this.errors = errors;
    Object.setPrototypeOf(this, UnprocessableEntityException.prototype);
  }
}
