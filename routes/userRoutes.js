const express = require('express');
const router = express.Router();
const permit = require('../middlewares/auth/permissions');

const {
    getUsers,
    getLoggedUserData,
    updateUserData,
    getInactiveUserAccounts,
    activateUserAccount,
    deactivateUserAccount,
    addNewUser
} = require('../controllers/userController.js');

router
    .get('/inactiveaccounts', getInactiveUserAccounts)
    .post('/activateuser', activateUserAccount)
    .post('/deactivateuser', deactivateUserAccount)
    .post('/newuser', addNewUser)
    .get('/loggedin', getLoggedUserData)
    .patch('/update', updateUserData)
    .get('/:role', permit('SuperAdmin Founder'), getUsers)

module.exports = router;
