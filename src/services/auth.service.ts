import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { sendEmail } from './email.service';
import { AuthCode } from '../models/auth.model';
import { NotFoundError } from '../utils/errors';
import { IUserDoc } from '../models/types/user.types';
import { IAuthCodeDoc } from '../models/types/auth.types';
import { TAuthToken, TAuthCode, UserWithStatus } from '../types';
import { BadRequestError } from '../utils/errors';
import * as config from '../config';
import { IStatusDoc } from '../models/types/status.types';
import { User } from '../models/user.model';
import mongoose from 'mongoose';

/**
 * Generate Required Config Variables
 *
 * @description Generates required config variables for JWT
 *
 * @param config_type  'access' or 'refresh'
 * @returns
 *
 * @throws {Error} if config_type is not 'access', 'refresh', 'password_reset' or 'verification'
 */
export function getJWTConfigVariables(config_type: TAuthToken): {
    secret: string;
    expiry: string;
} {
    switch (config_type) {
        case 'access':
            return { secret: config.JWT_ACCESS_SECRET, expiry: config.JWT_ACCESS_EXP };

        case 'refresh':
            return { secret: config.JWT_REFRESH_SECRET, expiry: config.JWT_REFRESH_EXP };

        case 'password_reset':
            return {
                secret: config.JWT_PASSWORDRESET_SECRET,
                expiry: config.JWT_PASSWORDRESET_EXP,
            };

        case 'verification':
            return {
                secret: config.JWT_EMAILVERIFICATION_SECRET,
                expiry: config.JWT_EMAILVERIFICATION_EXP,
            };

        case 'su_activation':
            return {
                secret: config.JWT_SUPERADMINACTIVATION_SECRET,
                expiry: config.JWT_SUPERADMINACTIVATION_EXP,
            };

        case 'su_deactivation':
            return {
                secret: config.JWT_SUPERADMINACTIVATION_SECRET,
                expiry: config.JWT_SUPERADMINACTIVATION_EXP,
            };

        // if config_type is not 'access' or 'refresh', throw an error
        default:
            throw new Error(`Invalid config_type: ${config_type}`);
    }
}

type TGetAuthCodesResponse = {
    'password_reset': {
        password_reset_code: number;
    },
    'verification': {
        verification_code: number;
    },
    'su_activation': {
        activation_code1: number;
        activation_code2: number;
    },
    'su_deactivation': {
        deactivation_code1: number;
        deactivation_code2: number;
    }
}
/**
 * Get auth codes
 *
 * @description Get auth codes for a user
 *
 * @param {TAuthToken} code_type
 * @param {MongooseDocument | mongoose.Types.ObjectId } user
 * @returns
 */
export async function getAuthCodes<T extends keyof TGetAuthCodesResponse>(
    user: IUserDoc,
    code_type: T
): Promise<TGetAuthCodesResponse[T]> {
    const random_number = Math.floor(100000 + Math.random() * 900000);
    let verification_code,
        password_reset_code,
        activation_code1, activation_code2, activation_code,
        deactivation_code1, deactivation_code2, deactivation_code;

    let users_auth_code: IAuthCodeDoc | null;

    switch (code_type) {
        case 'verification':
            verification_code = random_number;
            users_auth_code = await AuthCode.findOneAndUpdate(
                { user: user._id },
                { verification_code },
                { new: true }
            );

            break;

        case 'password_reset':
            password_reset_code = random_number;
            users_auth_code = await AuthCode.findOneAndUpdate(
                { user: user._id },
                { password_reset_code },
                { new: true }
            );
            break;

        case 'su_activation':
            activation_code1 = random_number;
            activation_code2 = Math.floor(100000 + Math.random() * 900000);
            activation_code = `${activation_code1}${activation_code2}`;
            users_auth_code = await AuthCode.findOneAndUpdate({ user: user._id }, { activation_code }, { new: true })
            break;

        case 'su_deactivation':
            deactivation_code1 = random_number;
            deactivation_code2 = Math.floor(100000 + Math.random() * 900000);
            deactivation_code = `${deactivation_code1}${deactivation_code2}`;
            users_auth_code = await AuthCode.findOneAndUpdate({ user: user._id }, { deactivation_code }, { new: true })
            break;

        default:
            throw new Error(`Invalid code_type: ${code_type}`);
    }

    if (!users_auth_code) throw new NotFoundError('User not found');

    return {
        verification_code: users_auth_code.verification_code,
        password_reset_code: users_auth_code.password_reset_code,
        activation_code1, activation_code2,
        deactivation_code1, deactivation_code2,
    } as TGetAuthCodesResponse[T]
}

/**
 * Get auth tokens
 *
 * @description Get auth tokens for a user i.e access token and refresh token
 *
 * @param {MongooseDocument | mongoose.Types.ObjectId } user
 * @param {TAuthToken} token_type
 * @returns {Promise<{ access_token: string; refresh_token: string | undefined }>
 */
export async function getAuthTokens(
    user: UserWithStatus,
    token_type: TAuthToken = 'access'
): Promise<{ access_token: string; refresh_token: string | undefined }> {
    const { secret, expiry } = getJWTConfigVariables(token_type);

    const user_doc = await User.findById(user).populate<UserWithStatus>('status')
    if (user_doc) user = user_doc.toObject();

    // Access token usecase may vary, so we can't use the same
    // user = user.toObject()
    const access_token = jwt.sign({ ...user }, secret, { expiresIn: expiry });
    const refresh_token = jwt.sign({ ...user } as object, config.JWT_REFRESH_SECRET, {
        expiresIn: config.JWT_REFRESH_EXP,
    });

    return {
        access_token,
        // If the secret is the same as the access token secret,
        // i.e the token is meant for post authentication
        // then return the refresh token, else return undefined
        refresh_token: secret == config.JWT_ACCESS_SECRET ? refresh_token : undefined,
    };
}

/**
 * Handle unverified user
 *
 * @description Sends verification email and returns access token
 *
 * @param unverified_user  User with unverified email address
 * @param res  Response object
 * @param next  Next function
 *
 * @returns { access_token: string}
 */
export async function handleUnverifiedUser(
    unverified_user: UserWithStatus, res: Response)
    : Promise<Response> {

    // Get verificateion code
    const { verification_code }: { verification_code: number }
        = await getAuthCodes<'verification'>(unverified_user, 'verification');

    // Send verification email
    sendEmail({
        to: unverified_user.email,
        subject: 'Verify your email address',
        text: `Your verification code is ${verification_code}`,
    });

    // Get access token
    const { access_token } = await getAuthTokens(unverified_user, 'verification');

    const user = Object.assign(unverified_user, { status: undefined });

    return res.status(200).send({
        status: 'success',
        message: 'Verification code sent to user email',
        data: {
            user,
            access_token,
        },
    });
}

/**
 * Handle existing user
 *
 * @description Handles existing user
 *
 * @param existing_user  Existing user
 * @param res  Response object
 *
 * @returns {Response}
 * */
export async function handleExistingUser(
    existing_user: IUserDoc & { status: IStatusDoc }, res: Response, next: NextFunction)
    : Promise<Response | NextFunction> {

    const response =
        existing_user.status?.isVerified
            ? next(new BadRequestError('Email belongs to an existing user'))
            : await handleUnverifiedUser(existing_user, res);

    return response as Response | NextFunction;
}