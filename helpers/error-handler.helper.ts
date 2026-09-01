import logger from '@/shared-libs/utils/logger.util';
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from '@/shared-libs/exceptions';

/**
 * Handle API error and throw appropriate exception based on status code
 * @param error - The error object from axios or other HTTP client
 * @param context - The context or method name where error occurred
 */
export function handleApiError(error: any, context: string): never {
  const errorMessage =
    error?.response?.data?.message ?? error?.message ?? error;
  const statusCode = error?.response?.status;

  logger.error(`Error ${context}: ${errorMessage} (Status: ${statusCode})`);

  if (statusCode && statusCode < 500) {
    switch (statusCode) {
      case 400:
        throw new BadRequestException(`Error ${context}: ${errorMessage}`);
      case 401:
        throw new UnauthorizedException(`Error ${context}: ${errorMessage}`);
      case 403:
        throw new ForbiddenException(`Error ${context}: ${errorMessage}`);
      case 404:
        throw new NotFoundException(`Error ${context}: ${errorMessage}`);
      case 422:
        throw new UnprocessableEntityException([
          { message: `Error ${context}: ${errorMessage}` },
        ]);
      default:
        throw new InternalServerErrorException(
          `Error ${context}: ${errorMessage}`,
        );
    }
  }

  throw new InternalServerErrorException(`Error ${context}: ${errorMessage}`);
}
