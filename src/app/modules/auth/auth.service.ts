import bcrypt from 'bcrypt';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload, Secret } from 'jsonwebtoken';
import config from '../../../config';
import { emailHelper } from '../../../helpers/emailHelper';
import { jwtHelper } from '../../../helpers/jwtHelper';
import { emailTemplate } from '../../../shared/emailTemplate';
import { IAuthResetPassword, IChangePassword, ILoginData, IVerifyEmail } from '../../../types/auth';
import { ResetToken } from '../resetToken/resetToken.model';
import { User } from '../user/user.model';
import AppError from '../../../errors/AppError';
import generateOTP from '../../../utils/generateOTP';
import cryptoToken from '../../../utils/cryptoToken';
import { verifyToken } from '../../../utils/verifyToken';
import { USER_ROLES } from '../../../enums/user';
import { generateRegistrationNumber } from '../../../utils/generateUniqueNumber';

//login
const loginUserFromDB = async (payload: ILoginData) => {
     const { email, password } = payload;

     const isExistUser = await User.findOne({ email }).select('+password +role');
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     // Only super admin can login with password
     if (isExistUser.role !== USER_ROLES.SUPER_ADMIN) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Password login is only available for super admin!');
     }

     if (!password) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Password is required!');
     }

     //check verified and status
     if (!isExistUser.isVerified) {
          throw new AppError(StatusCodes.CONFLICT, 'Please verify your account first');
     }

     //check user status
     if (isExistUser?.status === 'blocked') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'You do not have permission to access this content. It looks like your account has been blocked.');
     }

     //check match password
     if (!(await User.isMatchPassword(password, isExistUser.password || ''))) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Password is incorrect!');
     }

     const jwtData = { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email };
     //create token
     const accessToken = jwtHelper.createToken(jwtData, config.jwt.jwt_secret as Secret, config.jwt.jwt_expire_in as string);
     const refreshToken = jwtHelper.createToken(jwtData, config.jwt.jwt_refresh_secret as string, config.jwt.jwt_refresh_expire_in as string);

     return { accessToken, refreshToken };
};

// OAuth login (Google/Facebook)
const oauthLoginToDB = async (profile: any, provider: 'google' | 'facebook') => {
     const { id, emails, displayName, photos } = profile;
     const email = emails[0]?.value;

     if (!email) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Email not provided by OAuth provider');
     }

     // Check if user already exists
     let user = await User.findOne({ email }).select('+role');

     if (!user) {
          // Create new user for OAuth
          const userData = {
               name: displayName,
               email,
               role: USER_ROLES.USER,
               isVerified: true,
               oauthProvider: provider,
               ...(provider === 'google' && { googleId: id }),
               ...(provider === 'facebook' && { facebookId: id }),
               ...(photos && photos[0] && { image: [photos[0].value] }),
          };

          user = await User.create(userData);
     } else {
          // Update existing user with OAuth info if not already set
          if (!user.oauthProvider) {
               user.oauthProvider = provider;
               user.isVerified = true;
               if (provider === 'google') user.googleId = id;
               if (provider === 'facebook') user.facebookId = id;
               await user.save();
          }
     }

     return user;
};

// Email-only registration
const emailOnlyRegistrationToDB = async (email: string, role: USER_ROLES) => {
     if (role === USER_ROLES.SUPER_ADMIN) {
          role = USER_ROLES.USER
     }

     const existingUser = await User.findOne({ email });
     const registrationNo = await generateRegistrationNumber("REG#");
     let newUser;
     if (existingUser) {
          if (!existingUser.isVerified) {
               newUser = existingUser;
          } else {
               throw new AppError(StatusCodes.BAD_REQUEST, 'User already exists and is verified!');
          }
     } else {
          const userData = {
               email,
               role,
               isVerified: false,
               registrationNo: registrationNo.toUpperCase(),
          };
          try {
               newUser = await User.create(userData);
          } catch (error: any) {
               if (error.code === 11000) {
                    throw new AppError(StatusCodes.BAD_REQUEST, 'User already exists with this email!');
               }
               throw error;
          }
     }
     const otp = generateOTP(5);
     const otpExpireTime = new Date(Date.now() + 3 * 60 * 1000);
     const authentication = {
          oneTimeCode: otp,
          expireAt: otpExpireTime,
     };
     newUser.authentication = { isResetPassword: false, ...authentication };
     await newUser.save();
     const values = {
          name: `${newUser.email.split('@')[0]}`,
          otp: otp,
          email,
     };
     const createAccountTemplate = emailTemplate.createAccount(values);

     // Send email in background without waiting
     emailHelper.sendEmail(createAccountTemplate).catch((error) => {
          console.error('Email sending failed:', error);
     });
     const message = existingUser && !existingUser.isVerified ? 'OTP resent! Please check your email for verification.' : 'Registration successful! Please check your email for OTP verification.';

     return {
          message,
          email,
     };
};

