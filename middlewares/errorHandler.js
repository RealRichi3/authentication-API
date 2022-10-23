const { CustomAPIError } = require('./customError');
const mongoose = require('mongoose');
const ValidationError = mongoose.Error.ValidationError;
const ValidatorError = mongoose.Error.ValidatorError;

const errorHandler = (err, req, res, next) => {
    // console.log(err)

    if (process.env.NODE_ENV != "test"){ console.log(err)}
    if (err instanceof CustomAPIError) {
        return res.status(err.statusCode).send({ message: err.message })
    }
    if (err instanceof ValidationError) {
        return res.status(400).send({ message: err.message })
    }
    if (err instanceof ValidatorError) {
        return res.status(400).send({ message: err.message })
    }
    if (err.name === 'MongoServerError' && err.code === 11000) {
        return res.status(400).send({ message: "User already exists" })
    }

    return res.status(500).send({ message: "An error occured" })
}


module.exports = errorHandler