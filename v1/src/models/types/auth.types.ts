import { Types, Document } from 'mongoose';
import { IUser } from './user.types';

interface IBlacklistedToken extends Document {
    user: Types.ObjectId | IUser;
    token: string;
}

interface IAuthCode {
    user: string,
    verification_code?: number;
    password_reset_code?: number;
    activation_code?: number;
    deactivation_code?: number;
}

interface IAuthToken {
    user: string;
    access_token: string;
    refresh_token: string;
}

export { IBlacklistedToken, IAuthCode, IAuthToken};
