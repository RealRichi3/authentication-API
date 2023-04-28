import {
    IAdminDoc,
    TProfile,
    ISuperAdminDoc,
    IUserDoc,
} from './types/user.types';
import { model, ClientSession } from 'mongoose'

async function createSuperAdminProfile(
    user: IUserDoc,
    session?: ClientSession
): Promise<ISuperAdminDoc> {
    const doc = session
        ? model<ISuperAdminDoc>('SuperAdmin')
            .create([{ user: user._id }], { session })
            .then(doc => doc[0])
        : model<ISuperAdminDoc>('SuperAdmin').create({ user: user._id });

    return doc;
}

async function createAdminProfile(
    user: IUserDoc,
    session?: ClientSession
): Promise<IAdminDoc> {
    const doc = session
        ? model<IAdminDoc>('Admin')
            .create([{ user: user._id }], { session })
            .then(doc => doc[0])
        : model<IAdminDoc>('Admin').create({ user: user._id });

    return doc;
}

async function createEndUserProfile(
    user: IUserDoc,
    session?: ClientSession
): Promise<IUserDoc> {
    const doc = session
        ? model<IUserDoc>('EndUser')
            .create([{ user: user._id }], { session })
            .then(doc => doc[0])
        : model<IUserDoc>('EndUser').create({ user: user._id });

    return doc;
}

async function createProfile(
    this: IUserDoc,
    session?: ClientSession
) {
    switch (this.role) {
        case 'Admin':
            return createAdminProfile(this, session)
        case 'SuperAdmin':
            return createSuperAdminProfile(this, session)
        case 'EndUser':
            return createEndUserProfile(this, session)
    }
}

async function getProfile(this: IUserDoc): Promise<TProfile<typeof this.role>> {
    type Profile = TProfile<typeof this.role>;
    const res = await model<Profile>(this.role).findOne({ user: this._id })

    return res?.toObject() as unknown as Promise<Profile>;
}

export {
    createProfile,
    getProfile
}