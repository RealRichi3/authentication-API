const asyncWrapper = require('../asyncWrapper');
const { UnauthorizedError } = require('../../middlewares/customError');
const { decodeJWT } = require('../../controllers/utils/jwt');

module.exports = function (roles) {
    return asyncWrapper(async (req, res, next) => {
        const allowed_roles = roles.split(' ')
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer')) {
            throw new UnauthorizedError('Authentication required');
        }

        const jwtToken = authHeader.split(' ')[1],
            payload = decodeJWT(jwtToken);
            // console.log(allowed_roles)
            // console.log(allowed_roles.includes(payload.role))

        if (!allowed_roles.includes(payload.role)) {
            throw new UnauthorizedError('Unauthorized access');
        }

        next();
    });
};
