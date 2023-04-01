import { Types, Document, Model } from 'mongoose';
import { IUser } from './user.types';

interface IPassword {
    password: string;
    user: Types.ObjectId | IUser;
    createdAt?: Date;
    updatedAt?: Date;
}

interface IPasswordDoc extends IPassword, Document { }

interface IPasswordMethods {
    updatePassword(new_password: string): Promise<void>;
    comparePassword(password: string): Promise<boolean>;
}
type PasswordModel = Model<IPasswordDoc> & IPasswordMethods;

export { IPassword, PasswordModel, IPasswordMethods, IPasswordDoc };
