import { Email, NodeENV } from '../types';

export const MONGO_URI: string = process.env.MONGO_URI as string,
    MONGO_URI_TEST: string = process.env.MONGO_URI_TEST as string,
    MONGO_URI_DEV: string = process.env.MONGO_URI_DEV as string,
    MONGO_URI_PROD: string = process.env.MONGO_URI_PROD as string,
    REDIS_URL: string = process.env.REDIS_URL as string;

export const PORT: number = parseInt(process.env.PORT as string, 10) || 5555;

/* JWT TOKENS */
export const JWT_SECRET: string = process.env.JWT_ACCESS_SECRET as string,
    JWT_ACCESS_SECRET: string = process.env.JWT_ACCESS_SECRET as string,
    JWT_SECRET_EXP: number = parseInt(process.env.JWT_ACCESS_EXP as string, 10),
    JWT_ACCESS_EXP: number = parseInt(process.env.JWT_ACCESS_EXP as string, 10),
    JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET as string,
    JWT_REFRESH_EXP: number = parseInt(process.env.JWT_REFRESH_EXP as string, 10),
    JWT_PASSWORDRESET_SECRET: string = process.env.JWT_PASSWORDRESET_SECRET as string,
    JWT_PASSWORDRESET_EXP: number = parseInt(process.env.JWT_PASSWORDRESET_EXP as string, 10),
    JWT_EMAILVERIFICATION_SECRET: string = process.env.JWT_EMAILVERIFICATION_SECRET as string,
    JWT_EMAILVERIFICATION_EXP: number = parseInt(process.env.JWT_EMAILVERIFICATION_EXP as string, 10),
    JWT_SUPERADMINACTIVATION_SECRET: string = process.env.JWT_SUPERADMINACTIVATION_SECRET as string,
    JWT_SUPERADMINACTIVATION_EXP: number = parseInt(process.env.JWT_SUPERADMINACTIVATION_EXP as string, 10);

/* EMAIL and OAUTH2*/
export const EMAIL_HOST: string = process.env.EMAIL_HOST as string,
    EMAIL_PORT: number = parseInt(process.env.EMAIL_PORT as string, 10),
    EMAIL_HOST_ADDRESS: Email = process.env.EMAIL_HOST_ADDRESS as Email,
    OAUTH_CLIENT_ID: string = process.env.OAUTH_CLIENT_ID as string,
    OAUTH_CLIENT_SECRET: string = process.env.OAUTH_CLIENT_SECRET as string,
    OAUTH_REFRESH_TOKEN: string = process.env.OAUTH_REFRESH_TOKEN as string,
    OAUTH_ACCESS_TOKEN: string = process.env.OAUTH_ACCESS_TOKEN as string,
    GOOGLE_SIGNIN_CLIENT_ID: string = process.env.GOOGLE_SIGNIN_CLIENT_ID as string,
    PROJECT_HOST_EMAIL: Email = process.env.PROJECT_HOST_EMAIL as Email;

/* Server */
export const SERVER_URL: string = process.env.SERVER_URL as string;

/* Github */
export const GITHUB_CLIENT_ID: string = process.env.GITHUB_CLIENT_ID as string,
    GITHUB_CLIENT_SECRET: string = process.env.GITHUB_CLIENT_SECRET as string;

/* Node Environment */
export const NODE_ENV: NodeENV = process.env.NODE_ENV as NodeENV;

/* Cloudinary config */
export const CLOUDINARY_CLOUD_NAME: string = process.env.CLOUDINARY_CLOUD_NAME as string,
    CLOUDINARY_API_KEY: string = process.env.CLOUDINARY_API_KEY as string,
    CLOUDINARY_API_SECRET: string = process.env.CLOUDINARY_API_SECRET as string;