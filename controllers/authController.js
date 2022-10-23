const _ = require('lodash');
const mongoose = require('mongoose');
const config = process.env;
const { OAuth2Client } = require('google-auth-library');
const OauthClient = new OAuth2Client(config.OAUTH_CLIENT_ID_GOOGLE_SIGNIN);

// Models
const { Token, BlacklistedTokens } = require('../models/tokenModel'),
    { Status } = require('../models/accountStatusModel'),
    { Password } = require('../models/passwordModel.js');

const {
    User
} = require('../models/usersModel');

// Middlewares
const asyncWrapper = require('../middlewares/asyncWrapper'),
    {
        CustomAPIError,
        BadRequestError,
        UnauthorizedError
    } = require('../middlewares/customError');

// Utilities
const { sendMail } = require('./utils/mailer'),
    { hashPassword, checkHash } = require('./utils/hash'),
    { decodeJWT } = require('./utils/jwt'),
    { statusCode } = require('./utils/statusCode'),
    { EmailMsg } = require('./utils/messageTemplates');
const { getAuthTokens } = require('./utils/getAuthTokens');


// // HELPERS ---

const client = mongoose.connection
const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

const signup = asyncWrapper(async (req, res, next) => {
    if (!req.body.role) {
        throw new BadRequestError(
            'Missing required parameter: Validation failed'
        );
    }
    const data = ({ firstname, lastname, email, role, password, phonenumber } =
        req.body);

    const restricted_roles = ["SuperAdmin"]
    if (restricted_roles.includes(role)) { throw new UnauthorizedError("SuperAdmin Account can not be created using this endpoint") }
    if (!validateEmail(email)) {
        throw new BadRequestError('Email validation failed');
    }

    const currUser = await User.findOne({ email: email }).populate('status');
    if (currUser) {
        if (!currUser.status.isVerified) {
            let new_token = Math.floor(100000 + Math.random() * 900000);
            await Token.findOneAndUpdate(
                { user: currUser._id },
                { verification: new_token },
                { new: true }
            ).populate('user');

            // console.log(auth_token);
            await sendMail(
                new EmailMsg(
                    email,
                    firstname,
                    new_token
                ).userAccountVerification()
            );

            const { access_token } = await getAuthTokens(currUser._id);

            return res.status(statusCode.BADREQUEST).send({
                message: 'User exists, please verify your account',
                access_token
            });
        }
        throw new BadRequestError('User already registered please login ');
    }

    const newUser = await User.create(req.body);
    const ver_token = await newUser.completeSave(data);

    // console.log(newUser);

    await sendMail(
        new EmailMsg(email, firstname, ver_token).userAccountVerification()
    );
    const { access_token } = await getAuthTokens(newUser._id);

    return res
        .status(201)
        .send({ message: "Successful", user: { firstname, lastname }, access_token });
});

const verifyEmail = asyncWrapper(async (req, res, next) => {
    const { verification_token } = req.body;

    if (!req.body.verification_token) {
        throw new BadRequestError('Missing required parameter: Validation failed')
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw new UnauthorizedError('Authentication invalid');
    }

    const jwtToken = authHeader.split(' ')[1];
    const payload = decodeJWT(jwtToken);
    const blacklisted = await BlacklistedTokens.findOne({ user: payload._id });
    if (blacklisted && blacklisted.tokens.includes(jwtToken)) {
        throw new UnauthorizedError('JWT token expired');
    }

    const currUser = await User.findOne({ _id: payload._id }).populate('token status');
    if (currUser.status.isVerified) { throw new BadRequestError('User Account already verified') }
    if (currUser.token.verification != verification_token) { throw new BadRequestError('Invalid verification code') }

    await Status.findOneAndUpdate({ user: payload._id }, { isVerified: true });
    await Token.findOneAndUpdate({ user: payload._id }, { verification: null });
    await BlacklistedTokens.findOneAndUpdate(
        { user: payload._id },
        { $push: { tokens: jwtToken } },
        { upsert: true }
    );

    return res
        .status(statusCode.OK)
        .send({ message: 'Successful' });
});

