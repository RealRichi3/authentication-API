import { Types, Document } from 'mongoose';
import { IUser } from './user.types';

interface IBlacklistedToken extends Document {
    user: Types.ObjectId | IUser;
    token: string;
    createdAt?: Date;
    updatedAt?: Date;
}

interface IAuthCode {
    user: Types.ObjectId | IUser;
    verification_code?: number;
    password_reset_code?: number;
    activation_code?: number;
    deactivation_code?: number;
    createdAt?: Date;
    updatedAt?: Date;
}
interface IAuthCodeDoc extends IAuthCode, Document { }

interface IAuthCodeWithoutUser extends Document {
    user: undefined;
}

type TAuthCodeKeys = keyof IAuthCodeWithoutUser;

export { IBlacklistedToken, IAuthCode, IAuthCodeDoc, TAuthCodeKeys};
