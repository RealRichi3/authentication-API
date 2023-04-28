/* eslint-disable no-debugger */
import { Types, Document, Model, ClientSession } from 'mongoose';
import { IPasswordDoc } from './password.types';
import { IStatusDoc } from './status.types';
import { Email, WithPopulated } from '../../types';

/* User Types */
interface IUserRole {
    Admin: 'Admin';
    SuperAdmin: 'SuperAdmin';
    EndUser: 'EndUser';
}
type TUserRole = IUserRole[keyof IUserRole];
interface IUser {
    firstname: string;
    lastname: string;
    email: Email;
    role: TUserRole;
    googleId?: string;
    githubId?: string;
    createdAt: Date;
    updatedAt: Date;
}
interface IUserDoc extends IUser, IUserMethods, Document { }
interface IUserModel extends Model<IUserDoc>, IUserMethods { }
interface IUserMethods {
    createProfile:
    <R extends IUser['role']>(
        this: IUserDoc,
        session: ClientSession
    ) => Promise<TProfile<R>>;
    getProfile: <U extends TUserRole>() => Promise<TProfile<U>>;
}
interface IUserWithVirtualsDoc<R extends TUserRole> extends IUserDoc {
    status: Types.ObjectId | IStatusDoc;
    password: Types.ObjectId | IPasswordDoc;
    user_profile: TProfile<R>
}
type UsersWithStrictRole = {
    [key in IUser['role']] : Omit<IUser, 'role'> & { role: key }
}

/* User Profiles */
interface ISuperAdmin extends IUser {
    role: IUserRole['SuperAdmin'];
    user: Types.ObjectId | IUser;
}
interface ISuperAdminDoc extends ISuperAdmin, Document { }

interface IAdmin extends IUser {
    role: IUserRole['Admin'];
    user: Types.ObjectId | IUser;
}
interface IAdminDoc extends IAdmin, Document { }

interface IEndUser extends IUser {
    role: IUserRole['EndUser'];
    user: Types.ObjectId | IUser;
}
interface IEndUserDoc extends IEndUser, Document { }

/* User Profiles Grouped by Role */
type Users = {
    Admin: {
        plain: IAdmin;
        doc: IAdminDoc;
    };
    SuperAdmin: {
        plain: ISuperAdmin;
        doc: ISuperAdminDoc;
    },
    EndUser: {
        plain: IEndUser;
        doc: IEndUserDoc;
    }
}
type IUserPlain = {
    [key in keyof Users]: Users[key]['plain'];
}
type IUserDocs = {
    [key in keyof Users]: Users[key]['doc'];
}

type TProfile<T extends IUser['role']> = IUserDocs[T];
type TProfileData<T extends IUser['role']> = Omit<IUserPlain[T], 'user'>;
type TUserWithProfile = WithPopulated<IUserDoc, 'profile', TProfile<IUser['role']>>;
type TUserWithProfileAndStatus =
    WithPopulated<
        TUserWithProfile,
        'status',
        IStatusDoc
    >;

export {
    IUser, IUserDoc, 
    IUserPlain, IUserDocs, 
    IUserModel, IUserMethods,
    IAdmin, IAdminDoc, 
    ISuperAdmin, ISuperAdminDoc,
    IEndUser, IEndUserDoc,
    IUserWithVirtualsDoc, 
    Users, UsersWithStrictRole,
    TProfile, TProfileData, 
    TUserWithProfile, TUserWithProfileAndStatus,
    IUserRole, TUserRole
};
