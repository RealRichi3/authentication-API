import { Request, Response, NextFunction } from 'express';
import { PROJECT_HOST_EMAIL } from '../config';
import {
    getAuthCodes, getAuthTokens, getAuthFromCacheMemory, deleteAuthFromCacheMemory,
} from '../services/auth.service';
import { sendEmail } from '../services/email.service';
import { Email, UserWithStatus } from '../types';
import { AuthenticatedRequest } from '../types/global';
import { Status } from '../models/status.model';
import { User } from '../models/user.model';
import { BadRequestError } from '../utils/errors';

const requestSuperAdminAccountActivation =
    async (req: Request, res: Response, next: NextFunction) => {
        const email = req.query.email as Email;

        // Check if user already exists
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
        } = await getAuthCodes(existing_su, 'su_activation');

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

        const auth_code = await getAuthFromCacheMemory({
            type: 'su_activation',
            auth_class: 'code',
            email: req.user.email
        })

        if (!auth_code || auth_code != activation_code) {
            return next(new BadRequestError('Invalid activation code'));
        }

        // Activate new super admin account
        await Status.findByIdAndUpdate(req.user.status._id, { isActive: true });

        // Delete auth code
        deleteAuthFromCacheMemory({
            auth_class: 'code',
            type: 'su_activation',
            email: req.user.email
        })
        deleteAuthFromCacheMemory({
            auth_class: 'token',
            type: 'su_activation',
            email: req.user.email
        })

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
        } = await getAuthCodes(existing_su, 'su_deactivation');

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
                access_token: (await getAuthTokens(existing_su, 'su_deactivation')).access_token
            }
        })
    }

const deactivateSuperAdminAccount =
    async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        const { deactivation_code1, deactivation_code2 } = req.body;
        const deactivation_code = deactivation_code1 + '' + deactivation_code2;

        const auth_code = await getAuthFromCacheMemory({
            type: 'su_deactivation',
            auth_class: 'code',
            email: req.user.email
        })

        if (!auth_code || auth_code != deactivation_code) {
            return next(new BadRequestError('Invalid deactivation code'));
        }

        // Deactivate super admin account
        await Status.findByIdAndUpdate(req.user.status.id, { isActive: false });

        // Delete auth code
        deleteAuthFromCacheMemory({
            auth_class: 'code',
            type: 'su_deactivation',
            email: req.user.email
        })

        // Delete deactivation token
        deleteAuthFromCacheMemory({
            auth_class: 'token',
            type: 'su_deactivation',
            email: req.user.email
        })

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