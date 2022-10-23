const _ = require('lodash');
const mongoose = require('mongoose');

const bcrypt = require('bcryptjs');


// Models
const { User } = require('../models/usersModel');
const { Token, BlacklistedTokens } = require('../models/tokenModel'),
    { Status } = require('../models/accountStatusModel'),
    { Password } = require('../models/passwordModel.js');

// Middlewares
const asyncWrapper = require('../middlewares/asyncWrapper'),
    {
        BadRequestError,
        UnauthorizedError
    } = require('../middlewares/customError');

// Utilities / Helpers
const {
    mailActivationCodes,
    generateActivationCodes,
    mailPasswordResetToken
} = require('./utils/helpers'),
    { hashPassword, checkHash } = require('./utils/hash'),
    { decodeJWT } = require('./utils/jwt'),
    { statusCode } = require('./utils/statusCode');
const { getAuthTokens } = require('./utils/getAuthTokens');

// Constants
const config = process.env;
const role = 'SuperAdmin';

const client = mongoose.connection

const validateEmail = (email) => {
    return String(email)
        .toLowerCase()
        .match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};

/*  SIGNUP FOR NEW ADMIN
    Checks for duplicate registration
    Creates new Admin
    Sets new Admin isActive status to false -> restricts Administrative access
    Creates, Stores and sends 3 seperate verification tokens  to specified project heads

    Returns Authorization Bearer Token, and Users name
*/
const signup = asyncWrapper(async (req, res, next) => {
    req.body.role = 'SuperAdmin';
    const role = 'SuperAdmin';
    const { firstname, lastname, email, password, phonenumber } = req.body;

    if (!validateEmail(email)) {
        throw new BadRequestError('Email validation failed');
    }
    const currAdmin = await User.findOne({ email, role }).populate('status');
    if (currAdmin) {
        if (currAdmin.status.isActive) {
            throw new BadRequestError(
                'Super Admin account is active, please login'
            );
        }
        if (!currAdmin.status.isVerified) {
            const { head_token_1, head_token_2, user_token } =
                generateActivationCodes(),
                token = head_token_1 + head_token_2 + user_token;

            Token.findOneAndUpdate(
                { user: currAdmin._id },
                { verification: token },
                { new: true }
            );
            mailActivationCodes(
                head_token_1,
                head_token_2,
                user_token,
                email,
                firstname
            );

            const { access_token } = await getAuthTokens(currAdmin._id);

            return res
                .status(statusCode.BADREQUEST)
                .send({
                    message: 'SuperAdmin exists, please activate account',
                    access_token
                });
        }
        throw new BadRequestError('User already registered please login');
    }

    const newAdmin = await User.create(req.body);
    const { head_token_1, head_token_2, user_token } =
        generateActivationCodes(),
        token = head_token_1 + head_token_2 + user_token;

    req.body.verification = token;

    await newAdmin.completeSave(req.body);
    mailActivationCodes(
        head_token_1,
        head_token_2,
        user_token,
        email,
        firstname
    );
    const { access_token } = await getAuthTokens(newAdmin._id);

    return res
        .status(201)
        .send({ user: { firstname, lastname }, access_token });
});

/*  ACCOUNT ACTIVATION FOR NEW SUPER ADMIN
    Requires Authorization Bearer token, verification tokens from head1, head2 and user
*/
const activateNewSuperAdminAcc = asyncWrapper(async (req, res, next) => {
    const { head_token_1, head_token_2, user_token } = req.body,
        verification_token = head_token_1 + head_token_2 + user_token;

    if (!head_token_1 || !head_token_2 || !user_token) {
        throw new BadRequestError('Missing Required parameter: Validation failed')
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) { throw new UnauthorizedError('Authentication invalid') }

    const jwtToken = authHeader.split(' ')[1];
    const payload = decodeJWT(jwtToken);

    // Check if access token has been blaocklisted
    const blacklisted = await BlacklistedTokens.findOne({ user: payload._id });
    if (blacklisted && blacklisted.tokens.includes(jwtToken)) { throw new UnauthorizedError('JWT token expired') }
    const currAdmin = await User.findOne({ _id: payload._id }).populate('token status');

    if (currAdmin.status.isVerified) { throw new BadRequestError('User Account already verified') }
    if (currAdmin.token.verification != verification_token) { throw new BadRequestError('Invalid verification code') }

    const session = await client.startSession()
    await session.withTransaction(async () => {
        Status.findOneAndUpdate(
            { user: payload._id },
            { isVerified: true, isActive: true }, { session });
        Token.findOneAndUpdate({ user: payload._id }, { verification: null }, { session });
        await BlacklistedTokens.findOneAndUpdate(
            { user: payload._id },
            { $push: { tokens: jwtToken } },
            { upsert: true, session }
        );
    })
    await session.endSession()

    return res
        .status(statusCode.OK)
        .send({ message: 'SuperAdmin account activated successfully' });
});

