const express = require('express')
const router = express.Router


router.
    post('/signup').
    post('/login').
    post('/passwordreset').
    post('/confirmreset')

module.exports = router