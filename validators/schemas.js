const { z } = require('zod');

const userSignupSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name cannot exceed 50 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password cannot exceed 20 characters'),
  phoneNo: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  address: z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(100, 'Address cannot exceed 100 characters')
});

const userSigninSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(20, 'Password cannot exceed 20 characters')
});

const orderSchema = z.object({
  userId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  restaurantId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  dishId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId'),
  orderDate: z.date().optional(),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  status: z.enum(['Pending', 'Preparing', 'Completed', 'Cancelled'])
});

module.exports = {
  userSignupSchema,
  userSigninSchema,
  orderSchema
};
