import { Router } from 'express';
import {
    changePassword,
    forgotPasswordRequest,
    getCurrentUser,
    login,
    logout,
    refreshAccessToken,
    registerUser,
    resendEmailVerification,
    resetPasswordRequest,
    verifyEmail,
} from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import {
    changePasswordValidator,
    forgotPasswordValidator,
    loginValidator,
    registerValidator,
    resetPasswordRequestValidator,
} from '../validators/auth.validator.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';

const router = Router();

//unsecure routes
router.route('/register').post(registerValidator(), validate, registerUser);
router.route('/login').post(loginValidator(), validate, login);
router.route('/refresh-token').post(refreshAccessToken);
router.route('/verify-email/:verificationToken').get(verifyEmail);
router
    .route('/forgot-password')
    .post(forgotPasswordValidator(), validate, forgotPasswordRequest);
router
    .route('/reset-password/:resetToken')
    .post(resetPasswordRequestValidator(), validate, resetPasswordRequest);

// secure routes
router.route('/logout').post(verifyJWT, logout);
router.route('/current-user').get(verifyJWT, getCurrentUser);
router
    .route('/resend-email-verification')
    .post(verifyJWT, resendEmailVerification);
router
    .route('/change-password')
    .post(verifyJWT, changePasswordValidator(), validate, changePassword);

export default router;
