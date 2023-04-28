import { Types, Document } from 'mongoose';
import { IUser } from './user.types';

interface IStatus {
    user: Types.ObjectId | IUser;
    isActive: boolean;
    isVerified: boolean;
}
interface IStatusDoc extends  IStatus, Document { }

export { IStatus, IStatusDoc };
