import { Types, Document } from 'mongoose';
import { IPassword, IPasswordDoc } from './password.types';
import { IStatus, IStatusDoc } from './status.types';
import { Email } from '../../types';

interface IUser {
    firstname: string;
    lastname: string;
    email: Email;
    role: 'EndUser' | 'Admin' | 'SuperAdmin';
    googleId?: string;
    githubId?: string;
    craetedAt: Date;
    updatedAt: Date;
}

interface IUserDoc extends IUser, Document { }

interface IUserWithVirtualsDoc extends IUserDoc {
    status: Types.ObjectId | IStatusDoc;
    password: Types.ObjectId | IPasswordDoc;
}

interface IUserWithPopulatedStatusVirtualDoc extends IUserDoc {
    status: IStatusDoc;
}

export { IUser, IUserWithVirtualsDoc, IUserDoc, IUserWithPopulatedStatusVirtualDoc };
