import 'reflect-metadata';
import { Request } from 'express';
import {
  PermissionHelper,
  PermissionAction,
} from '../helpers/permission.helper';
import { IDataUser } from '../interfaces/user-data.interface';
import { ForbiddenException } from '../exceptions';

export interface PermissionConfig {
  menuCode?: string;
  action?: string;
  allowedMenuPermissions?: Array<{
    menuCode: string;
    action: string;
  }>;
}

/**
 * Convert string action to PermissionAction enum
 */
function getPermissionAction(action: string): PermissionAction {
  switch (action.toUpperCase()) {
    case 'CREATE':
      return PermissionAction.CREATE;
    case 'READ':
      return PermissionAction.READ;
    case 'UPDATE':
      return PermissionAction.UPDATE;
    case 'DELETE':
      return PermissionAction.DELETE;
    case 'ETC':
      return PermissionAction.ETC;
    default:
      throw new Error(`Invalid permission action: ${action}`);
  }
}

/**
 * Method decorator that validates permissions before method execution
 */
export function ValidatePermissions(config: PermissionConfig) {
  return function (
    _target: any,
    _propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Find the request object in the arguments
      const req = args.find((arg) => arg?.user) as Request & {
        user: IDataUser;
      };

      if (!req?.user) {
        throw new ForbiddenException('User not authenticated');
      }

      const user = req.user;

      // Validate single permission
      if (config.menuCode && config.action) {
        const permissionAction = getPermissionAction(config.action);

        const hasPermission = PermissionHelper.hasMenuPermission(
          user,
          config.menuCode,
          permissionAction,
        );

        if (!hasPermission) {
          throw new ForbiddenException(
            `Access denied: requires ${config.action} permission on ${config.menuCode}`,
          );
        }
      }

      // Validate multiple permissions (OR logic)
      if (
        config.allowedMenuPermissions &&
        config.allowedMenuPermissions.length > 0
      ) {
        const permissions = config.allowedMenuPermissions.map((p) => ({
          menuCode: p.menuCode,
          action: getPermissionAction(p.action),
        }));

        if (!PermissionHelper.hasAnyMenuPermission(user, permissions)) {
          throw new ForbiddenException(
            'Access denied: insufficient permissions',
          );
        }
      }

      // Call original method if validation passes
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
