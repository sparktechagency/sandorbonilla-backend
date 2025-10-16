import { z } from 'zod';

const createBrandZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Brand name is required' }),
     }),
});

const updateBrandZodSchema = z.object({
     body: z.object({
          name: z.string().optional(),
     }),
});

export const BrandValidation = {
     createBrandZodSchema,
     updateBrandZodSchema,
};
