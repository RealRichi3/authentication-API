const express = require('express')
const router = express.Router()

const { login, signup, activateNewSuperAdminAcc, passwordReset, confirmResetAndChangePassword } = require('../controllers/superAdminAuthController');
const { basicAuth } = require('../middlewares/auth/auth');

// Super Admin Auth route
router.
    post('/signup', signup).   // should be highly secured
    post('/activate', activateNewSuperAdminAcc).
    post('/login', login).
    post('/password/reset', passwordReset).
    put('/password/confirmtoken', basicAuth, confirmResetAndChangePassword)

module.exports = router;