//forget password
const forgetPasswordToDB = async (email: string) => {
     const isExistUser = await User.isExistUserByEmail(email);
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     //send mail
     const otp = generateOTP(5);
     const value = { otp, email: isExistUser.email };
     const forgetPassword = emailTemplate.resetPassword(value);
     emailHelper.sendEmail(forgetPassword);

     //save to DB
     const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 3 * 60000) };
     await User.findOneAndUpdate({ email }, { $set: { authentication } });
};
// resend otp
const resendOtpFromDb = async (email: string) => {
     // Check if the user exists
     const isExistUser = await User.isExistUserByEmail(email);

     console.log(isExistUser);
     if (!isExistUser || !isExistUser._id) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     // send email
     const otp = generateOTP(5);
     const values = { name: isExistUser.name, otp: otp, email: isExistUser.email! };
     const createAccountTemplate = emailTemplate.createAccount(values);
     emailHelper.sendEmail(createAccountTemplate);
     console.log(otp);
     //save to DB
     const authentication = { oneTimeCode: otp, expireAt: new Date(Date.now() + 3 * 60000) };
     await User.findOneAndUpdate({ _id: isExistUser._id }, { $set: { authentication } });
};

//verify email
const verifyEmailToDB = async (payload: IVerifyEmail) => {
     const { email, oneTimeCode } = payload;
     const isExistUser = await User.findOne({ email }).select('+authentication');
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     if (!oneTimeCode) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Please give the otp, check your email we send a code');
     }

     if (isExistUser.authentication?.oneTimeCode !== oneTimeCode) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'You provided wrong otp');
     }

     const date = new Date();
     if (date > isExistUser.authentication?.expireAt) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Otp already expired, Please try again');
     }

     let message;
     let verifyToken;
     let accessToken;
     let refreshToken;
     if (!isExistUser.isVerified) {
          await User.findOneAndUpdate({ _id: isExistUser._id }, { isVerified: true, authentication: { oneTimeCode: null, expireAt: null } });
          //create token
          accessToken = jwtHelper.createToken({ id: isExistUser._id, role: isExistUser.role, email: isExistUser.email }, config.jwt.jwt_secret as Secret, config.jwt.jwt_expire_in as string);
          refreshToken = jwtHelper.createToken(
               { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
               config.jwt.jwt_refresh_secret as string,
               config.jwt.jwt_refresh_expire_in as string,
          );
          message = 'Email verify successfully';
     } else if (isExistUser.isVerified && isExistUser.role !== USER_ROLES.SUPER_ADMIN) {
          accessToken = jwtHelper.createToken({ id: isExistUser._id, role: isExistUser.role, email: isExistUser.email }, config.jwt.jwt_secret as Secret, config.jwt.jwt_expire_in as string);
          refreshToken = jwtHelper.createToken(
               { id: isExistUser._id, role: isExistUser.role, email: isExistUser.email },
               config.jwt.jwt_refresh_secret as string,
               config.jwt.jwt_refresh_expire_in as string,
          );
          message = 'Login successfully';
     }

     if (isExistUser.role === USER_ROLES.SUPER_ADMIN) {
          await User.findOneAndUpdate({ _id: isExistUser._id }, { authentication: { isResetPassword: true, oneTimeCode: null, expireAt: null } });
          //create token ;
          const createToken = cryptoToken();
          await ResetToken.create({ user: isExistUser._id, token: createToken, expireAt: new Date(Date.now() + 5 * 60000) });
          message = 'Verification Successful: Please securely store and utilize this code for reset password';
          verifyToken = createToken;
     }
     return { verifyToken, message, accessToken, refreshToken };
};

