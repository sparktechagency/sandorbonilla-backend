import { z } from 'zod';

const createAdminZodSchema = z.object({
     body: z.object({
          firstName: z.string({ required_error: 'First name is required' }),
          lastName: z.string({ required_error: 'Last name is required' }),
          email: z.string({ required_error: 'Email is required' }),
          password: z.string({ required_error: 'Password is required' }),
          role: z.string({ required_error: 'Role is required' }),
     }),
});

export const AdminValidation = {
     createAdminZodSchema,
};
