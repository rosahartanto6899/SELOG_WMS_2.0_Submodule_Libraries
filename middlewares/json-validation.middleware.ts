import { Request, Response, NextFunction } from 'express';
import { BadRequestException } from '@/shared-libs/exceptions';

export function JsonValidationMiddleware(
  err: any,
  _req: Request,
  _res: Response,
  next: NextFunction
) {
  // Handle JSON parsing errors
  if (
    err instanceof SyntaxError &&
    err.message.includes('Unexpected token') &&
    'body' in err
  ) {
    const errorMessage = `Invalid JSON in request body: ${err.message}`;
    throw new BadRequestException(errorMessage);
  }

  // Handle other JSON-related errors
  if (err.type === 'entity.parse.failed' || err.status === 400) {
    const errorMessage = `Malformed JSON in request: ${err.message}`;
    throw new BadRequestException(errorMessage);
  }

  next(err);
}
