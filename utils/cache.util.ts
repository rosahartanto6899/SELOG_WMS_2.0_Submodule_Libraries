import { RedisCache } from '@/integrations/thrid-party/redis.third';
import { ICache } from '@/shared-libs/interfaces/cache.interface';
import SecretManager from '@/shared-libs/utils/secret-manager.util';
import { UTILS_CONSTANT } from '@/shared-libs/constants/utils-service.constant';

class Cache {
  private static instance: ICache;

  private constructor() {}

  public static getInstance() {
    const cacheHandlers = {
      redis: () => new RedisCache(),
    };

    if (!Cache.instance) {
      const cacheService =
        SecretManager.env.CACHE_SERVICE || UTILS_CONSTANT.REDIS;
      const createCacheInstance = cacheHandlers[cacheService];

      if (!createCacheInstance) {
        throw new Error('Unknown Cache service');
      }

      Cache.instance = createCacheInstance();
    }

    return Cache.instance;
  }
}

export default Cache.getInstance();
