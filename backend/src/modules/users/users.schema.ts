import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const updateProfileSchema = z
  .object({
    full_name: z.string().min(1, 'Full name is required').max(120).optional(),
  })
  .strict()
  .refine((data) => data.full_name !== undefined, {
    message: 'At least one field must be provided',
  });

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
    confirm_password: z.string(),
  })
  .strict()
  .refine((data) => data.new_password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  });

export const createProjectSchema = z
  .object({
    name: z.string().min(1, 'Project name is required').max(120),
    description: z.string().max(500).optional(),
  })
  .strict();

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
