import { UserWithStatus } from ".";
import { Request, Response, NextFunction } from "express";
import * as z from "zod";

export interface AuthenticatedRequest extends Request {
    headers: {
        authorization: string
    },
    user: UserWithStatus
}

export interface AuthenticatedAsyncController {
    (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void>
}

export const EmailType = z.string().email();

export const passwordSchema = z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password cannot be longer than 100 characters')
    .regex(/[A-Za-z0-9!@#$%^&*()_+=\-[\]{};':"\\|,.<>/?]+/, {
        message: 'Password must contain at least one special character',
    })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one digit' });

export type TPassword = z.infer<typeof passwordSchema>;
