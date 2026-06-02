import { GenerationStatus, GenerationType, Prisma, TransactionType } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { imageGenerationQueue, videoGenerationQueue } from '@/lib/bull';
import { processImageJobDirectly } from '@/workers/imageGeneration.worker';
import { processVideoJobDirectly } from '@/workers/videoGeneration.worker';
import { logger } from '@/services/logger.service';
import { sendToUser } from '@/services/websocket.service';
import { getImageCreditCost, getVideoCreditCost } from '@/lib/creditCosts';
import { AppError } from '@/lib/appError';
import { deleteFile } from '@/services/storage.service';
import { enhancePrompt as enhancePromptWithOpenAI } from '@/services/openai.service';
import type { EnhancePromptInput } from './generations.schema';
import { toGenerationResponse } from './generations.mapper';
import type {
  ImageGenerationInput,
  ListGenerationsQuery,
  VideoGenerationInput,
} from './generations.schema';
import type { GenerationParameters, GenerationResponse } from '@/types/generation.types';
import type { PaginationMeta } from '@/types/api.types';
import type { ImageGenerationJobData } from '@/workers/imageGeneration.worker';
import type { VideoGenerationJobData } from '@/workers/videoGeneration.worker';

function scheduleDirectImageProcessing(jobData: ImageGenerationJobData): void {
  logger.info('Processing image generation directly (no queue)', {
    generationId: jobData.generationId,
  });
  setImmediate(() => {
    void processImageJobDirectly(jobData).catch((error) => {
      logger.error('Direct image processing failed', {
        generationId: jobData.generationId,
        message: error instanceof Error ? error.message : String(error),
      });
      sendToUser(jobData.userId, {
        type: 'GENERATION_FAILED',
        generationId: jobData.generationId,
        userMessage: 'Generation failed. Please try again.',
      });
    });
  });
}

function scheduleDirectVideoProcessing(jobData: VideoGenerationJobData): void {
  logger.info('Processing video generation directly (no queue)', {
    generationId: jobData.generationId,
  });
  setImmediate(() => {
    void processVideoJobDirectly(jobData).catch((error) => {
      logger.error('Direct video processing failed', {
        generationId: jobData.generationId,
        message: error instanceof Error ? error.message : String(error),
      });
      sendToUser(jobData.userId, {
        type: 'GENERATION_FAILED',
        generationId: jobData.generationId,
        userMessage: 'Generation failed. Please try again.',
      });
    });
  });
}

async function assertProjectOwnership(userId: string, projectId: string): Promise<void> {
  const project = await prisma.project.findFirst({
    where: { id: projectId, user_id: userId },
  });
  if (!project) {
    throw new AppError(404, 'NOT_FOUND', 'The requested project was not found.');
  }
}

async function deductCreditsInTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  amount: number,
  generationId: string,
  description: string,
): Promise<void> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { credit_balance: true },
  });

  if (!user || user.credit_balance < amount) {
    throw new AppError(
      402,
      'INSUFFICIENT_CREDITS',
      "You don't have enough credits. Purchase more to continue.",
    );
  }

  const updated = await tx.user.update({
    where: { id: userId },
    data: { credit_balance: { decrement: amount } },
    select: { credit_balance: true },
  });

  await tx.creditTransaction.create({
    data: {
      user_id: userId,
      generation_id: generationId,
      type: TransactionType.deduction,
      amount: -amount,
      balance_after: updated.credit_balance,
      description,
    },
  });
}

async function getOwnedGeneration(userId: string, generationId: string) {
  const generation = await prisma.generation.findFirst({
    where: { id: generationId, user_id: userId },
  });
  if (!generation) {
    throw new AppError(404, 'NOT_FOUND', 'The requested generation was not found.');
  }
  return generation;
}

