import { IStatusDoc } from '../models/types/status.types';
import { IUserDoc } from '../models/types/user.types';
import * as routerSchemas from './routerschemas';
import { MongoServerError } from 'mongodb';
import { Request } from 'express';


type MongoDuplicateKeyError = MongoServerError & {
    code: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyValue?: { [key: string]: any };
};

type main<T, K extends string, P> = K extends keyof T ?
    Omit<T, K> & { [k in K]: P } :
    T & { [k in K]: P }

// Add populated field to existing type
type WithPopulated<T, K extends string, P> = T & { [k in K]: P };

type UserWithStatus = WithPopulated<IUserDoc, 'status', IStatusDoc>;

type NodeENV = 'dev' | 'test' | 'prod';

type Email = string & { __brand: 'email' };

type TAuthCode = {
    password_reset: 'password_reset_code';
    verification: 'verification_code';
    activation: 'activation_code';
    deactivation: 'deactivation_code';
}
type TAuthToken = 'access' | 'refresh' | 'password_reset' | 'verification' | 'su_activation' | 'su_deactivation';

interface IRequestWithUser extends Request {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user?: UserWithStatus
}

export {
    MongoDuplicateKeyError,
    routerSchemas, NodeENV,
    Email, WithPopulated,
    UserWithStatus,
    TAuthCode, TAuthToken,
    IRequestWithUser,
};
