import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { HTTP_MESSAGE } from '@/shared-libs/constants/http-status.constant';
import SecretManager from '@/shared-libs/utils/secret-manager.util';
import { TokenEncryption } from '@/shared-libs/utils/token-encryption.util';
import logger from '@/shared-libs/utils/logger.util';
import { randomBytes } from 'node:crypto';
import { basicAuthRoutes } from '@/shared-libs/constants/basic-auth.constant';
import { driverAuthRoutes } from '@/shared-libs/constants/driver-auth.constant';
import { customerAuthRoutes } from '@/shared-libs/constants/customer-auth.constant';
import { noAuthRoutes } from '@/shared-libs/constants/no-auth.constant';
interface CustomJwtPayload extends JwtPayload {
  type?: string;
  email?: string;
  name?: string;
  role?: string;
  roles?: any[];
  menus?: any[];
  customerId?: string | null;
  phone?: string;
  contactId?: string;
  cmd?: string;
  drivervkvd?: string;
  driverShipmentId?: string;
}

// ponytail: verifikasi JWT stateless — tanpa cache/Redis. Identitas dibaca dari
// klaim token yang diterbitkan ServiceUser (signature diverifikasi di sini).
// Konsekuensi: token tidak bisa dicabut sebelum expired.

const dynamicRoutes = [/^\/v1\/register\/activation\/[^/?]+(\?.*)?$/]; // '/v1/register/activation/:token'

function handleUnauthorizedResponse(req: Request, res: Response) {
  const result = {
    transactionId: '0f06b466-99dd-4f59-a5df-1ad9f2a84d0a',
    code: '',
    message: HTTP_MESSAGE[401] || 'Unauthorized',
    eTag: 'pfmKgK6RpIkgkAAYukTfo21KRTyCwpiA',
    errors: [],
  };

  const requestObject = {
    url: req.originalUrl,
    params: req.params,
    headers: req.headers,
    body: req.body,
    response: result,
  };

  logger.error({
    message: `Unauthorized access attempt to ${req.originalUrl}`,
    data: requestObject,
  });
  return res.status(401).json(result);
}

function basicAuthRandomFallback(length = 8): string {
  return randomBytes(length).toString('base64url').slice(0, length);
}

function getClientCredentials(clientId: string): {
  user: string;
  pass: string;
} {
  /**
   * Final fallback use lightweight random string generator
   * for protecting from empty string / unset / null credential
   */
  switch (clientId) {
    case 'damira':
      return {
        user:
          SecretManager.env.BASIC_AUTH_CLIENT_DAMIRA_USER ??
          process.env.BASIC_AUTH_CLIENT_DAMIRA_USER ??
          basicAuthRandomFallback(),
        pass:
          SecretManager.env.BASIC_AUTH_CLIENT_DAMIRA_PASS ??
          process.env.BASIC_AUTH_CLIENT_DAMIRA_PASS ??
          basicAuthRandomFallback(),
      };
    case 'skyward':
      return {
        user:
          SecretManager.env.BASIC_AUTH_CLIENT_SKYWARD_USER ??
          process.env.BASIC_AUTH_CLIENT_SKYWARD_USER ??
          basicAuthRandomFallback(),
        pass:
          SecretManager.env.BASIC_AUTH_CLIENT_SKYWARD_PASS ??
          process.env.BASIC_AUTH_CLIENT_SKYWARD_PASS ??
          basicAuthRandomFallback(),
      };
    case 'default':
    default:
      return {
        user:
          SecretManager.env.BASIC_AUTH_USER ??
          process.env.BASIC_AUTH_USER ??
          basicAuthRandomFallback(),
        pass:
          SecretManager.env.BASIC_AUTH_PASS ??
          process.env.BASIC_AUTH_PASS ??
          basicAuthRandomFallback(),
      };
  }
}

function validateBasicAuth(req: Request, clientId: string): boolean {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Basic ')) {
    return false;
  }

  const encryptedBase64Credentials = authHeader.split(' ')[1];
  if (!encryptedBase64Credentials) {
    return false;
  }

  let base64Credentials: string;
  if (TokenEncryption.isEncryptedToken(encryptedBase64Credentials)) {
    base64Credentials = TokenEncryption.decrypt(encryptedBase64Credentials);
  } else {
    base64Credentials = encryptedBase64Credentials;
  }

  const credentials = Buffer.from(base64Credentials, 'base64').toString(
    'utf-8',
  );
  const [username, password] = credentials.split(':');

  const { user: validUser, pass: validPass } = getClientCredentials(clientId);

  return username === validUser && password === validPass;
}

