import { BadRequestException, UnprocessableEntityException } from '../exceptions';

export interface AuthorizeBranchScopeParams {
  user: {
    tokenRoles?: Array<{
      name: string;
      branches?: string[];
    }>;
    tokenRole: string
  };
  requestedBranchIds?: string[];
}

export interface AuthorizeBranchScopeResult {
  branchIds: string[];
}

/**
 * UUID format validation (version-agnostic).
 */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Authorizes and resolves branch scope for WMS operational queries.
 *
 * This helper determines which branch IDs a user is allowed to access
 * based on their role assignments and an optional branch filter from
 * the request.
 *
 * Behavior:
 * - A user must have at least one branch assigned in their roles.
 * - If the request specifies branch IDs, only branches that intersect
 *   with the user's allowed branches will be used.
 * - If no branch IDs are specified, all branches assigned to the user
 *   will be applied as the operational scope.
 *
 * Errors:
 * - Throws an exception if the user has no branch access.
 * - Throws an exception if the requested branches are outside the user's scope.
 *
 * Domain context:
 * - In WMS systems, a branch represents an operational unit
 *   such as a depot, hub, or pool, and directly affects data visibility.
 */
export function authorizeBranchScope({
  user,
  requestedBranchIds,
}: AuthorizeBranchScopeParams): AuthorizeBranchScopeResult {
  const allowedBranches = new Set<string>();

  for (const role of user?.tokenRoles ?? []) {
    if (user?.tokenRole !== role.name) continue

    for (const branchId of role?.branches ?? []) {
      if (typeof branchId === 'string' && branchId.trim()) {
        allowedBranches.add(branchId);
      }
    }
  }

  // TODO: enable again after branch data is ready in master data
  // if (allowedBranches.size === 0) {
  //   throw new BadRequestException('You do not have access to any branch');
  // }

  let finalBranchIds: string[];

  if (Array.isArray(requestedBranchIds) && requestedBranchIds.length > 0) {
    const invalidBranchIds = requestedBranchIds.filter(
      (id) => typeof id !== 'string' || !UUID_REGEX.test(id),
    );

    if (invalidBranchIds.length > 0) {
      throw new UnprocessableEntityException([
        'One or more branch IDs have an invalid format. Please provide valid UUIDs.'
      ]);
    }

    finalBranchIds = requestedBranchIds.filter((id) => allowedBranches.has(id));

    if (finalBranchIds.length === 0) {
      throw new BadRequestException(
        'You do not have access to the selected branch'
      );
    }
  } else {
    finalBranchIds = Array.from(allowedBranches);
  }

  return { branchIds: finalBranchIds };
}
