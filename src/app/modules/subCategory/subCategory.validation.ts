import { z } from 'zod';

const createSubCategoryZodSchema = z.object({
     body: z.object({
          name: z.string({ required_error: 'Category name is required' }),
     }),
});

const updateSubCategoryZodSchema = z.object({
     body: z.object({
          name: z.string().optional(),
     }),
});

export const SubCategoryValidation = {
     createSubCategoryZodSchema,
     updateSubCategoryZodSchema,
};
