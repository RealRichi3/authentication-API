const _ = require('lodash')
const mongoose = require('mongoose')

// Models
const { VerificationToken, ResetToken } = require('../models/tokenModel'),
    { Status } = require('../models/accountStatusModel'),
    { Password } = require('../models/passwordModel.js');
const { BoatOperator, EndUser, Staff, Ticketer, User } = require('../models/usersModel');

// Middlewares
const {asyncWrapper} = require('../middlewares/asyncWrapper'),
    { CustomAPIError, BadRequestError, UnauthorizedError } = require('../middlewares/customError');

// Utilities
const { sendMail } = require("./utils/mailer"),
    { hashString, confirmHash } = require('./utils/hash'),
    { decodeJWT } = require('./utils/jwt'),
    { statusCode } = require('./utils/statusCode'),
    { EmailMsg } = require('./utils/messageTemplates')

// Constants
const config = process.env


// // HELPERS ---
// const checkIfUserExists = asyncWrapper(async (user_role, user_email, next) => {
//     return 
// })

const validateEmail = (email) => {
    return String(email).
        toLowerCase().
        match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
};
// --- HELPERS


const signup = asyncWrapper(async (req, res, next) => {
    let jwt_token;
    console.log(req.body)
    if (!req.body.role) { throw new BadRequestError("Missing required parameter: Validation failed") }
    const { firstname, lastname, email, role, password, phonenumber } = req.body;

    if (!validateEmail(email)) { throw new BadRequestError("Email validation failed") }

    const match = await User.findOne({ email })
    if (match) {
        currUser = await User.findOne({ email: email }).populate('status');
        console.log(currUser)
        if (!currUser.status.isVerified) {
            jwt_token = currUser.createJWT()

            let new_token = Math.floor(100000 + Math.random() * 900000);
            await VerificationToken.findOneAndUpdate({ user: currUser._id }, { token: new_token }, { new: true });
            await sendMail(new EmailMsg(email, firstname, new_token).userAccountVerification());

            return res.status(statusCode.BADREQUEST).send({ message: "User exists, please verify your account", token: jwt_token })
        }
        throw new BadRequestError('User already registered please login')
    }

    const newUser = await User.create(req.body);
    const ver_token = await newUser.completeSave(req.body)

    await sendMail(new EmailMsg(email, firstname, ver_token).userAccountVerification())
    jwt_token = newUser.createJWT()

    return res.status(201).send({ user: { firstname, lastname }, token: jwt_token })
})


const verifyEmail = asyncWrapper(async (req, res, next) => {
    const { verification_token } = req.body
    if (!req.body.verification_token) { throw new BadRequestError("Missing required parameter: Validation failed") }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) { throw new UnauthorizedError('Authentication invalid') }

    const jwtToken = authHeader.split(' ')[1]
    const payload = decodeJWT(jwtToken)

    const currUser = await User.findOne({ _id: payload._id }).populate('verification_token status')
    console.log(currUser)
    if (currUser.status.isVerified) { throw new BadRequestError('User Account already verified') }
    if (currUser.verification_token.token != verification_token) {
        throw new UnauthorizedError('Invalid verification code')
    }

    await Status.findOneAndUpdate({ user: payload._id }, { isVerified: true })
    await VerificationToken.findOneAndDelete({ user: payload._id })

    return res.status(statusCode.OK).send({ message: "User Email verified successfully" })
})


const login = asyncWrapper(async (req, res, next) => {
    let jwt_token;

    const { email, password } = req.body;
    if (!email || !password) { throw new BadRequestError("Missing required parameter: Validation failed") }

    const currUser = await User.findOne({ email }).populate('password status');

    if (!currUser) { throw new BadRequestError('Invalid login credentials') }
    if (!currUser.status.isVerified) {
        jwt_token = currUser.createJWT()

        const new_token = Math.floor(100000 + Math.random() * 900000);
        await VerificationToken.findOneAndUpdate({ user: currUser._id }, { token: new_token }, { new: true });
        await sendMail(new EmailMsg(email, currUser.firstname, new_token).userAccountVerification());

        return res.status(statusCode.BADREQUEST).send({ message: "Please verify your account", token: jwt_token })
    }

    const match = await confirmHash(password, currUser.password.password)
    if (!match) { throw new UnauthorizedError("Login credentials invalid") }
    jwt_token = currUser.createJWT()

    return res.status(statusCode.OK).send({ message: "Login successful", token: jwt_token })
})


const passwordReset = asyncWrapper(async (req, res, next) => {
    const { email } = req.body,
        currUser = await User.findOne({ email })
    if (!currUser) { throw new BadRequestError('User does not exist') }

     console.log(currUser)
    const reset_token = Math.floor(100000 + Math.random() * 900000).toString(),
        reset_access_token = await currUser.createResetToken(reset_token);

    await sendMail(new EmailMsg(email, currUser.firstname, reset_token).userPasswordResetVerification())
    return res.status(statusCode.CREATED).send({ message: "Password reset code sent you user email", token: reset_access_token })
})


const confirmResetAndChangePassword = asyncWrapper(async (req, res, next) => {
    const { reset_token, password } = req.body
    if (!reset_token || !password) { throw new BadRequestError("Missing required parameter: Validation failed") }

    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer')) { throw new UnauthorizedError('Authentication invalid') }

    const jwtToken = authHeader.split(' ')[1]
    const payload = decodeJWT(jwtToken)
    console.log(payload)
    const currUserReset = await ResetToken.findOne({ user: payload._id })

    if (!currUserReset) { throw BadRequestError(' Reset token is invalid') }
    if (reset_token != payload.reset_token) { throw new BadRequestError(' Reset token is invalid ') }
    if (reset_token != currUserReset.token) { throw new BadRequestError(' Reset token is invalid ') }

    const hash = await hashString(password)
    console.log(hash)
    
    const password_ = await Password.findOneAndUpdate({ user: payload._id }, { password: hash }, { new: true }).populate('user')
    console.log(password_)
    return res.status(statusCode.OK).send({ message: "Password Reset successful" })
})

module.exports = {
    signup,
    verifyEmail,
    login,
    passwordReset,
    confirmResetAndChangePassword
}