const login = asyncWrapper(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new BadRequestError(
            'Missing required parameter: Validation failed'
        );
    }

    const currAdmin = await User.findOne({ email }).populate('password status');
    if (!currAdmin) { throw new UnauthorizedError("User does not exist") }
    if (currAdmin.role != "SuperAdmin") { throw new UnauthorizedError('Endpoint restricted to SuperAdmin') }

    if (!currAdmin) { throw new UnauthorizedError('Invalid login credentials') }

    if (!currAdmin.status.isActive) { throw new UnauthorizedError('User account is not active') }
    if (!currAdmin.status.isVerified) {
        const { access_token } = await getAuthTokens(currAdmin._id);
        const { head_token_1, head_token_2, user_token } = generateActivationCodes(),
            token = head_token_1 + head_token_2 + user_token;

        Token.findOneAndUpdate({ user: currAdmin._id }, { verification: token }, { new: true });

        mailActivationCodes(
            head_token_1, head_token_2,
            user_token, email, 'Admin'
        );

        return res
            .status(statusCode.BADREQUEST)
            .send({
                message: 'SuperAdmin exists, please verify account',
                access_token
            });
    }

    console.log(currAdmin)
    const match = await checkHash(password, currAdmin.password.password);
    if (!match) { throw new UnauthorizedError('Login credentials invalid') }

    const { access_token, refresh_token } = await getAuthTokens(currAdmin._id);

    return res
        .status(statusCode.OK)
        .send({ message: 'Successful login', access_token, refresh_token });
});

const passwordReset = asyncWrapper(async (req, res, next) => {
    const { email } = req.body,
        currUser = await User.findOne({ email });
    if (!currUser) {
        throw new BadRequestError('User does not exist');
    }

    const { head_token_1, head_token_2, user_token } =
        generateActivationCodes(),
        reset_token = head_token_1 + head_token_2 + user_token;
    await Token.findOneAndUpdate(
        { user: currUser._id },
        { password_reset: reset_token },
        { new: true }
    );
    const { access_token } = await getAuthTokens(currUser._id);

    await mailPasswordResetToken(
        head_token_1,
        head_token_2,
        user_token,
        email,
        currUser.firstname
    );
    return res
        .status(statusCode.CREATED)
        .send({
            message: 'Password reset code sent you user email',
            access_token
        });
});

const confirmResetAndChangePassword = asyncWrapper(async (req, res, next) => {
    const { head_token_1, head_token_2, user_token, password } = req.body,
        reset_token = head_token_1 + head_token_2 + user_token;
    if (!head_token_1 || !head_token_2 || !user_token || !password) {
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

    const currUserReset = await Token.findOne({ user: payload._id });

    const currUser = await User.findById({ _id: payload._id }).populate('status token');

    if (!currUser || !currUser.status.isActive || !currUser.status.isVerified) {
        throw new UnauthorizedError('Unauthorized access');
    }
    if (
        !currUserReset.password_reset ||
        reset_token != payload.reset_token ||
        reset_token != currUserReset.password_reset
    ) { throw new BadRequestError('Reset token is invalid') }

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(password, salt)

    try {
        const session = await client.startSession()
        session.startTransaction()
        currUserReset.update({
            password_reset: null,
            access_token: null,
            reset_token: null
        }).session(session);

        BlacklistedTokens.findOneAndUpdate(
            { user: payload._id },
            { $push: { tokens: jwtToken } },
            { upsert: true }).session(session);

        await Password.findOneAndUpdate(
            { user: payload._id },
            { password: hash }
        ).session(session);

        await session.commitTransaction()
        session.endSession()

    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }

    return res
        .status(statusCode.OK)
        .send({ message: 'Successful password reset' });
});

module.exports = {
    signup,
    login,
    activateNewSuperAdminAcc,
    passwordReset,
    confirmResetAndChangePassword
};
