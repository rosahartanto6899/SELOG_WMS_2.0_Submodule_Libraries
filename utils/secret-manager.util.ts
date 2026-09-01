import { VaultClient } from '@/integrations/thrid-party/vault.third';
import { UTILS_CONSTANT } from '@/shared-libs/constants/utils-service.constant';

class SecretManager {
  private static instance: any;

  private constructor() {}

  public static getInstance() {
    const vaulthandlers = {
      vault: () => new VaultClient(),
    };

    if (!SecretManager.instance) {
      const service = UTILS_CONSTANT.VAULT;
      const createSecretManagerInstance = vaulthandlers[service];

      if (!createSecretManagerInstance) {
        throw new Error('Unknown Secretmanager service');
      }

      SecretManager.instance = createSecretManagerInstance();
    }
    return SecretManager.instance;
  }
}

export default SecretManager.getInstance();
