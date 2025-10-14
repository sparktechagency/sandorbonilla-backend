import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { AuthController } from './auth.controller';
import { AuthValidation } from './auth.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
const router = express.Router();

// Email/Phone registration
router.post('/register', validateRequest(AuthValidation.createEmailOrPhoneRegistrationZodSchema), AuthController.emailOrPhoneRegistration);
router.post('/login', validateRequest(AuthValidation.createLoginZodSchema), AuthController.login);
router.post('/verify-otp', validateRequest(AuthValidation.createVerifyEmailZodSchema), AuthController.verifyOtp);
router.post('/resend-otp', AuthController.resendOtp);

// Super admin password-based routes
router.post('/forget-password', validateRequest(AuthValidation.createForgetPasswordZodSchema), AuthController.forgetPassword);
router.post('/reset-password', validateRequest(AuthValidation.createResetPasswordZodSchema), AuthController.resetPassword);
router.post('/change-password', auth(USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SUPER_ADMIN), validateRequest(AuthValidation.createChangePasswordZodSchema), AuthController.changePassword);

// Refresh token route
router.post('/refresh-token', AuthController.refreshToken);

// Google OAuth routes
router.get('/google', AuthController.googleAuth);
router.get('/google/callback', AuthController.googleAuthCallback);

// Facebook OAuth routes
router.get('/facebook', AuthController.facebookAuth);
router.get('/facebook/callback', AuthController.facebookAuthCallback);

export const AuthRouter = router;
