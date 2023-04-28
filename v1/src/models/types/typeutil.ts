import { Types } from 'mongoose';

/**
 * Extend an existing type T to include
 * an optional field K of type U
 */
export type WithOptionalField<T, K extends keyof T, U> = Omit<T, K> &
    Partial<Pick<T, K>> & { [key in K]?: U };

/** Type with base parameters for all models */
export interface IBaseId {
    _id: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}
