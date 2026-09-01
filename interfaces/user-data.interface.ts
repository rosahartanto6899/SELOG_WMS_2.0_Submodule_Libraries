interface IDataUser {
  id: string;
  email: string;
  role: string; // Primary role for backward compatibility
  roles: IDataUserRole[];
  menus: IDataUserMenu[];
  tokenUserId: string;
  tokenRole: string;
  tokenEmail: string;
  tokenRoles: IDataUserRole[];
  token: string;
  tokenName?: string;
}

interface IDataUserRole {
  id: string;
  name: string;
  description?: string;
  branches: string[];
}

interface IDataUserMenu {
  id: string;
  menuCode: string | null;
  permissions: IMenuPermissions;
}

interface IMenuPermissions {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canEtc: boolean;
}

export { IDataUser, IDataUserRole, IDataUserMenu, IMenuPermissions };
