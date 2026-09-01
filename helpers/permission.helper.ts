import { IDataUser, IDataUserMenu } from '../interfaces/user-data.interface';

export enum PermissionAction {
  CREATE = 'canCreate',
  READ = 'canRead',
  UPDATE = 'canUpdate',
  DELETE = 'canDelete',
  ETC = 'canEtc',
}

export interface RoutePermissionConfig {
  menuCode?: string;
  action?: PermissionAction;
  allowedMenuPermissions?: Array<{
    menuCode: string;
    action: PermissionAction;
  }>;
}

export class PermissionHelper {
  /**
   * Check if user has permission for a specific menu and action
   */
  static hasMenuPermission(
    user: IDataUser,
    menuCode: string,
    action: PermissionAction
  ): boolean {
    if (!user.menus || user.menus.length === 0) {
      return false;
    }

    const userMenu = user.menus.find(
      (menu: IDataUserMenu) => menu.menuCode === menuCode
    );

    if (!userMenu) {
      return false;
    }

    return userMenu.permissions[action] === true;
  }

  /**
   * Check if user has any of the allowed menu permissions
   */
  static hasAnyMenuPermission(
    user: IDataUser,
    allowedPermissions: Array<{ menuCode: string; action: PermissionAction }>
  ): boolean {
    return allowedPermissions.some((permission) =>
      this.hasMenuPermission(user, permission.menuCode, permission.action)
    );
  }

  /**
   * Main permission validation
   */
  static hasPermission(
    user: IDataUser,
    config: RoutePermissionConfig
  ): boolean {
    // Check multiple menu permissions (OR logic)
    if (
      config.allowedMenuPermissions &&
      config.allowedMenuPermissions.length > 0
    ) {
      return this.hasAnyMenuPermission(user, config.allowedMenuPermissions);
    }

    // Single menu permission check (backward compatibility)
    if (config.menuCode && config.action) {
      return this.hasMenuPermission(user, config.menuCode, config.action);
    }

    return false; // No permissions specified
  }

  /**
   * Get HTTP method to permission action mapping
   */
  static getActionFromMethod(method: string): PermissionAction {
    switch (method.toUpperCase()) {
      case 'GET':
        return PermissionAction.READ;
      case 'POST':
        return PermissionAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return PermissionAction.UPDATE;
      case 'DELETE':
        return PermissionAction.DELETE;
      default:
        return PermissionAction.ETC;
    }
  }
}

export default PermissionHelper;