//reset password
const resetPasswordToDB = async (token: string, payload: IAuthResetPassword) => {
     const { newPassword, confirmPassword } = payload;
     //isExist token
     const isExistToken = await ResetToken.isExistToken(token);
     if (!isExistToken) {
          throw new AppError(StatusCodes.UNAUTHORIZED, 'You are not authorized');
     }

     //user permission check
     const isExistUser = await User.findById(isExistToken.user).select('+authentication');
     if (!('isResetPassword' in (isExistUser?.authentication || {}))) {
          throw new AppError(StatusCodes.UNAUTHORIZED, "You don't have permission to change the password. Please click again to 'Forgot Password'");
     }

     //validity check
     const isValid = await ResetToken.isExpireToken(token);
     if (!isValid) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Token expired, Please click again to the forget password');
     }

     //check password
     if (newPassword !== confirmPassword) {
          throw new AppError(StatusCodes.BAD_REQUEST, "New password and Confirm password doesn't match!");
     }

     const hashPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

     const updateData = { password: hashPassword, authentication: { isResetPassword: false } };

     await User.findOneAndUpdate({ _id: isExistToken.user }, updateData, { new: true });
};

const changePasswordToDB = async (user: JwtPayload, payload: IChangePassword) => {
     const { currentPassword, newPassword, confirmPassword } = payload;
     const isExistUser = await User.findById(user.id).select('+password');
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     //current password match
     if (currentPassword && !(await User.isMatchPassword(currentPassword, isExistUser.password || ''))) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Password is incorrect');
     }

     //newPassword and current password
     if (currentPassword === newPassword) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Please give different password from current password');
     }
     //new password and confirm password check
     if (newPassword !== confirmPassword) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Password and Confirm password doesn't matched");
     }

     //hash password
     const hashPassword = await bcrypt.hash(newPassword, Number(config.bcrypt_salt_rounds));

     const updateData = { password: hashPassword };
     const result = await User.findOneAndUpdate({ _id: user.id }, updateData, { new: true });
     return result;
};
// Refresh token
const refreshToken = async (token: string) => {
     if (!token) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Token not found');
     }

     const decoded = verifyToken(token, config.jwt.jwt_refresh_expire_in as string);

     const { id } = decoded;

     const activeUser = await User.findById(id);
     if (!activeUser) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     if (activeUser.status !== 'active') {
          throw new AppError(StatusCodes.FORBIDDEN, 'User account is inactive');
     }
     if (!activeUser.isVerified) {
          throw new AppError(StatusCodes.FORBIDDEN, 'User account is not verified');
     }
     if (activeUser.isDeleted) {
          throw new AppError(StatusCodes.FORBIDDEN, 'User account is deleted');
     }

     const jwtPayload = { id: activeUser?._id?.toString() as string, role: activeUser?.role, email: activeUser.email };

     const accessToken = jwtHelper.createToken(jwtPayload, config.jwt.jwt_secret as Secret, config.jwt.jwt_expire_in as string);

     return { accessToken };
};

// Send OTP to email for regular users
const sendOtpToEmail = async (payload: { email: string }) => {
     const { email } = payload;

     const isExistUser = await User.findOne({ email });
     if (!isExistUser) {
          throw new AppError(StatusCodes.BAD_REQUEST, "User doesn't exist!");
     }

     // Only regular users can use OTP login
     if (isExistUser.role === USER_ROLES.SUPER_ADMIN) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Super admin must login with password!');
     }

     // Generate and send OTP
     const otp = generateOTP(5);
     const value = { otp, email: isExistUser.email, name: `${isExistUser.firstName} ${isExistUser.lastName}` };
     const otpTemplate = emailTemplate.verifyOtpTemplate(value);
     emailHelper.sendEmail(otpTemplate);

     // Save OTP to database
     const authentication = {
          oneTimeCode: otp,
          expireAt: new Date(Date.now() + 3 * 60000), // 3 minutes
     };
     await User.findOneAndUpdate({ email }, { $set: { authentication } });

     return { message: 'OTP sent successfully' };
};

export const AuthService = {
     verifyEmailToDB,
     loginUserFromDB,
     oauthLoginToDB,
     sendOtpToEmail,
     emailOnlyRegistrationToDB,
     forgetPasswordToDB,
     resendOtpFromDb,
     resetPasswordToDB,
     changePasswordToDB,
     refreshToken,
};
