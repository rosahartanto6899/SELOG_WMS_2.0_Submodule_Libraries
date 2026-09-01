export interface AuthenticatedUser {
  tokenUserId: string;
  tokenRole: string;
  tokenEmail: string;
  tokenRoles: any[];
  tokenName: string;
  tokenCustomerId?: string | null;
  menus: any[];
  token?: string | undefined;
}

export interface AuthenticatedDriver {
  driverId: string;
  driverName: string;
  driverEmail: string;
  driverPhone: string;
  drivervkvd: string;
  driverShipmentId: string;
  token?: string | undefined;
}

export interface AuthenticatedCustomer {
  customerId: string;
  contactId: string;
  mobilePhone: string;
  contactName: string;
  cmd: string;
  name: string;
  token?: string | undefined;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      driver?: AuthenticatedDriver;
      customer?: AuthenticatedCustomer;
    }
  }
}

export {};
