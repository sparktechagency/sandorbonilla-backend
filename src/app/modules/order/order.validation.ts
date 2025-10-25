import { z } from 'zod';

const orderSchemaValidation = z.object({
     body: z.object({
          productName: z.string().trim().min(1, 'Product name is required'),
          orderNumber: z.string().min(1, 'Order number is required'),
          quantity: z.number().int().positive('Quantity must be a positive number').min(1, 'Quantity must be at least 1'),
          price: z.number().positive('Price must be a positive number').min(0, 'Price cannot be negative'),
          totalPrice: z.number().positive('Total price must be a positive number').min(0, 'Total price cannot be negative'),
          customerName: z.string().trim().min(1, 'Customer name is required'),
          email: z.string().email('Invalid email address'),
          phoneNumber: z.string().min(1, 'Phone number is required'),
          address: z.string().min(1, 'Address is required'),
          paymentStatus: z.enum(['pending', 'paid', 'failed']).refine((val) => ['pending', 'paid', 'failed'].includes(val), {
               message: 'Invalid payment status',
          }),
          deliveryStatus: z.enum(['pending', 'processing', 'delivered']).refine((val) => ['pending', 'processing', 'delivered'].includes(val), {
               message: 'Invalid delivery status',
          }),
          checkoutSessionId: z.string().min(1, 'Checkout session ID is required'),
          paymentIntentId: z.string().optional().nullable(),
     }),
});

export const Ordervalidation = {
     orderSchemaValidation,
};
