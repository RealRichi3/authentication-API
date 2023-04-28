import { Types, Document } from 'mongoose';
import { IUser } from './user.types';

interface IPassword {
    password: string;
    user: Types.ObjectId | IUser;
    createdAt?: Date;
    updatedAt?: Date;
}

interface IPasswordMethods {
    updatePassword(new_password: string): Promise<void>;
    comparePassword(password: string): Promise<boolean>;
}

interface IPasswordDoc extends IPassword, IPasswordMethods, Document { }

export { IPassword, IPasswordMethods, IPasswordDoc };