export async function createImageGeneration(userId: string, input: ImageGenerationInput) {
  const creditCost = getImageCreditCost(input.size, input.quality);

  if (input.project_id) {
    await assertProjectOwnership(userId, input.project_id);
  }

  const parameters: GenerationParameters = {
    size: input.size,
    quality: input.quality,
    style: input.style,
  };

  const generation = await prisma.$transaction(async (tx) => {
    const created = await tx.generation.create({
      data: {
        user_id: userId,
        project_id: input.project_id,
        type: GenerationType.image,
        prompt: input.prompt.trim(),
        parameters,
        status: GenerationStatus.queued,
        api_provider: 'openai',
        credits_used: creditCost,
      },
    });

    await deductCreditsInTransaction(tx, userId, creditCost, created.id, 'Image Generation');
    return created;
  });

  const jobData = {
    generationId: generation.id,
    userId,
    prompt: generation.prompt,
    size: input.size,
    quality: input.quality,
    style: input.style,
  };

  if (imageGenerationQueue) {
    try {
      await imageGenerationQueue.add(jobData, {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (error) {
      logger.warn('Image queue add failed — processing directly', {
        message: error instanceof Error ? error.message : String(error),
      });
      scheduleDirectImageProcessing(jobData);
    }
  } else {
    scheduleDirectImageProcessing(jobData);
  }

  return {
    generation: {
      id: generation.id,
      status: 'queued' as const,
      credits_used: creditCost,
    },
  };
}

export async function createVideoGeneration(userId: string, input: VideoGenerationInput) {
  const creditCost = getVideoCreditCost(input.duration);

  if (input.project_id) {
    await assertProjectOwnership(userId, input.project_id);
  }

  const parameters: GenerationParameters = {
    duration: `${input.duration}s`,
    aspect_ratio: input.aspect_ratio,
    provider: input.provider,
  };

  const generation = await prisma.$transaction(async (tx) => {
    const created = await tx.generation.create({
      data: {
        user_id: userId,
        project_id: input.project_id,
        type: GenerationType.video,
        prompt: input.prompt.trim(),
        parameters,
        status: GenerationStatus.queued,
        api_provider: input.provider,
        credits_used: creditCost,
      },
    });

    await deductCreditsInTransaction(tx, userId, creditCost, created.id, 'Video Generation');
    return created;
  });

  const videoJobData = {
    generationId: generation.id,
    userId,
    prompt: generation.prompt,
    duration: input.duration,
    aspect_ratio: input.aspect_ratio,
    provider: input.provider,
  };

  if (videoGenerationQueue) {
    try {
      await videoGenerationQueue.add(videoJobData, {
        removeOnComplete: true,
        removeOnFail: false,
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
      });
    } catch (error) {
      logger.warn('Video queue add failed — processing directly', {
        message: error instanceof Error ? error.message : String(error),
      });
      scheduleDirectVideoProcessing(videoJobData);
    }
  } else {
    scheduleDirectVideoProcessing(videoJobData);
  }

  return {
    generation: {
      id: generation.id,
      status: 'queued' as const,
      credits_used: creditCost,
    },
  };
}

export async function listGenerations(
  userId: string,
  query: ListGenerationsQuery | Record<string, unknown>,
): Promise<{ data: GenerationResponse[]; pagination: PaginationMeta }> {
  const parsed = query as ListGenerationsQuery;
  const { page, limit, type, status, project_id, search } = parsed;
  const skip = (page - 1) * limit;

  const where: Prisma.GenerationWhereInput = {
    user_id: userId,
  };

  if (type !== 'all') {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (project_id) {
    where.project_id = project_id;
  }

  if (search?.trim()) {
    where.prompt = { contains: search.trim(), mode: 'insensitive' };
  }

  const [total, generations] = await Promise.all([
    prisma.generation.count({ where }),
    prisma.generation.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        prompt: true,
        parameters: true,
        status: true,
        api_provider: true,
        media_url: true,
        thumbnail_url: true,
        credits_used: true,
        credits_refunded: true,
        created_at: true,
        completed_at: true,
      },
    }),
  ]);

  return {
    data: generations.map(toGenerationResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function getGenerationById(
  userId: string,
  generationId: string,
): Promise<GenerationResponse> {
  const generation = await getOwnedGeneration(userId, generationId);
  return toGenerationResponse(generation);
}

export async function deleteGeneration(userId: string, generationId: string): Promise<void> {
  const generation = await getOwnedGeneration(userId, generationId);

  if (generation.media_url) {
    await deleteFile(generation.media_url);
  }

  if (generation.thumbnail_url && generation.thumbnail_url !== generation.media_url) {
    await deleteFile(generation.thumbnail_url);
  }

  await prisma.generation.delete({ where: { id: generation.id } });
}

export async function enhancePrompt(input: EnhancePromptInput): Promise<{ enhanced_prompt: string }> {
  const enhanced_prompt = await enhancePromptWithOpenAI(input.prompt.trim());
  return { enhanced_prompt };
}

export async function reuseGeneration(userId: string, generationId: string) {
  const generation = await getOwnedGeneration(userId, generationId);

  return {
    type: generation.type,
    prompt: generation.prompt,
    parameters: toGenerationResponse(generation).parameters,
    api_provider: generation.api_provider,
  };
}

export async function getUserGenerationSummary(userId: string) {
  const [total, images, videos, recentGenerations] = await Promise.all([
    prisma.generation.count({ where: { user_id: userId } }),
    prisma.generation.count({ where: { user_id: userId, type: GenerationType.image } }),
    prisma.generation.count({ where: { user_id: userId, type: GenerationType.video } }),
    prisma.generation.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 6,
    }),
  ]);

  const recent = recentGenerations.map(toGenerationResponse);
  const creditsUsedRecent = recent.reduce((sum, g) => sum + (g.credits_used ?? 0), 0);

  return { total, images, videos, creditsUsedRecent, recent };
}
