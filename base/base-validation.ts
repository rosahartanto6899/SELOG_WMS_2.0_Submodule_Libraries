import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UnprocessableEntityException } from '@/shared-libs/exceptions/unprocessable-entity.exception';
import { Request, Response, NextFunction } from 'express';

export function BodyValidation(
  type: any,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(type, req.body);

    validate(dtoInstance, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      forbidUnknownValues: true,
      validationError: { target: false },
    })
      .then((errors) => {
        if (errors.length > 0) {
          const formatErrors = (errs: any[], parentPath = ''): any[] => {
            const result: any[] = [];
            for (const err of errs) {
              const propertyPath = parentPath
                ? `${parentPath}.${err.property}`
                : err.property;

              if (err.constraints) {
                result.push({
                  field: propertyPath,
                  message: Object.values(err.constraints),
                });
              }

              if (err.children?.length) {
                result.push(...formatErrors(err.children, propertyPath));
              }
            }
            return result;
          };

          const errorFields = formatErrors(errors);
          return next(new UnprocessableEntityException(errorFields, 422));
        }

        req.body = dtoInstance;
        next();
      })
      .catch(next);
  };
}

export function ParamValidation(
  type: any,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction) => {
    const dtoInstance = plainToInstance(type, req.params);

    validate(dtoInstance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      forbidUnknownValues: true,
      validationError: { target: false },
    })
      .then((errors) => {
        if (errors.length > 0) {
          const errorFields = errors.map((element: any) => ({
            field: element.property,
            message: `Param ${Object.values(
              element.constraints as Record<string, string>,
            ).join('. ')}`,
          }));

          return next(new UnprocessableEntityException(errorFields, 422));
        }

        req.params = dtoInstance as any;
        next();
      })
      .catch(next);
  };
}

export function QueryValidation(
  type: any,
): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Convert objects with numeric keys to arrays BEFORE transformation
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = (req.query[key] as string).trim();
      } else if (Array.isArray(req.query[key])) {
        req.query[key] = (req.query[key] as string[]).map((item) =>
          typeof item === 'string' ? item.trim() : item,
        );
      } else if (
        typeof req.query[key] === 'object' &&
        req.query[key] !== null
      ) {
        // Convert object with numeric keys to array
        const obj = req.query[key] as Record<string, any>;
        const keys = Object.keys(obj);
        const isNumericKeys = keys.every((k) => !Number.isNaN(Number(k)));

        if (isNumericKeys && keys.length > 0) {
          // Convert to array and sort by numeric key
          const arr = keys
            .map((k) => ({ index: Number(k), value: obj[k] }))
            .sort((a, b) => a.index - b.index)
            .map((item) =>
              typeof item.value === 'string' ? item.value.trim() : item.value,
            );
          req.query[key] = arr as any;
        }
      }
    }

    const dtoInstance = plainToInstance(type, req.query);

    validate(dtoInstance as object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: false,
      forbidUnknownValues: true,
      validationError: { target: false },
    })
      .then((errors) => {
        if (errors.length > 0) {
          const errorFields = errors.map((element: any) => ({
            field: element.property,
            message: `Query ${Object.values(
              element.constraints as Record<string, string>,
            ).join('. ')}`,
          }));
          return next(new UnprocessableEntityException(errorFields, 422));
        }
        req.query = dtoInstance as any;
        next();
      })
      .catch(next);
  };
}
