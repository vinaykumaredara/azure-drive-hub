import { z } from 'zod';

// Phone number validation schema
export const phoneSchema = z.string()
  .trim()
  .min(10, 'Phone number must be at least 10 digits')
  .max(15, 'Phone number must not exceed 15 digits')
  .regex(/^[0-9+\-() ]+$/, 'Phone number can only contain digits, +, -, (), and spaces')
  .refine((val) => {
    const digitsOnly = val.replace(/[^0-9]/g, '');
    return digitsOnly.length >= 10 && digitsOnly.length <= 15;
  }, 'Phone number must contain 10-15 digits');

// Email validation schema
export const emailSchema = z.string()
  .trim()
  .email('Invalid email address')
  .max(255, 'Email must not exceed 255 characters');

// Name validation schema
export const nameSchema = z.string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must not exceed 100 characters')
  .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes');

// Booking data validation
export const bookingSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  phoneNumber: z.string().nullable().refine((val) => {
    if (!val) return false;
    return phoneSchema.safeParse(val).success;
  }, 'Valid phone number is required'),
  licenseVerified: z.boolean().refine((val) => val === true, 'License verification is required'),
  termsAccepted: z.boolean().refine((val) => val === true, 'You must accept the terms and conditions'),
}).refine((data) => data.endDate > data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Promo code validation
export const promoCodeSchema = z.string()
  .trim()
  .min(3, 'Promo code must be at least 3 characters')
  .max(20, 'Promo code must not exceed 20 characters')
  .regex(/^[A-Z0-9]+$/, 'Promo code must contain only uppercase letters and numbers');

// Message validation (for chat)
export const messageSchema = z.string()
  .trim()
  .min(1, 'Message cannot be empty')
  .max(2000, 'Message must not exceed 2000 characters');

// Validation helper function
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { 
    success: false, 
    error: result.error.errors[0]?.message || 'Validation failed' 
  };
}
