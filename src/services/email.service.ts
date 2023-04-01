import nodemailer from 'nodemailer';
import * as config from '../config';
import { Email } from '../types';

/**
 * Type for mailOptions
 *
 * @description
 * 1. Make text and html optional
 * 2. Make text required if html is not provided
 * 3. Make html required if text is not provided
 * 4. Make from optional
 */
interface IPartialMailOptions {
    from?: string;
    to: Email;
    subject: string;
}
type TMailOptions = IPartialMailOptions & ({ text: string } | { html: string });

export async function sendEmail(mailOptions: TMailOptions): Promise<void | Error> {
    try {
        const transporter = nodemailer.createTransport({
            host: config.EMAIL_HOST,
            port: config.EMAIL_PORT,
            secure: true,
            auth: {
                type: 'OAuth2',
                user: config.EMAIL_HOST_ADDRESS,
                clientId: config.OAUTH_CLIENT_ID,
                clientSecret: config.OAUTH_CLIENT_SECRET,
                refreshToken: config.OAUTH_REFRESH_TOKEN,
                accessToken: config.OAUTH_ACCESS_TOKEN,
            },
        });

        mailOptions.from = mailOptions.from ?? config.EMAIL_HOST_ADDRESS;

        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.log(error);
        throw error;
    }
}
