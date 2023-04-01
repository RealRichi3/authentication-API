import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthenticatedError } from '../utils/errors';
import { getAuthTokens, getJWTConfigVariables } from '../services/auth.service';
import { TAuthCode, TAuthToken, IRequestWithUser, UserWithStatus } from '../types';
import * as config from '../config';
import * as jwt from 'jsonwebtoken';
import { BlacklistedToken } from '../models/auth.model';
import { AuthenticatedAsyncController, AuthenticatedRequest } from '../types/global';
import { IStatus } from '../models/types/status.types';
import logger from './winston';

/**
 * Exchange Auth Tokens
 * 
 * @description Exchange refresh token for new authentication tokens
 * 
 * @param req 
 * @param res
 *  
 * @returns { access_token, refresh_token} 
 */
async function exchangeAuthTokens(req: IRequestWithUser, res: Response) {
    const { access_token, refresh_token } = await getAuthTokens(req.user as UserWithStatus, 'access')

    return res.status(200).send({
        status: 'success',
        message: 'Successfully exchanged auth tokens',
        data: {
            access_token,
            refresh_token
        }
    })
}

/**
 * Basic Auth
 * 
 * @description Middleware to validate requests made to protected routes
 * 
 * @param token_type:  Type of validation 
 * 
 * @returns 
 */
const basicAuth = function (token_type: TAuthToken | undefined = undefined) {
    return async (req: Request & { user?: UserWithStatus }, res: Response, next: NextFunction) => {
        // Get authorization header
        const auth_header = req.headers.authorization;

        // Check if authorization header is present
        if (!auth_header?.startsWith('Bearer'))
            return next(new UnauthenticatedError('Invalid authorization header'));

        // Get JWT config variables
        const secret = token_type
            ? getJWTConfigVariables(token_type).secret
            : config.JWT_ACCESS_SECRET;

        const jwt_token = auth_header.split(' ')[1];
        const payload = jwt.verify(jwt_token, secret) as string;
        req.user = payload ? Object(payload) as UserWithStatus : undefined
        const user = req.user

        // Check if access token has been blacklisted
        // TODO: Use redis for blacklisted tokens
        const tokenIsBlacklisted = await BlacklistedToken.findOne({ token: jwt_token })
        if (tokenIsBlacklisted) return next(new ForbiddenError('JWT token expired'));
        
        // Check if user wants to exchange or get new auth tokens
        if (req.method == 'GET'
            && req.path == '/authtoken'
            && req.user) await exchangeAuthTokens(req, res);

        
        console.log('user', user)

        /** Check if users account has been activated
         * 
         *  Some Some requests do not require users account to be activated
         *  examples of these request are email verification, password reset
         */
        if (user?.status.isActive && !token_type) {
            // return next(new ForbiddenError('Unauthorized access, users account is not active'))
        }

        return next()
    };
}

function withAuthentication(handler : AuthenticatedAsyncController) {
    return async (req: Request, res: Response, next: NextFunction) => {
        return handler(req as AuthenticatedRequest, res, next)
    }
}
export { basicAuth, withAuthentication }
