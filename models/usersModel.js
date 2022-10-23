const mongoose = require('mongoose'),
    Schema = mongoose.Schema;

const jwt = require('jsonwebtoken');
const { Status } = require('./accountStatusModel');
const { Password } = require('./passwordModel');
const { Token } = require('./tokenModel');
const config = process.env

const options = { toObject: { virtuals: true } }

// USER SCHEMA --- start
const userSchema = new Schema({
    firstname: { type: String, required: [true, "Firstname is required"] },
    lastname: { type: String, required: [true, "Lastname is required"] },
    email: { type: String, unique: true, required: [true, "email is required"] },
    phonenumber: { type: String },
    address: { type: String },
    role: { type: String, required: [true, "role is required"], enum: ['EndUser', "SuperAdmin"] }
}, { toObject: { virtuals: true } }, { timestamp: true })


userSchema.pre('save', async function (next) {
    // console.log(this)
})
userSchema.methods.completeSave = async function (data) {
    try {
        const client = mongoose.connection

        data.user = this._id
        if (data.role == "EndUser") { data.isActive = true }


        const session = await client.startSession()
        session.startTransaction()
        await Password.create([data], { session })
        await Status.create([data], { session })
        const ver_token = await Token.create([data], { session })

        await session.commitTransaction()
        session.endSession()

        return ver_token[0].verification
    } catch (error) {
        await session.abortTransaction()
        session.endSession()
        throw error
    }
}
// end --- Schema Custom methods

// Mongoose Virtuals --- start
userSchema.virtual('status', {
    ref: "Status",
    localField: "_id",
    foreignField: "user",
    justOne: true
})
userSchema.virtual('token', {
    ref: "Token",
    localField: "_id",
    foreignField: "user",
    justOne: true
})
userSchema.virtual('password', {
    ref: "Password",
    localField: "_id",
    foreignField: "user",
    justOne: true
})
// end --- Mongoose Virtuals

const User = mongoose.model('User', userSchema)

// end --- USER SCHEMA


module.exports = {
    User
};