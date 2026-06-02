import type { Request, Response } from 'express';
import type { ApiSuccessResponse, PaginatedResponse } from '@/types/api.types';
import type { GenerationResponse } from '@/types/generation.types';
import * as generationsService from './generations.service';

export async function createImage(
  req: Request,
  res: Response<
    ApiSuccessResponse<{
      generation: { id: string; status: 'queued'; credits_used: number };
    }>
  >,
): Promise<void> {
  const result = await generationsService.createImageGeneration(req.user!.id, req.body);
  res.status(201).json({ success: true, data: result });
}

export async function createVideo(
  req: Request,
  res: Response<
    ApiSuccessResponse<{
      generation: { id: string; status: 'queued'; credits_used: number };
    }>
  >,
): Promise<void> {
  const result = await generationsService.createVideoGeneration(req.user!.id, req.body);
  res.status(201).json({ success: true, data: result });
}

export async function list(
  req: Request,
  res: Response<PaginatedResponse<GenerationResponse>>,
): Promise<void> {
  const result = await generationsService.listGenerations(req.user!.id, req.query);
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
}

export async function getById(
  req: Request,
  res: Response<ApiSuccessResponse<GenerationResponse>>,
): Promise<void> {
  const result = await generationsService.getGenerationById(req.user!.id, req.params.id);
  res.json({ success: true, data: result });
}

export async function remove(
  req: Request,
  res: Response<ApiSuccessResponse<{ message: string }>>,
): Promise<void> {
  await generationsService.deleteGeneration(req.user!.id, req.params.id);
  res.json({ success: true, data: { message: 'Generation deleted successfully.' } });
}

export async function enhancePrompt(
  req: Request,
  res: Response<ApiSuccessResponse<{ enhanced_prompt: string }>>,
): Promise<void> {
  const result = await generationsService.enhancePrompt(req.body);
  res.json({ success: true, data: result });
}

export async function reuse(
  req: Request,
  res: Response<
    ApiSuccessResponse<{
      type: string;
      prompt: string;
      parameters: GenerationResponse['parameters'];
      api_provider: string | null;
    }>
  >,
): Promise<void> {
  const result = await generationsService.reuseGeneration(req.user!.id, req.params.id);
  res.json({ success: true, data: result });
}

export async function summary(
  req: Request,
  res: Response<
    ApiSuccessResponse<{
      total: number;
      images: number;
      videos: number;
      creditsUsedRecent: number;
      recent: GenerationResponse[];
    }>
  >,
): Promise<void> {
  const result = await generationsService.getUserGenerationSummary(req.user!.id);
  res.json({ success: true, data: result });
}
