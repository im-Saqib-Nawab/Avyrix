import { z } from 'zod';

export const imageGenerationSchema = z
  .object({
    prompt: z.string().min(3).max(4000),
    size: z.enum(['1024x1024', '1792x1024', '1024x1792']),
    quality: z.enum(['standard', 'hd']),
    style: z.enum(['vivid', 'natural']),
    project_id: z.string().uuid().optional(),
  })
  .strict();

export const videoGenerationSchema = z
  .object({
    prompt: z.string().min(3).max(2000),
    duration: z.union([z.literal(5), z.literal(15), z.literal(30)]),
    aspect_ratio: z.enum(['16:9', '9:16', '1:1']),
    provider: z.enum(['kling', 'heygen']),
    project_id: z.string().uuid().optional(),
  })
  .strict();

export const listGenerationsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: z.enum(['image', 'video', 'all']).default('all'),
    status: z.enum(['queued', 'processing', 'completed', 'failed']).optional(),
    project_id: z.string().uuid().optional(),
    search: z.string().max(200).optional(),
  })
  .strict();

export const generationIdParamSchema = z
  .object({
    id: z.string().uuid(),
  })
  .strict();

export const enhancePromptSchema = z
  .object({
    prompt: z.string().min(1, 'Prompt is required').max(4000),
  })
  .strict();

export type EnhancePromptInput = z.infer<typeof enhancePromptSchema>;

export type ImageGenerationInput = z.infer<typeof imageGenerationSchema>;
export type VideoGenerationInput = z.infer<typeof videoGenerationSchema>;
export type ListGenerationsQuery = z.infer<typeof listGenerationsQuerySchema>;
