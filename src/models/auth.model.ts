import { Model, model, Schema } from 'mongoose';
import { IAuthCodeDoc, IBlacklistedToken } from './types/auth.types';

const options = { timestamp: true, toObject: { virtuals: true }, toJSON: { virtuals: true } };

const authcode_schema = new Schema<IAuthCodeDoc>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        verification_code: { type: Number },
        password_reset_code: { type: Number },
        activation_code: { type: String },
        deactivation_code: { type: Number },
        createdAt: { type: Date, default: Date.now },
    },
    options
);

const blacklistedtoken_schema = new Schema<IBlacklistedToken>(
    {
        token: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
    },
    options
);

const AuthCode: Model<IAuthCodeDoc> = model<IAuthCodeDoc>('AuthCode', authcode_schema);
const BlacklistedToken: Model<IBlacklistedToken> = model<IBlacklistedToken>(
    'BlacklistedToken',
    blacklistedtoken_schema
);

export { AuthCode, BlacklistedToken };
