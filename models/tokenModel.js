const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const randomToken = require('random-token')

const resetToken = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        refPath: 'role'
    },
    role: {
        type: String,
        required: true,
        enum: ["Admin", "EndUser"]
    },
    token: { type: String, default: randomToken(16) },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamp: true })

const verificationToken = new Schema({
    role: {
        type: String,
        required: true,
        enum: ["Admin", "EndUser"]
    },
    user: {
        type: mongoose.Types.ObjectId,
        refPath: 'role'
    },
    token: { type: String, default: `${Math.floor(100000 + Math.random() * 900000)}` },
    createdAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamp: true })

const ResetToken = mongoose.model("ResetToken", resetToken)
const VerificationToken = mongoose.model('VerificationToken', verificationToken)

module.exports = {
    ResetToken,
    VerificationToken
}