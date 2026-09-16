import { createHash, randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { HTTP_MESSAGE } from '@/shared-libs/constants/http-status.constant';
import logger from '@/shared-libs/utils/logger.util';

export function ResponseJson(req: Request, res: Response, next: NextFunction) {
  const originalResponse = res.send.bind(res);

  if (req.originalUrl == '/api-docs/0192989a-6a52-7bb7-b259-5c1a102c1a70') {
    return next();
  }

  res.send = (body: any) => {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      const httpCode = body?.httpCode ? body.httpCode : 200;
      res.set('Content-Type', 'application/json');
      res.status(httpCode);

      const payload = body?.data ?? null;
      const result: Record<string, unknown> = {
        transactionId: randomUUID(),
        code: '',
        message: HTTP_MESSAGE[httpCode] ?? 'OK',
        eTag: createHash('md5').update(JSON.stringify(payload)).digest('base64'),
        data: payload,
      };

      const page = body?.page ? body.page : null;
      if (page !== null) {
        result['pagination'] = body.page;
      }

      const requestObject: any = {
        url: req?.originalUrl,
        params: req?.params,
        // headers: req?.headers,
        body: req?.body,
      };
      logger.info({
        requestData: requestObject,
      });

      return originalResponse(JSON.stringify(result));
    }

    return originalResponse(body);
  };

  next();
}
