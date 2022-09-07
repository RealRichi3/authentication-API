const mongoose = require('mongoose'),
    Schema = mongoose.Schema;
const config = process.env

const jwt = require('jsonwebtoken');

const { Status } = require('./accountStatusModel'),
    { Password } = require('./passwordModel'),
    { ResetToken, VerificationToken } = require('./tokenModel');

const options = { toObject: { virtuals: true } }

const endUser = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        refPath: 'role'
    },
    firstname: { type: String, required: [true, "Firstname is required"] },
    lastname: { type: String, required: [true, "Lastname is required"] },
    email: { type: String, unique: true, required: [true, "email is required"] },
    role: { type: String, default: "EndUser" },
}, options, { timestamp: true })

const admin = new Schema({
    firstname: { type: String, required: [true, "Firstname is required"] },
    lastname: { type: String, required: [true, "Lastname is required"] },
    email: { type: String, unique: true, required: [true, "email is required"] },
    role: { type: String, required: [true, "role is required"], default: "admin" }
}, options, { timestamp: true });

const Admin = mongoose.model("Admin", admin),
    EndUser = mongoose.model("EndUser", endUser);


// USER SCHEMA --- start
const userSchema = new Schema({
    firstname: { type: String, required: [true, "Firstname is required"] },
    lastname: { type: String, required: [true, "Lastname is required"] },
    email: { type: String, unique: true, required: [true, "email is required"] },
    address: { type: String },
    role: { type: String, required: [true, "role is required"] }
}, { toObject: { virtuals: true } }, { timestamp: true })
// Schema Custom methods --- start
userSchema.methods.createJWT = function () {
    return jwt.sign({ _id: this._id, name: this.name, email: this.email, role: this.role }, config.JWT_SECRET, { expiresIn: config.JWT_LIFETIME })
}
userSchema.methods.completeSave = async function (data) {
    try {
        const currUserBasedOnRole = {
            "EndUser": EndUser,
            "Admin": Admin
        }
        data.user = this._id
        if (data.role == "EndUser") { data.isActive = true }

        await currUserBasedOnRole[data.role].create(data)   // Creates new document and ref in the corresponding table based on data.role
        await Password.create(data)
        await Status.create(data)
        const ver_token = await VerificationToken.create(data)

        return ver_token.token
    } catch (error) {
        throw error
    }
}
userSchema.methods.createResetToken = async function (reset_token) {
    await ResetToken.findOneAndUpdate({ user: this._id, role: this.role }, { token: reset_token }, { upsert: true }, function (err, doc) {
        if (err) { throw "An error occured" }
    }).clone()
    console.log({
        _id: this._id,
        reset_token,
        email: this.email,
        role: this.role
    })
    return jwt.sign({ _id: this._id, reset_token, email: this.email, role: this.role }, config.JWT_SECRET, { expiresIn: config.JWT_LIFETIME })
}
// end --- Schema Custom methods
// Mongoose Virtuals --- start
userSchema.virtual('status', {
    ref: "Status",
    localField: "_id",
    foreignField: "user",
    justOne: true
})
userSchema.virtual('verification_token', {
    ref: "VerificationToken",
    localField: "_id",
    foreignField: "user",
    justOne: true
})
userSchema.virtual('reset_token', {
    ref: "ResetToken",
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
    User,
    Admin,
    EndUser
};