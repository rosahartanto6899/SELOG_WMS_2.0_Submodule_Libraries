import { randomUUID } from 'node:crypto';
import { Request, Response, NextFunction } from 'express';
import { HTTP_MESSAGE } from '@/shared-libs/constants';
import { RedisCache } from '@/integrations/thrid-party/redis.third';
import logger from '@/shared-libs/utils/logger.util';

const WINDOW_MS = 1000;

// Sliding window via sorted set: buang hit lama, hitung, tambah kalau masih di bawah limit.
// Dieksekusi sebagai Lua script agar atomik di semua replica.
const HIT_SCRIPT = `
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, ARGV[1] - ARGV[2])
if redis.call('ZCARD', KEYS[1]) >= tonumber(ARGV[3]) then
  return 0
end
redis.call('ZADD', KEYS[1], ARGV[1], ARGV[4])
redis.call('PEXPIRE', KEYS[1], ARGV[2] + 1000)
return 1
`;

let seq = 0;

// Budget ketat: rate limit tidak boleh menambah latensi; Redis lambat/down = fail-open
const CHECK_TIMEOUT_MS = 100;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('rate limit check timeout')), ms)
    ),
  ]);
}

function reject(res: Response) {
  return res.status(429).json({
    transactionId: randomUUID(),
    code: '',
    data: null,
    message: HTTP_MESSAGE[429],
    errors: [],
  });
}

async function allowHit(key: string, max: number): Promise<boolean> {
  const now = Date.now();
  const result = await RedisCache.getInstance().eval(
    HIT_SCRIPT,
    1,
    key,
    now,
    WINDOW_MS,
    max,
    `${now}:${++seq}` // member unik walau timestamp sama
  );
  return Number(result) === 1;
}

async function limit(
  req: Request,
  res: Response,
  next: NextFunction,
  scope: string,
  identity: string,
  max: number
): Promise<void> {
  if (req.method === 'OPTIONS') return next();

  try {
    const allowed = await withTimeout(
      allowHit(`rateLimit:${scope}:${identity}:${req.path}`, max),
      CHECK_TIMEOUT_MS
    );
    if (!allowed) return void reject(res);
  } catch (err) {
    // ponytail: fail-open — Redis down jangan bikin seluruh API mati, longgarkan limit saja
    logger.warn(
      `Rate limit check failed (fail-open): ${err instanceof Error ? err.message : 'unknown'}`
    );
  }

  next();
}

/**
 * Global pre-auth limit per IP — longgar, karena IP kemungkinan besar
 * IP frontend server / proxy yang dipakai bersama semua user.
 * Default 100 req/s per path. Override: RATE_LIMIT_GLOBAL_MAX.
 */
export function RateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  return limit(
    req,
    res,
    next,
    'ip',
    req.ip ?? 'unknown',
    Number(process.env.RATE_LIMIT_GLOBAL_MAX ?? 100)
  );
}

/**
 * Per-user limit post-auth — pasang SETELAH VerifyJWT.
 * Default 5 req/s per user per path (paritas dengan CoreApp). Override: RATE_LIMIT_MAX.
 */
export function UserRateLimitMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  // cast: augmentasi Express.Request ada di tsc penuh tapi tidak masuk program ts-jest (include: tests only)
  const { user, driver, customer } = req as any;
  const identity =
    user?.tokenUserId ??
    driver?.driverId ??
    customer?.customerId ??
    req.ip ??
    'unknown';

  return limit(req, res, next, 'user', identity, Number(process.env.RATE_LIMIT_MAX ?? 5));
}
