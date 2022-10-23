const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../../middlewares/customError');
const config = process.env;

const decodeJWT = (jwtToken) => {
    try {
        let access;
        try {
            access = jwt.verify(jwtToken, config.JWT_SECRET_ACCESS);
            return access
        } catch (error) {
            if (error.message == 'invalid signature') {
                return jwt.verify(jwtToken, config.JWT_SECRET_REFRESH);
            }
            throw error
        }
    } catch (error) {
        // console.log(error);
        throw new UnauthorizedError('JWT Token expired')
    }
};

module.exports = {
    decodeJWT
};
