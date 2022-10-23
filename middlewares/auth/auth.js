const jwt = require('jsonwebtoken');

const asyncWrapper = require('../asyncWrapper'),
    { UnauthorizedError, BadRequestError } = require('../customError');

const { decodeJWT } = require('../../controllers/utils/jwt'),
    { getAuthTokens } = require('../../controllers/utils/getAuthTokens');

const config = process.env;

const { User } = require('../../models/usersModel'),
    { Token, BlacklistedTokens } = require('../../models/tokenModel');

const basicAuth = asyncWrapper(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer')) {
        throw new UnauthorizedError('Authentication required');
    }
    const jwtToken = authHeader.split(' ')[1],
        payload = decodeJWT(jwtToken);
    req.body.bearer = payload;

    // Check if access token has beeb blaocklisted
    const blacklisted = await BlacklistedTokens.findOne({ user: payload._id });
    
    if (blacklisted && blacklisted.tokens.includes(jwtToken)) {
        throw new UnauthorizedError('JWT token expired ');
    }

    // To get new access token
    if (req.method == 'GET' && req.path == '/authtoken') {
        const new_access_token = (await getAuthTokens(payload._id)).access_token;

        return res
            .status(200)
            .send({ message: 'success', access_token: new_access_token });
    }

    const currUser = await User.findOne({
        _id: payload._id,
        role: payload.role
    }).populate('status');
    if (!currUser || !currUser.status.isActive || !currUser.status.isVerified) {
        throw new UnauthorizedError('Unauthorized access');
    }

    next();
});

module.exports = {
    basicAuth
};
