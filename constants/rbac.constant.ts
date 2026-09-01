type RbacPermission = {
  [role in string]: { [method: string]: string[] };
};

export const rbacPermissions: RbacPermission = {
  VENDOR: {
    get: ['v1/users-access', 'v1/users/search'],
  },
};
