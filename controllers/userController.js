
const _ = require('lodash')
const mongoose = require('mongoose')

// Models
const { Status } = require('../models/accountStatusModel');
const { User } = require('../models/usersModel');

// Middlewares
const asyncWrapper = require('../middlewares/asyncWrapper'),
    { CustomAPIError, createCustomError, BadRequestError, UnauthorizedError } = require('../middlewares/customError');

// Utilities
const { statusCode } = require('./utils/statusCode')


const client = mongoose.connection

const getInactiveUserAccounts = asyncWrapper(async (req, res, next) => {
    const response = []
    const inactiveUsers = await Status.find({ isActive: false }).populate('user')
    inactiveUsers.forEach(inactiveUser => {
        response.push({
            firstname: inactiveUser.user.firstname,
            lastname: inactiveUser.user.lastname,
            email: inactiveUser.user.email,
            role: inactiveUser.role,
            isActive: inactiveUser.isActive,
            isVerified: inactiveUser.isVerified
        })
    })
    return res.status(statusCode.OK).send({ message: "Success", response })
})

const activateUserAccount = asyncWrapper(async (req, res, next) => {
    const currUser = await User.findOne({ email: req.body.email })

    if (currUser.role == "SuperAdmin") { throw new BadRequestError('Unauthorised access') }
    await Status.findOneAndUpdate({ user: currUser._id }, { isActive: true }, { new: true })

    return res.status(statusCode.OK).send({ message: "Success" })
})

const deactivateUserAccount = asyncWrapper(async (req, res, next) => {
    const currUser = await User.findOne({ email: req.body.email })
    if (!currUser){ throw new BadRequestError('User Account does not exist')}
    if (currUser.role == "SuperAdmin") { throw new BadRequestError("Unauthorised access") }
    await Status.findOneAndUpdate({ user: currUser._id }, { isActive: false }, { new: true })

    return res.status(statusCode.OK).send({ message: "Success" })
})


/* ADD NEW USERS MANUALLY - Requires an existing ADMIN (Founder, SuperAdmin)
    SuperAdmin-> Can add all users
    Founder -> Can add all users except SuperAdmin
*/
const addNewUser = asyncWrapper(async (req, res, next) => {
    const { firstname, lastname, email, password, phonenumber, role } = req.body

    if (role == "SuperAdmin") { throw new BadRequestError('Unauthorised access') }

    const session = await client.startSession()
    await session.withTransaction(async () => {
        const newAdmin = await User.create([{ firstname, lastname, email, password, phonenumber, role }], {session});
        await newAdmin[0].completeSave({ firstname, lastname, email, password, phonenumber, role, isActive: true})
    })
    session.endSession()

    return res.status(201).send({ user: { firstname, lastname } })
})

const getUsers = asyncWrapper(async (req, res, next) => {
    if (!req.params.role) { throw new BadRequestError('Role is required') }
    const role = req.params.role

    let filter = {}
    if(!role) {filter = {}}
    filter = {role: role}

    const users = await User.find(filter).populate('status')

    const response = []
    users.forEach(user => {
        if(user.role == "SuperAdmin") return
        response.push({
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            role: user.role,
            isActive: user.status.isActive,
            isVerified: user.status.isVerified
        })
    })

    return res.status(statusCode.OK).send({ message: "Success", users })
})

const getLoggedUserData = asyncWrapper(async (req, res, next) => {
    const user = await User.findOne({ _id: req.body.bearer._id });
    return res.status(200).send({
        message: 'success',
        user: {
            firstname: user.firstname,
            lastname: user.lastname,
            email: user.email,
            phone_number: user.phonenumber,
            address: user.address
        }
    });
});

const updateUserData = asyncWrapper(async (req, res, next) => {
    const { phonenumber, firstname, lastname, address } = req.body;
    const user = await User.findByIdAndUpdate(
        { _id: req.body.bearer._id },
        { phone_number, firstname, lastname, address },
        { new: true }
    );
    if (!user) {
        throw new BadRequestError('User does not exist');
    }
    return res.status(200).send({ message: 'success' });
});

module.exports = {
    getLoggedUserData,
    updateUserData,
    addNewUser,
    activateUserAccount,
    deactivateUserAccount,
    getInactiveUserAccounts,
    getUsers
}




