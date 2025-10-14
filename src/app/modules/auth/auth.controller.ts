import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AuthService } from './auth.service';
import { User } from '../user/user.model';
import AppError from '../../../errors/AppError';
import config from '../../../config';
import passport from 'passport';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { USER_ROLES } from '../../../enums/user';
import verifyEmailOrPhone from '../../../utils/verifyEmailOrPhone';

const login = catchAsync(async (req, res) => {
     const loginData = req.body;
     const { emailOrPhone, password } = loginData;
     const { query } = verifyEmailOrPhone(emailOrPhone);
     // Check if user exists and get their role
     const user = await User.findOne(query).select('+role');
     if (!user) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found!');
     }
     let result;
     if (user.role === USER_ROLES.SUPER_ADMIN) {
          if (!password) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Password is required for super admin!');
          }
          result = await AuthService.loginUserFromDB(loginData);
     } else if (user.role === USER_ROLES.ADMIN) {
          if (!password) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'Password is required for admin!');
          }
          result = await AuthService.loginUserFromDB(loginData);
     } else {
          if (!user.isVerified) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'User not verified!');
          }
          if (user.status === 'blocked') {
               throw new AppError(StatusCodes.BAD_REQUEST, 'This user is blocked!');
          }
          if (user.isDeleted) {
               throw new AppError(StatusCodes.BAD_REQUEST, 'User account is deleted!');
          }
          // Regular user login with OTP
          result = await AuthService.sendOtpToPhone(loginData);
     }

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: user.role === USER_ROLES.SUPER_ADMIN || user.role === USER_ROLES.ADMIN ? 'Login successful' : 'OTP sent to your email successfully',
          data: result,
     });
});
const verifyOtp = catchAsync(async (req, res) => {
     const result = await AuthService.verifyEmailToDB(req.body);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Account verified successfully',
          data: result,
     });
});
// Email/Phone registration
const emailOrPhoneRegistration = catchAsync(async (req, res) => {
     const { emailOrPhone, role } = req.body;
     const result = await AuthService.emailOrPhoneRegistrationToDB(emailOrPhone, role);
     sendResponse(res, {
          statusCode: StatusCodes.CREATED,
          success: true,
          message: result.message,
          data: { phone: result.phone },
     });
});
// resend Otp
const resendOtp = catchAsync(async (req: Request, res: Response) => {
     const { phone } = req.body;
     console.log(phone);
     await AuthService.resendOtpFromDb(phone);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'OTP sent successfully again',
     });
});
const refreshToken = catchAsync(async (req: Request, res: Response) => {
     const { refreshToken } = req.body;
     const result = await AuthService.refreshToken(refreshToken);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Access token retrieved successfully',
          data: result,
     });
});
const forgetPassword = catchAsync(async (req, res) => {
     const result = await AuthService.forgetPasswordToDB(req.body.email);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Reset password link sent to your email successfully',
          data: result,
     });
});
const resetPassword = catchAsync(async (req, res) => {
     const token = req.headers.token as string;
     await AuthService.resetPasswordToDB(token!, req.body);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Password reset successfully',
     });
});
const changePassword = catchAsync(async (req, res) => {
     const user: any = req.user;
     const result = await AuthService.changePasswordToDB(user, req.body);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Password changed successfully',
          data: result,
     });
});


// Social OAuth login
// Google OAuth
const googleAuth = passport.authenticate('google', {
     scope: ['profile', 'email'],
});
const googleAuthCallback = catchAsync(async (req, res) => {
     const user = req.user as any;

     if (!user) {
          return res.redirect(`${config.frontend_url}/login?error=authentication_failed`);
     }

     const jwtPayload = {
          userId: user._id,
          role: user.role,
     };

     const accessToken = jwtHelper.createToken(jwtPayload, config.jwt.jwt_secret as string, config.jwt.jwt_refresh_expire_in as string);

     const refreshToken = jwtHelper.createToken(jwtPayload, config.jwt.jwt_refresh_secret as string, config.jwt.jwt_refresh_expire_in as string);

     res.redirect(`${config.frontend_url}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
});

// Facebook OAuth
const facebookAuth = passport.authenticate('facebook', {
     scope: ['email'],
});
const facebookAuthCallback = catchAsync(async (req: Request, res: Response) => {
     const user = req.user as any;

     if (!user) {
          return res.redirect(`${config.frontend_url}/login?error=authentication_failed`);
     }

     const jwtPayload = {
          userId: user._id,
          role: user.role,
     };

     const accessToken = jwtHelper.createToken(jwtPayload, config.jwt.jwt_secret as string, config.jwt.jwt_refresh_expire_in as string);

     const refreshToken = jwtHelper.createToken(jwtPayload, config.jwt.jwt_refresh_secret as string, config.jwt.jwt_refresh_expire_in as string);

     res.redirect(`${config.frontend_url}/auth/callback?token=${accessToken}&refresh=${refreshToken}`);
});

export const AuthController = {
     login,
     verifyOtp,
     resendOtp,
     emailOrPhoneRegistration,
     forgetPassword,
     resetPassword,
     changePassword,
     refreshToken,
     googleAuth,
     googleAuthCallback,
     facebookAuth,
     facebookAuthCallback,
};
