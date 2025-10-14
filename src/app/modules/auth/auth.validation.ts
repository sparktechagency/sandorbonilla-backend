import { z } from 'zod';

const createVerifyEmailZodSchema = z.object({
     body: z.object({
          phone: z.string({ required_error: 'phone is required' }),
          oneTimeCode: z.number({ required_error: 'One time code is required' }),
     }),
});

const createLoginZodSchema = z.object({
     body: z.object({
          phone: z.string({ required_error: 'phone is required' }),
          password: z.string().optional(), // Optional for users, required for superadmin
     }),
});

const createForgetPasswordZodSchema = z.object({
     body: z.object({
          phone: z.string({ required_error: 'phone is required' }),
     }),
});

const resendOtpValidation = z.object({
     body: z.object({
          phone: z.string({ required_error: 'phone is required' }),
     }),
});

const createResetPasswordZodSchema = z.object({
     body: z.object({
          newPassword: z.string({ required_error: 'New password is required' }).min(8, 'Password must be at least 8 characters'),
          confirmPassword: z.string({ required_error: 'Confirm password is required' }),
     }),
});

const createChangePasswordZodSchema = z.object({
     body: z.object({
          currentPassword: z.string({ required_error: 'Current password is required' }),
          newPassword: z.string({ required_error: 'New password is required' }).min(8, 'Password must be at least 8 characters'),
          confirmPassword: z.string({ required_error: 'Confirm password is required' }),
     }),
});

const createEmailOrPhoneRegistrationZodSchema = z.object({
     body: z.object({
          emailOrPhone: z.string({ required_error: 'Email or phone is required' }),
     }),
});

const completeProfileZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
          phone: z.string().optional(),
          age: z.number().optional(),
          gender: z.enum(['male', 'female', 'other']).optional(),
     }),
});

export const AuthValidation = {
     createVerifyEmailZodSchema,
     createLoginZodSchema,
     createForgetPasswordZodSchema,
     createResetPasswordZodSchema,
     createChangePasswordZodSchema,
     resendOtpValidation,
     createEmailOrPhoneRegistrationZodSchema,
     completeProfileZodSchema,
};
