const bcrypt = require('bcrypt');

// Accepts password and returns hashed password
async function hashPassword(password) {
    try {
        return new Promise(async (resolve, reject) => {
            let saltRounds = 10
            await bcrypt.hash(password, saltRounds)
                .then((response) => {
                    if (response) { password = response }
                    else { throw "An error occured" }
                }, (error) => { reject(error) })
            resolve(password)
        })

    } catch (error) {
        console.log(error)
        return error
    }

}

// Checks if password matches saved hash value
async function checkHash(password, hash, _res = null) {
    return await bcrypt.compare(password, hash)
        .then(response => { return response })
}

module.exports = {
    hashPassword,
    checkHash,
};