export async function VerifyJWT(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');

  if (
    noAuthRoutes.has(req.originalUrl) ||
    dynamicRoutes.some((regex) => regex.test(req.originalUrl))
  ) {
    return next();
  }

  // Check if route requires basic auth
  const matchedRoute = basicAuthRoutes.find((route) =>
    route.pattern.test(req.originalUrl),
  );

  if (matchedRoute) {
    if (!validateBasicAuth(req, matchedRoute.clientId)) {
      logger.warn(
        `Basic auth failed for client "${matchedRoute.clientId}" on route: ${req.originalUrl}`,
      );
      return handleUnauthorizedResponse(req, res);
    }
    // Basic auth success — skip JWT and continue
    logger.info(
      `Basic auth success for client "${matchedRoute.clientId}" on route: ${req.originalUrl}`,
    );
    return next();
  }

  const encryptedToken = req.headers['authorization']?.split(' ')[1]; // Format: Bearer <encryptedToken>
  if (!encryptedToken) {
    return handleUnauthorizedResponse(req, res);
  }

  try {
    // Decrypt the token first
    let token: string;
    if (TokenEncryption.isEncryptedToken(encryptedToken)) {
      token = TokenEncryption.decrypt(encryptedToken);
    } else {
      // Fallback for non-encrypted tokens (backward compatibility during migration)
      token = encryptedToken;
    }

    const decodedToken = jwt.verify(
      token,
      SecretManager.env.JWT_SECRET,
    ) as CustomJwtPayload;

    if (decodedToken.type === 'refresh') {
      return handleUnauthorizedResponse(req, res);
    }

    // Check if route requires basic auth
    const driverRoute = driverAuthRoutes.find((route) =>
      route.pattern.test(req.originalUrl),
    );

    if (driverRoute) {
      handleDriverAuthentication(decodedToken, req);

      return next();
    }

    const customerRoute = customerAuthRoutes.find((route) =>
      route.pattern.test(req.originalUrl),
    );

    if (customerRoute) {
      handleCustomerAuthentication(decodedToken, req);

      return next();
    }

    handleUserAuthentication(decodedToken, req);

    next();
  } catch (error) {
    logger.error(`JWT verification error: ${(error as Error).message}`);
    return handleUnauthorizedResponse(req, res);
  }
}

// Identitas sepenuhnya dari klaim JWT terverifikasi — tanpa lookup cache.
function handleUserAuthentication(decodedToken: CustomJwtPayload, req: Request) {
  const authHeader = req.headers['authorization'];

  req.user = {
    tokenUserId: decodedToken.sub ?? '',
    tokenRole: decodedToken.role ?? '',
    tokenEmail: decodedToken.email ?? '',
    tokenRoles: decodedToken.roles ?? [],
    tokenName: decodedToken.name ?? '',
    tokenCustomerId: decodedToken.customerId ?? null,
    menus: decodedToken.menus ?? [],
    token: authHeader,
  };
}

function handleDriverAuthentication(decodedToken: CustomJwtPayload, req: Request) {
  req.driver = {
    driverId: decodedToken.sub ?? '',
    driverName: decodedToken.name ?? '',
    driverEmail: decodedToken.email ?? '',
    driverPhone: decodedToken.phone ?? '',
    drivervkvd: decodedToken.drivervkvd ?? '',
    driverShipmentId: decodedToken.driverShipmentId ?? '',
    token: req.headers['authorization'],
  };
}

function handleCustomerAuthentication(decodedToken: CustomJwtPayload, req: Request) {
  req.customer = {
    customerId: decodedToken.customerId ?? decodedToken.sub ?? '',
    contactId: decodedToken.contactId ?? '',
    mobilePhone: decodedToken.phone ?? '',
    contactName: decodedToken.name ?? '',
    cmd: decodedToken.cmd ?? '',
    name: decodedToken.name ?? '',
    token: req.headers['authorization'],
  };
}
