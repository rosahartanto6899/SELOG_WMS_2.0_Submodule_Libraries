import { Request, Response, NextFunction } from 'express';
import { authorizeBranchScope } from '@/shared-libs/helpers/authorize-branch-scope.helper';
import {
  basicAuthRoutes,
  driverAuthRoutes,
  noAuthRoutes,
  customerAuthRoutes,
} from '@/shared-libs/constants/';

export function AuthorizeBranchScope() {
  return (req: Request & any, _: Response, next: NextFunction) => {
    const user = req.user;
    const requestedBranchIds = req.body?.branchIds || req.query?.branchId;

    // Check if route requires basic auth
    const matchedRoute = basicAuthRoutes.find((route) =>
      route.pattern.test(req.originalUrl),
    );

    // check if route does not require branch scope authorization
    const exceptionRoute = noAuthRoutes.has(req.originalUrl);

    const driverRoute = driverAuthRoutes.find((route) =>
      route.pattern.test(req.originalUrl),
    );

    const customerRoute = customerAuthRoutes.find((route) =>
      route.pattern.test(req.originalUrl),
    );

    if (matchedRoute || exceptionRoute || driverRoute || customerRoute) {
      // Skip branch scope authorization for basic auth routes and no-auth routes
      return next();
    }

    const { branchIds } = authorizeBranchScope({
      user,
      requestedBranchIds,
    });
    req.branchScope = { branchIds };

    next();
  };
}
