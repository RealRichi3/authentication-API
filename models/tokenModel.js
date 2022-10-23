const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const config = process.env;

const token = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        role: {
            type: String,
            required: true,
            enum: [
                'SuperAdmin',
                'EndUser'
            ]
        },
        password_reset: { type: String, default: null },
        verification: {
            type: String,
            default: `${Math.floor(100000 + Math.random() * 900000)}`
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { timestamp: true }
);

const blacklisted_tokens = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        tokens: [{ type: String }]
    },
    {
        createdAt: {
            type: Date,
            expires: config.JWT_REFRESH_EXP || '5d',
            default: Date.now
        }
    }
);
const Token = mongoose.model('Token', token),
    BlacklistedTokens = mongoose.model('BlacklistedTokens', blacklisted_tokens)

module.exports = {
    Token,
    BlacklistedTokens
};