const login = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new BadRequestError(
            'Missing required parameter: Validation failed'
        );
    }

    const currUser = await User.findOne({ email }).populate('password status');

    if (!currUser) {
        throw new BadRequestError('Invalid login credentials');
    }
    if (!currUser.status.isVerified) {
        const { access_token } = await getAuthTokens(currUser._id);
        const new_token = Math.floor(100000 + Math.random() * 900000);
        await Token.findOneAndUpdate(
            { user: currUser._id },
            { verification: new_token },
            { new: true }
        );
        await sendMail(
            new EmailMsg(
                email,
                currUser.firstname,
                new_token
            ).userAccountVerification()
        );

        return res
            .status(statusCode.BADREQUEST)
            .send({ message: 'Please verify your account', access_token });
    }
    if (!currUser.status.isActive) {
        throw new UnauthorizedError('User account is not active');
    }

    const match = await checkHash(password, currUser.password.password);
    if (!match) {
        throw new UnauthorizedError('Login credentials invalid');
    }

    const { access_token, refresh_token } = await getAuthTokens(currUser._id);

    return res
        .status(statusCode.OK)
        .send({ message: 'Successful', access_token, refresh_token });
});

const googleSignin = asyncWrapper(async (req, res, next) => {
    const authorization = req.headers.authorization;
    const token = authorization.split(' ')[1];

    const ticket = await Oauthclient.verifyIdToken({
        idToken: token,
        audience: config.ANDROID_CLIENT_ID // Specify the CLIENT_ID of the app that accesses the backend
    }),
        payload = ticket.getPayload(),
        currUser = await User.findOne({ email: payload.email });

    if (!currUser) {
        // Create new user in db
        const user_data = {
            firstname: payload.given_name,
            lastname: payload.family_name,
            email: payload.email,
            role: 'EndUser'
        };

        const newUser = await User.create(user_data);
        await EndUser.create({ ...user_data, user: newUser._id });
        await Status.create({
            ...user_data,
            user: newUser._id,
            isActive: true,
            isVerified: true
        });
        await Wallet.create({ ...user_data, user: newUser._id });
        await Token.create({ ...user_data, user: newUser._id });
        const { access_token, refresh_token } = await getAuthTokens(
            newUser._id
        );

        return res
            .status(statusCode.OK)
            .send({ message: 'Successful', access_token, refresh_token });
    }

    const { access_token, refresh_token } = await getAuthTokens(currUser._id);
    return res
        .status(statusCode.OK)
        .send({ message: 'Successful', access_token, refresh_token });
});

const passwordReset = asyncWrapper(async (req, res, next) => {
    const { email } = req.body,
        currUser = await User.findOne({ email });
    if (!currUser) {
        throw new BadRequestError('User does not exist');
    }

    const reset_token = Math.floor(100000 + Math.random() * 900000).toString();
    await Token.findOneAndUpdate(
        { user: currUser._id, role: currUser.role },
        { password_reset: reset_token },
        { upsert: true }
    );

    // console.log(reset_token);
    const { access_token } = await getAuthTokens(currUser._id);

    await sendMail(
        new EmailMsg(email, currUser.firstname, reset_token).passwordReset()
    );
    return res.status(statusCode.CREATED).send({
        message: 'Successful, Password reset code sent to user email',
        access_token
    });
});

const confirmResetAndChangePassword = asyncWrapper(async (req, res, next) => {
    const { reset_token, password } = req.body;
    if (!reset_token || !password) {
        throw new BadRequestError(
            'Missing required parameter: Validation failed'
        );
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw new UnauthorizedError('Authentication invalid');
    }

    const jwtToken = authHeader.split(' ')[1];
    const payload = decodeJWT(jwtToken);
    const currUserReset = await Token.findOne({
        user: payload._id
    });
    if (!currUserReset) {
        throw new UnauthorizedError('Access token expired');
    }

    if (
        !currUserReset.password_reset ||
        reset_token != payload.reset_token ||
        reset_token != currUserReset.password_reset
    ) {
        throw new BadRequestError('Reset token is invalid');
    }

    const hash = await hashPassword(password);

    const session = await client.startSession()
    await session.withTransaction(async () => {
        await Password.findOneAndUpdate(
            { user: payload._id },
            { password: hash },
            { new: true}
        ).session(session).populate('user');
        await currUserReset.updateOne({ password_reset: null }).session(session);
        await BlacklistedTokens.findOneAndUpdate(
            { user: payload._id },
            { $push: { tokens: jwtToken } },
            { upsert: true}
        ).session(session);
    })
    session.endSession()

    return res
        .status(statusCode.OK)
        .send({ message: 'Successful Password Reset' });
});

module.exports = {
    signup,
    verifyEmail,
    login,
    googleSignin,
    passwordReset,
    confirmResetAndChangePassword
};
