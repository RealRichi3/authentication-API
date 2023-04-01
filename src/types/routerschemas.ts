import * as z from 'zod';
import { passwordSchema } from './global';

export const userSignup = z.object({
    body: z.object({
        email: z.string().email(),
        firstname: z.string(),
        lastname: z.string(),
        password: passwordSchema,
        role: z.enum(['EndUser', 'Admin', 'SuperAdmin']),
    }),
});
export const resendVerificationEmail = z.object({
    body: z.object({
        email: z.string().email(),
    }),
});
export const verifyUserEmail = z.object({
    body: z.object({
        verification_code: z.number(),
    }),
});
