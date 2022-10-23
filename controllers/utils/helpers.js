const { sendMail } = require('./mailer'),
    { EmailMsg } = require('./messageTemplates'),
    config = process.env;

const mailActivationCodes = async (token_1, token_2, usertoken, useremail, userfirstname) => {
    try {
        sendMail(new EmailMsg(config.ADMIN_EMAIL_1, "Boayant Admin", token_1).superAdminAccVerification())
        sendMail(new EmailMsg(config.ADMIN_EMAIL_2, "Boayant Admin", token_2).superAdminAccVerification())
        sendMail(new EmailMsg(useremail, userfirstname, usertoken).userAccountVerification())
        return
    } catch (error) {
        throw error
    }
}

const mailPasswordResetToken = async (token_1, token_2, usertoken, useremail, userfirstname) => {
    try {
        sendMail(new EmailMsg(config.ADMIN_EMAIL_1, "Boayant Admin", token_1).superAdminPasswordResetVerification())
        sendMail(new EmailMsg(config.ADMIN_EMAIL_2, "Boayant Admin", token_2).superAdminPasswordResetVerification())
        sendMail(new EmailMsg(useremail, userfirstname, usertoken).passwordReset())
        return
    } catch (error) {
        throw error
    }
}


const generateActivationCodes = () => {
    return {
        head_token_1: Math.floor(100000 + Math.random() * 900000).toString(),
        head_token_2: Math.floor(100000 + Math.random() * 900000).toString(),
        user_token: Math.floor(100000 + Math.random() * 900000).toString()
    }
}

module.exports = {
    mailActivationCodes,
    mailPasswordResetToken,
    generateActivationCodes
}