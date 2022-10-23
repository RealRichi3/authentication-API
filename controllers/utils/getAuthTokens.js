const jwt = require('jsonwebtoken');
const { Token } = require('../../models/tokenModel');
const { decodeJWT } = require('./jwt');
const config = process.env;

// --- HELPERS
const getAuthTokens = async (user_id) => {
    try {
        const currUser = await Token.findOne({ user: user_id }).populate(
            'user'
        );
        // console.log(currUser)
        if (!currUser) {
            throw 'User does not exist';
        }
        const data = {
            _id: currUser.user._id,
            email: currUser.user.email,
            role: currUser.user.role,
            reset_token: currUser.password_reset
        };

        const access_token = jwt.sign(data, config.JWT_SECRET_ACCESS, {
                expiresIn: config.JWT_ACCESS_EXP
            }),
            refresh_token = jwt.sign(data, config.JWT_SECRET_REFRESH, {
                expiresIn: config.JWT_REFRESH_EXP
            });

        return { refresh_token, access_token };
    } catch (error) {
        throw error;
    }
};
module.exports = { getAuthTokens };
