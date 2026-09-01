import * as Sentry from '@sentry/node';
import { Request, Response, NextFunction } from 'express';
import { HTTP_MESSAGE } from '@/shared-libs/constants/http-status.constant';
import { default as SecretManager } from '@/shared-libs/utils/secret-manager.util';
import {
  UnauthorizedException,
  ServiceUnavailableException,
  InternalServerErrorException,
  ForbiddenException,
  BadRequestException,
  UnprocessableEntityException,
  CustomErrorException,
  NotFoundException,
} from './';
import logger from '@/shared-libs/utils/logger.util';

export function HandlerException(
  err: Error,
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  let httpCode = 0;
  let message = '';
  let errors: any;
  let data: any = null;

  switch (true) {
    case err instanceof UnprocessableEntityException: {
      httpCode = 422;
      message = HTTP_MESSAGE[httpCode];
      errors = err.errors;
      break;
    }

    case err instanceof CustomErrorException ||
      err instanceof BadRequestException ||
      err instanceof ForbiddenException ||
      err instanceof NotFoundException ||
      err instanceof InternalServerErrorException ||
      err instanceof UnauthorizedException ||
      err instanceof ServiceUnavailableException: {
      httpCode = err.httpCode;
      message = err.message;
      errors = [];
      data = err?.data ?? null;

      if (err instanceof BadRequestException) {
        errors = err.errors ?? [];
      }

      break;
    }

    default: {
      // Handle JSON parsing errors specifically
      if (
        err instanceof SyntaxError &&
        (err.message.includes('Unexpected token') ||
          err.message.includes(
            "Expected ',' or '}' after property value in JSON",
          ) ||
          err.message.includes('Expected double-quoted property name')) &&
        'body' in err
      ) {
        httpCode = 400;
        message = `Invalid JSON format in request body: ${err.message}`;
      } else if (err?.message?.includes('not valid JSON')) {
        httpCode = 400;
        message = 'Malformed JSON in request';
      } else {
        httpCode = 500;
        message = err.message;
      }
      break;
    }
  }

  if (httpCode >= 500) {
    Sentry.init({
      dsn: SecretManager.env.SENTRY_DSN,
      environment: SecretManager.env.NODE_ENV || 'Development',
      tracesSampleRate: 1.0,
    });

    Sentry.captureException(err);
  }

  const errorObject = {
    name: err.name,
    message: err.message,
    stack: err.stack || 'No stack trace available',
  };

  logger.error({
    httpCode,
    error: errorObject,
  });

  res.status(httpCode).json({
    transactionId: '0f06b466-99dd-4f59-a5df-1ad9f2a84d0a',
    code: '',
    data: data,
    message: message,
    errors: errors,
  });

  next();
}
