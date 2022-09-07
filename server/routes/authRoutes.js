const express = require('express')
const router = express.Router()

const { signup, verifyEmail, login, passwordReset, confirmResetAndChangePassword } = require('../controllers/authController')

router.post('/signup', signup).
    post('/verify', verifyEmail).
    post('/login', login)

router.
    post('/password/reset', passwordReset).
    put('/password/confirmtoken', confirmResetAndChangePassword)

// Post login routes should require user.isActive

module.exports = router