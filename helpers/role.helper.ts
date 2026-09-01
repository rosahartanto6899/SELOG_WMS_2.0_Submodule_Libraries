import { default as SecretManager } from '@/shared-libs/utils/secret-manager.util';

type TokenRole = {
    id: string;
    name: string;
};

type User = {
    tokenRoles?: TokenRole[];
};

const getSuperAdminId = (): string | undefined => {
    return process.env.ROLE_ID_SUPERADMIN || SecretManager.env.ROLE_ID_SUPERADMIN;
};

export const isSuperadmin = (user?: User): boolean => {
    if (!user?.tokenRoles?.length) return false;
    const superAdminId = getSuperAdminId();

    return user.tokenRoles.some(
        (role) => role.id === superAdminId
    );
};

type Role = {
    id: string;
    branches?: string[];
};

export const hasRoleSuperAdminId = (
    roles?: Role[]
): boolean => {
    const superAdminRoleId = getSuperAdminId();

    if (!roles?.length || !superAdminRoleId) return false;

    return roles.some(
        (role) => role.id === superAdminRoleId
    );
};