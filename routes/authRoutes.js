const express = require('express')
const router = express.Router()

const { signup, verifyEmail, login, passwordReset, confirmResetAndChangePassword, googleSignin } = require('../controllers/authController')
const { basicAuth } = require('../middlewares/auth/auth')

router.
    post('/signup', signup).
    post('/verify',verifyEmail).
    post('/login', login).
    post('/googlesignin', googleSignin)

router.
    post('/password/reset', passwordReset).
    put('/password/confirmtoken', basicAuth, confirmResetAndChangePassword)

// Post login routes should require user.isActive

module.exports = router