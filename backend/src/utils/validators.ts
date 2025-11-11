import { z } from 'zod';

// User validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  twoFactorCode: z.string().optional(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain uppercase, lowercase, number, and special character'
    ),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
});

// Product validation schemas
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/),
  description: z.string().min(1, 'Description is required'),
  shortDescription: z.string().max(500).optional(),
  brand: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  price: z.number().positive('Price must be positive'),
  comparePrice: z.number().positive().optional(),
  costPrice: z.number().positive().optional(),
  categoryId: z.string().uuid('Invalid category ID'),
  stockQuantity: z.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.number().int().min(0).default(10),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metaTitle: z.string().max(60).optional(),
  metaDescription: z.string().max(160).optional(),
});

export const updateProductSchema = createProductSchema.partial();

// Category validation schemas
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  imageUrl: z.string().url().optional(),
});

// Address validation schemas
export const createAddressSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().min(1, 'Phone is required'),
  addressLine1: z.string().min(1, 'Address line 1 is required'),
  addressLine2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  type: z.enum(['shipping', 'billing']),
  isDefault: z.boolean().default(false),
});

// Cart validation schemas
export const addToCartSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  variantId: z.string().uuid().optional(),
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().positive('Quantity must be positive'),
});

// Order validation schemas
export const createOrderSchema = z.object({
  shippingAddressId: z.string().uuid('Invalid shipping address ID'),
  billingAddressId: z.string().uuid('Invalid billing address ID'),
  notes: z.string().max(500).optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'STRIPE']),
});

// Review validation schemas
export const createReviewSchema = z.object({
  productId: z.string().uuid('Invalid product ID'),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating cannot exceed 5'),
  title: z.string().max(100).optional(),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Search and filter schemas
export const productSearchSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.number().positive().optional(),
  maxPrice: z.number().positive().optional(),
  minRating: z.number().min(0).max(5).optional(),
  inStock: z.boolean().optional(),
  brand: z.string().optional(),
  tags: z.array(z.string()).optional(),
  ...paginationSchema.shape,
});

/**
 * Sanitize user input to prevent XSS attacks
 */
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '')
    .trim();
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate UUID format
 */
export const isValidUUID = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};
