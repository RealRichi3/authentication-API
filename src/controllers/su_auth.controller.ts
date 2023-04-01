import mongoose from 'mongoose';
import { Request, Response, NextFunction } from 'express';
import { PROJECT_HOST_EMAIL } from '../config';
import {
    getAuthCodes, getAuthTokens,
    handleExistingUser, handleUnverifiedUser
} from '../services/auth.service';
import { sendEmail } from '../services/email.service';
import { Email, WithPopulated, UserWithStatus } from '../types';
import { AuthenticatedRequest } from '../types/global';
import { IStatusDoc } from '../models/types/status.types';
import { Status } from '../models/status.model';
import { IUserDoc, IUserWithPopulatedStatusVirtualDoc } from '../models/types/user.types';
import { User } from '../models/user.model';
import { AuthCode, BlacklistedToken } from '../models/auth.model';
import { Password, PasswordModel } from '../models/password.model';
import { BadRequestError, InternalServerError } from '../utils/errors';

const requestSuperAdminAccountActivation =
    async (req: Request, res: Response, next: NextFunction) => {
        const email = req.query.email as Email;

        // Check if user already exists
        type UserWithStatus = IUserWithPopulatedStatusVirtualDoc
        const existing_su = await User.findOne({ email, role: 'SuperAdmin' })
            .populate<UserWithStatus>('status');


        // If user doesn't  exists
        if (!existing_su) {
            return next(new BadRequestError('Super admin account does not exist'));
        }

        existing_su.status.isActive = false
        await existing_su.status.save()
        await existing_su.save()
        // If user is not verified
        if (!existing_su.status.isVerified) {
            return next(new BadRequestError('Super admin account is not verified'));
        }

        // If user is already active
        if (existing_su.status.isActive) {
            return next(new BadRequestError('Super admin account is already active'));
        }

        const {
            activation_code1, activation_code2
        } = await getAuthCodes(existing_su._id, 'su_activation');

        console.log(activation_code1, activation_code2)
        // Send first activation code to user
        sendEmail({
            to: email,
            subject: 'Super admin account activation',
            html: `
                <p>Hi ${existing_su.firstname},</p>
                <p>Use the following activation code to activate your super admin account:</p>
                <p>${activation_code1} ${activation_code2}</p>
                <p>Thank you.</p>
                `
        })

        // Send second activation code to admin
        sendEmail({
            to: PROJECT_HOST_EMAIL,
            subject: 'Super admin account activation for ' + email,
            html: `
                <p>Hi admin,</p>
                <p>Use the following activation code to activate the super admin account for ${email}:</p>
                <p>${activation_code1} ${activation_code2}</p>
                <p>Thank you.</p>
                `
        })

        return res.status(200).json({
            status: 'success',
            message: 'Super admin account activation code sent to user email',
            data: {
                access_token: (await getAuthTokens(existing_su, 'su_activation')).access_token
            }
        })
    }

const activateSuperAdminAccount =
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const { activation_code1, activation_code2 } = req.body;
        const activation_code = activation_code1 + '' + activation_code2;

        const auth_code = await AuthCode.findOne({ user: req.user.id, activation_code })

        if (!auth_code) { return next(new BadRequestError('Invalid activation code')); }

        // Activate new super admin account
        await Status.findByIdAndUpdate(req.user.status._id, { isActive: true });

        // Delete auth code
        await BlacklistedToken.create({ token: req.headers.authorization.split(' ')[1] });

        res.status(200).json({
            status: 'success',
            message: 'Super admin account activated',
            data: null
        })
    }

const requestSuperAdminAccountDeactivation =
    async (req: Request, res: Response, next: NextFunction) => {
        const email = req.query.email;

        // Check if user already exists
        type UserWithStatus = IUserWithPopulatedStatusVirtualDoc
        const existing_su = await User.findOne({ email, role: 'SuperAdmin' })
            .populate<UserWithStatus>('status');

        // If user does not exist
        if (!existing_su) {
            return next(new BadRequestError('Super admin account does not exist'));
        }

        // If user is not verified
        if (!existing_su.status.isVerified) {
            return next(new BadRequestError('Super admin account is not verified'));
        }

        // If user is already inactive
        if (!existing_su.status.isActive) {
            return next(new BadRequestError('Super admin account is already inactive'));
        }

        const {
            deactivation_code1, deactivation_code2
        } = await getAuthCodes(existing_su._id, 'su_deactivation');

        // Send first deactivation code to user
        sendEmail({
            to: existing_su.email,
            subject: 'Super admin account deactivation',
            html: `
                <p>Hi ${existing_su.firstname},</p>
                <p>Use the following deactivation code to deactivate your super admin account:</p>
                <p>${deactivation_code1} ${deactivation_code2}</p>
                <p>Thank you.</p>
                `
        })

        // Send second deactivation code to admin
        sendEmail({
            to: PROJECT_HOST_EMAIL,
            subject: 'Super admin account deactivation for ' + email,
            html: `
                <p>Hi admin,</p>
                <p>Use the following deactivation code to deactivate the super admin account for ${email}:</p>
                <p>${deactivation_code1} ${deactivation_code2}</p>
                <p>Thank you.</p>
                `
        })

        return res.status(200).json({
            status: 'success',
            message: 'Super admin account deactivation code sent to user email',
            data: {
                access_token: (await getAuthTokens(existing_su._id, 'su_deactivation')).access_token
            }
        })
    }

const deactivateSuperAdminAccount =
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const { deactivation_code1, deactivation_code2 } = req.body;
        const deactivation_code = deactivation_code1 + '' + deactivation_code2;

        const auth_code = await AuthCode.findOne({ user: req.user.id, deactivation_code })

        if (!auth_code) { return next(new BadRequestError('Invalid deactivation code')); }

        // Deactivate super admin account
        await Status.findByIdAndUpdate(req.user.status.id, { isActive: false });

        // Delete auth code
        await BlacklistedToken.create({ token: req.headers.authorization.split(' ')[1] });

        res.status(200).json({
            status: 'success',
            message: 'Super admin account deactivated',
            data: null
        })
    }

export {
    requestSuperAdminAccountActivation,
    activateSuperAdminAccount,
    requestSuperAdminAccountDeactivation,
    deactivateSuperAdminAccount
}