import { z } from 'zod';

export const checkoutSchema = z
  .object({
    pack_id: z.string().min(1),
  })
  .strict();

export type CheckoutInput = z.infer<typeof checkoutSchema>;
