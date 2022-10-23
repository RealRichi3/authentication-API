const _ = require('lodash')

const project_name = "Company X"
class EmailMsg {
    constructor(email, name, token = ''){
        this.name = name
        this.email = email
        this.token = token
    }
    
    adminAccVerification() {
        return {
            email: this.email,
            title: `${project_name} - New Super Admin Account verification`,
            message: `
                Hi ${_.camelCase(this.name)},

                A new signup for a Super admin to the web app has been requested,
                
                Your one time verification code is ${this.token},
            
                `
        }
    }
    adminPasswordResetVerification(){
        return {
            email: this.email,
            title: `${project_name} - New Super Admin Account verification`,
            message: `
            Hi  ${_.camelCase(this.name)},

            A password reset request was initiated for a super admin account

            Your temporary password reset token is ${this.token},
                `
        }
    }
    userPasswordResetVerification () {
        return {
            email: this.email,
            title: `${project_name} - Account password reset confirmation`,
            message: `
                Hi ${_.camelCase(this.name)},
                You requested for a password reset.
                Your one time reset code is ${this.token},
            
                `
        }
    }
    userAccountVerification () {
        return {
            email: this.email,
            title: ` ${project_name}- New Account Verification`,
            message: `
                Hi ${_.camelCase(this.name)},
                Your one time verification code is ${this.token},
            
                `
        }
    }
}


module.exports = {
    EmailMsg
}