import { Microsoft365 } from '@/integrations/thrid-party/microsoft-365.thrid';
import SecretManager from '@/shared-libs/utils/secret-manager.util';
import * as ejs from 'ejs';

class EmailConfig {
  private static instance: any;

  private constructor() {}

  public static getInstance() {
    const emailServiceHandlers = {
      'microsoft-365': () => new Microsoft365(),
    };

    if (!EmailConfig.instance) {
      const service = SecretManager.env.EMAIL_SERVICE || 'microsoft-365';
      const createEmailService = emailServiceHandlers[service];

      if (!createEmailService) {
        throw new Error('Unknown email service');
      }

      EmailConfig.instance = createEmailService();
    }

    return EmailConfig.instance;
  }
}

export default EmailConfig.getInstance();

export async function renderBody(
  templatePath: string,
  data: any
): Promise<string> {
  try {
    const template: string = await ejs.renderFile(templatePath, data);
    return template;
  } catch (error) {
    console.error('Error rendering EJS template:', error);
    throw new Error('Failed to render template');
  }
}
