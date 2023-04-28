import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import {
    deleteAuthFromCacheMemory,
    getAuthCodes, getAuthFromCacheMemory, getAuthTokens,
    handleExistingUser, handleUnverifiedUser
} from '../services/auth.service';
import { sendEmail } from '../services/email.service';
import { Email, WithPopulated, UserWithStatus } from '../types';
import { AuthenticatedRequest } from '../types/global';
import { Status, IStatusDoc } from '../models/status.model';
import { User, IUserDoc } from '../models/user.model';
import { BlacklistedToken } from '../models/auth.model';
import { IPasswordDoc, Password } from '../models/password.model';
import { BadRequestError, ForbiddenError, InternalServerError } from '../utils/errors';
import { IUser } from '../models/types/user.types';

/**
 * User signup
 * 
 * @description Creates a new user
 * 
 * @param { email: string, firstname: string, 
 *          lastname: string, password: string, 
 *          role: 'EndUser', 'Admin', 'SuperAdmin'} | Users details
 *  
 * @throws { BadRequestError } If user already exists
 * @throws { BadRequestError } If user is not created
 * @throws { BadRequestError } If user is not verified
 * 
 * @returns { user: IUserDoc, access_token: string }
 * 
 * //TODO: Test admin and super admin signup
 * */
const userSignup = async (req: Request, res: Response, next: NextFunction) => {

    const {
        email, firstname, lastname,
        password, role } = req.body;
    const user_info = {
        email: email as Email,
        firstname: firstname as string,
        lastname: lastname as string,
        password: password as string,
        role: role as IUser['role'],
    };

    // Check if user already exists
    type UserWithStatus = WithPopulated<IUserDoc, 'status', IStatusDoc>;
    const existing_user_d = await User.findOne({ email }).populate<UserWithStatus>('status');
    const existing_user: UserWithStatus | undefined = existing_user_d?.toObject();

    if (existing_user) return await handleExistingUser(existing_user, res, next);

    // Create new user in session
    let user: IUserDoc | undefined;
    const session = await mongoose.startSession()
    await session.withTransaction(async () => {
        // Create user
        user = (await User.create([user_info], { session }))[0]

        if (user) {
            // Create users profile
            const profile = await user.createProfile<typeof user.role>(session);

            console.log(profile)

            // Create password
            await Password.create([{ user: user._id, password }], { session });
        }

        await session.commitTransaction();
        session.endSession();
    });

    // If user is not created throw error
    if (!user) throw new BadRequestError('An error occurred');

    // Get access token
    const populated_user: UserWithStatus = await user.populate<UserWithStatus>('status')
    return await handleUnverifiedUser(populated_user.toObject(), res);
};

/**
 * Resend verification email
 * 
 * @description Resends verification email to user
 * 
 * @param { email: string } | User email
 * 
 * @throws { BadRequestError } If user does not exist
 * @throws { BadRequestError } If user's email is already verified
 * 
 * @returns { user: IUserDoc, access_token: string }
 */
const resendVerificationEmail = async (req: Request, res: Response, next: NextFunction) => {
    const email: Email = req.query.email as Email;

    // Get user
    const user: IUserDoc & { status: IStatusDoc } | null
        = await User.findOne({ email }).populate('status');

    // Check if user exists
    if (!user) return next(new BadRequestError('User does not exist'));

    // Check if user is unverified
    user.status?.isVerified
        ? next(new BadRequestError("User's email already verified"))
        : await handleUnverifiedUser(user.toObject(), res);
}

const verifyUserEmail = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const verification_code: number = req.body.verification_code;

    // Get user
    const user = req.user
    if (user.status.isVerified) return next(new BadRequestError('User already verified'));

    // // Check if verification code is correct
    const auth_code = await getAuthFromCacheMemory({
        auth_class: 'code',
        type: 'verification',
        email: req.user.email
    })

    if (!auth_code || auth_code != verification_code.toString()) {
        return next(new BadRequestError('Invalid verification code'))
    }

    // // Verify user
    await Status.findOneAndUpdate({ user: user._id }, { isVerified: true });

    // Blacklist access token
    deleteAuthFromCacheMemory({
        auth_class: 'token',
        type: 'verification',
        email: req.user.email
    })

    // Delete verification code
    deleteAuthFromCacheMemory({
        auth_class: 'code',
        type: 'verification',
        email: req.user.email
    })

    res.status(200).send({
        status: 'success',
        message: 'User verified',
        data: {
            user: { ...user, status: undefined },
        },
    });
}

/**
 * Forgot password
 * 
 * @description Sends password reset code to user
 * 
 * @param { email: string } | User email
 * 
 * @throws { BadRequestError } If user does not exist
 * 
 * @returns { user: IUserDoc, access_token: string }
 */
