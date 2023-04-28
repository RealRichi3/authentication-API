import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/global';
import { ForbiddenError } from '../utils/errors';
import { withAuthentication } from './auth';

// Role-based access control
export default function rbacHandler(roles: string[]) {
    return withAuthentication
        (async (req: AuthenticatedRequest, res: Response, next: NextFunction)
            : Promise<void> => {
            const { user } = req;

            if (roles.includes(user.role)) {
                next();
            } else {
                return next(new ForbiddenError('You are not authorized to perform this action.'))
            }
        })
}