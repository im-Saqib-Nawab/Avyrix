import type { Generation } from '@prisma/client';
import type { GenerationParameters, GenerationResponse } from '@/types/generation.types';

export function mapParameters(value: unknown): GenerationParameters {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as GenerationParameters;
}

export function toGenerationResponse(
  generation: Pick<
    Generation,
    | 'id'
    | 'type'
    | 'prompt'
    | 'parameters'
    | 'status'
    | 'api_provider'
    | 'media_url'
    | 'thumbnail_url'
    | 'credits_used'
    | 'credits_refunded'
    | 'created_at'
    | 'completed_at'
  >,
): GenerationResponse {
  const response: GenerationResponse = {
    id: generation.id,
    type: generation.type,
    prompt: generation.prompt,
    parameters: mapParameters(generation.parameters),
    status: generation.status,
    api_provider: generation.api_provider,
    media_url: generation.media_url,
    thumbnail_url: generation.thumbnail_url,
    credits_used: generation.credits_used,
    created_at: generation.created_at.toISOString(),
    completed_at: generation.completed_at?.toISOString() ?? null,
  };

  if (generation.credits_refunded) {
    response.credits_refunded = true;
  }

  return response;
}
