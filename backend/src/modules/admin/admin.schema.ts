import { z } from 'zod';

export const listUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(200).optional(),
  })
  .strict();

export const listGenerationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['image', 'video', 'all']).default('all'),
    status: z.enum(['queued', 'processing', 'completed', 'failed']).optional(),
    user_id: z.string().uuid().optional(),
    search: z.string().max(200).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
  })
  .strict();

export const listLogsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    severity: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    service: z.string().max(100).optional(),
  })
  .strict();

export const adjustCreditsSchema = z
  .object({
    amount: z.number().int().refine((value) => value !== 0, 'Amount cannot be zero'),
    reason: z.string().min(1, 'Reason is required').max(500),
  })
  .strict();

export const userIdParamSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ListGenerationsQuery = z.infer<typeof listGenerationsQuerySchema>;
export type ListLogsQuery = z.infer<typeof listLogsQuerySchema>;
export type AdjustCreditsInput = z.infer<typeof adjustCreditsSchema>;
