
class CustomAPIError extends Error{
    constructor (message) {
        super(message)
    }
}

class UnauthorizedError extends CustomAPIError {
    constructor (message){
        super(message)
        this.statuscode = 401        
    }
}

class BadRequestError extends CustomAPIError {
    constructor (message) {
        super(message)
        this.statuscode = 400
    }
}


module.exports = {
    UnauthorizedError,
    BadRequestError,
    CustomAPIError
}