const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    const email: Email = req.body.email;

    // Get user
    const user: UserWithStatus | null = await User.findOne({ email }).populate('status');

    // Check if user exists
    if (!user) return next(new BadRequestError('User does not exist'));

    // Get password reset code
    const { password_reset_code }: { password_reset_code: number } =
        await getAuthCodes<'password_reset'>(user, 'password_reset');

    console.log(password_reset_code)
    // Send password reset email
    sendEmail({
        to: email,
        subject: 'Reset your password',
        text: `Your password reset code is ${password_reset_code}`,
    });

    // Get access token
    const { access_token }: { access_token: string } = await getAuthTokens(user.toObject(), 'password_reset');

    return res.status(200).send({
        status: 'success',
        message: 'Password reset code sent to user email',
        data: {
            user: { ...user.toObject(), status: undefined },
            access_token,
        },
    });
}

/**
 * Reset password
 * 
 * @description Resets user password
 * 
 * @param { password_reset_code: number, new_password: string } | Password reset code and new password
 * 
 * @throws { BadRequestError } If password reset code is incorrect
 * @throws { InternalServerError } If password is not updated
 * 
 * @returns { user: IUserDoc, access_token: string }
 */
const resetPassword = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const { password_reset_code, new_password } = req.body;

    // Check if password reset code is correct
    const auth_code = await getAuthFromCacheMemory({
        auth_class: 'code',
        type: 'password_reset',
        email: req.user.email
    })

    if (!auth_code || auth_code != password_reset_code.toString()) {
        return next(new BadRequestError('Invalid password reset code'));
    }

    // Update password
    const password = await Password.findOne({ user: req.user._id });

    password
        ? await password.updatePassword(new_password)
        : next(new InternalServerError('An error occurred'));

    // // Blacklist access token
    await deleteAuthFromCacheMemory({
        auth_class: 'code',
        type: 'password_reset',
        email: req.user.email,
    })
    await deleteAuthFromCacheMemory({
        auth_class: 'token',
        type: 'password_reset',
        email: req.user.email,
    })

    res.status(200).send({
        status: 'success',
        message: 'Password reset successful',
        data: {
            user: { ...req.user, status: undefined },
        },
    });
}

/**
 * Login
 * 
 * @description Logs user in
 * 
 * @param { email: string, password: string } | User email and password
 * 
 * @throws { BadRequestError } If user does not exist
 * @throws { BadRequestError } If user is not verified
 * @throws { BadRequestError } If user is not activated
 * @throws { BadRequestError } If password is incorrect
 * 
 * @returns { user: IUserDoc, access_token: string, refresh_token: string }
 */
const login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password } = req.body;

    // Get user
    type UserWithStatusAndPassword = UserWithStatus & { password: IPasswordDoc }
    const user: UserWithStatusAndPassword | null = await User.findOne({ email }).populate('status password')

    // Check if user exists
    if (!user) return next(new BadRequestError('User does not exist'));

    // Check if user is verified
    if (!user.status.isVerified) return next(new BadRequestError('User is not verified'));
    if (!user.status.isActive) return next(new BadRequestError('User is not activated'));

    // Check if password is correct
    const is_correct = await user.password.comparePassword(password);

    if (!is_correct) return next(new BadRequestError('Incorrect password'));

    // Get access token
    const { access_token, refresh_token } = await getAuthTokens(user.toObject(), 'access');

    return res.status(200).send({
        status: 'success',
        message: 'User logged in',
        data: {
            user: { ...user.toObject(), status: undefined, password: undefined },
            access_token,
            refresh_token
        },
    });
}

/**
 * Logout
 * 
 * @description Logs user out
 * 
 * @param { refresh_token: string } | Refresh token
 * @param { access_token: string } | Access token - In request header
 * 
 * @throws { BadRequestError } If refresh token is not provided
 * @throws { BadRequestError } If access token is not provided
 */
const logout = async (req: AuthenticatedRequest, res: Response) => {
    const { authorization } = req.headers;

    // Blacklist access token
    deleteAuthFromCacheMemory({
        auth_class: 'token',
        email: req.user.email,
        type: 'access',
    })

    deleteAuthFromCacheMemory({
        auth_class: 'token',
        email: req.user.email,
        type: 'refresh',
    })

    res.status(200).send({
        status: 'success',
        message: 'User logged out',
        data: null,
    });
}

const deactivateUserAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const email = req.query.email;

    // Deactivate user account
    const user: UserWithStatus | null
        = await User.findOne({ email }).populate<UserWithStatus>('status');

    if (!user) return next(new BadRequestError('User does not exist'));
    if (user.role === 'SuperAdmin') {
        return next(new ForbiddenError('You cannot deactivate a super admin account'));
    }

    user.status.isActive = false;
    await user.status.save();

    res.status(200).send({
        status: 'success',
        data: null
    })
}

const activateUserAccount = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const email = req.query.email;

    // Activate user account 
    const user: UserWithStatus | null
        = await User.findOne({ email }).populate<UserWithStatus>('status');

    if (!user) return next(new BadRequestError('User does not exist'));
    if (user.role === 'SuperAdmin') {
        return next(new ForbiddenError('You cannot activate a super admin account'));
    }

    user.status.isActive = true;
    await user.status.save();

    res.status(200).send({
        status: 'success',
        data: null
    })
}

// const uploadDocumentsForVerification = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
// }

export {
    userSignup,
    resendVerificationEmail,
    verifyUserEmail,
    forgotPassword,
    resetPassword,
    login, logout,
    deactivateUserAccount,
    activateUserAccount
};
