import { Router } from 'express';
import {
    resendVerificationEmail, userSignup,
    verifyUserEmail, forgotPassword,
    resetPassword,
    logout,
    login,
    activateUserAccount,
    deactivateUserAccount
} from '../controllers/auth.controller';
import {
    requestSuperAdminAccountActivation,
    requestSuperAdminAccountDeactivation,
    activateSuperAdminAccount,
    deactivateSuperAdminAccount,
} from '../controllers/su_auth.controller'
import { basicAuth, withAuthentication } from '../middlewares/auth';
import schemaValidator from '../middlewares/router_schema_validator';
import permit from '../middlewares/rbac_handler'
import * as schema from '../types/routerschemas';

const router = Router();

router
    .get('/authtoken', basicAuth())
    .post('/signup', schemaValidator(schema.userSignup), userSignup)
    .get(
        '/verificationemail',
        schemaValidator(schema.resendVerificationEmail),
        resendVerificationEmail
    )
    .post(
        '/verifyemail/',
        schemaValidator(schema.verifyUserEmail),
        basicAuth('verification'),
        withAuthentication(verifyUserEmail)
    )
    .post('/forgotpassword', forgotPassword)
    .patch(
        '/resetpassword',
        basicAuth('password_reset'),
        withAuthentication(resetPassword))
    .post('/login', login)
    .post(
        '/logout',
        basicAuth(undefined),
        withAuthentication(logout))
    .post(
        '/user/activate',
        basicAuth(),
        permit(['SuperAdmin']),
        withAuthentication(activateUserAccount))
    .post(
        '/user/deactivate',
        basicAuth(),
        permit(['SuperAdmin']),
        withAuthentication(deactivateUserAccount))
    .post('/isloggedin', basicAuth())
    .get('/user', basicAuth())

// router.use(permit(['SuperAdmin']))
router
    .get('/su/requestactivation', requestSuperAdminAccountActivation)
    .post(
        '/su/activate',
        basicAuth('su_activation'),
        withAuthentication(activateSuperAdminAccount))
    .get('/su/requestdeactivation', requestSuperAdminAccountDeactivation)
    .post(
        '/su/deactivate',
        basicAuth('su_deactivation'),
        withAuthentication(deactivateSuperAdminAccount)
    );

export default router;
