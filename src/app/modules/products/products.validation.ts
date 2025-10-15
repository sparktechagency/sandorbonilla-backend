import { z } from "zod"
const sizeTypeSchema = z.object({
    size: z.string().optional(),
    price: z.number().optional(),
    quantity: z.number().optional(),
});
const productCreateSchema = z.object({
    body: z.object({
        images: z.array(z.string()).default([]),
        name: z.string().min(1),
        model: z.string().min(1),
        brand: z.string().min(1),
        color: z.array(z.string()).min(1),
        sizeType: z.array(sizeTypeSchema).optional(),
        price: z.number().positive(),
        profit: z.number().positive(),
        quantity: z.number().positive(),
        specialCategory: z.enum(['Male', 'Female', 'Unisex']),
        details: z.string().default(''),
        isDeleted: z.boolean().default(false),
        createdAt: z.date().optional(),
        updatedAt: z.date().optional(),
    })
})

export const ProductValidation = { productCreateSchema }