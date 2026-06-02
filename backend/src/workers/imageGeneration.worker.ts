import { GenerationStatus, LogLevel } from '@prisma/client';
import { imageGenerationQueue } from '@/lib/bull';
import { prisma } from '@/lib/prisma';
import {
  generateImage,
  OpenAIContentPolicyError,
  OpenAIServiceError,
} from '@/services/openai.service';
import { uploadImageFromBase64 } from '@/services/storage.service';
import { refundCredits } from '@/services/credits.service';
import { sendToUser } from '@/services/websocket.service';
import { logger, logToDb } from '@/services/logger.service';

export interface ImageGenerationJobData {
  generationId: string;
  userId: string;
  prompt: string;
  size: string;
  quality: string;
  style: string;
}

const CONTENT_POLICY_MESSAGE =
  'Your prompt was declined by the content safety filter. Please modify your prompt and try again.';

const API_UNAVAILABLE_MESSAGE =
  'Our AI service is temporarily unavailable. Your credits have been returned. Please try again in a few moments.';

export async function processImageJobDirectly(jobData: ImageGenerationJobData): Promise<void> {
  await processImageJob({ data: jobData });
}

async function processImageJob(job: { data: ImageGenerationJobData }): Promise<void> {
  const { generationId, userId, prompt, size, quality, style } = job.data;

  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
  });

  if (!generation) {
    logger.warn('Image job skipped — generation not found', { generationId, userId });
    return;
  }

  await prisma.generation.update({
    where: { id: generationId },
    data: { status: GenerationStatus.processing },
  });

  sendToUser(userId, {
    type: 'GENERATION_STATUS',
    generationId,
    status: 'processing',
    stage: 'Analyzing your prompt...',
  });

  try {
    const base64 = await generateImage(prompt, size, quality, style);

    sendToUser(userId, {
      type: 'GENERATION_STATUS',
      generationId,
      status: 'processing',
      stage: 'Rendering your image...',
      progress: 70,
    });

    const { media_url, thumbnail_url } = await uploadImageFromBase64(
      base64,
      userId,
      generationId,
    );

    const completedAt = new Date();

    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: GenerationStatus.completed,
        media_url,
        thumbnail_url,
        completed_at: completedAt,
        duration_seconds: Math.round((completedAt.getTime() - generation.created_at.getTime()) / 1000),
      },
    });

    sendToUser(userId, {
      type: 'GENERATION_COMPLETE',
      generationId,
      media_url,
      thumbnail_url,
      credits_used: generation.credits_used,
    });

    await logToDb(LogLevel.info, 'openai', 'Image generation completed', {
      generation_id: generationId,
      user_id: userId,
    });
  } catch (error) {
    if (error instanceof OpenAIContentPolicyError) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: GenerationStatus.failed,
          error_message: error.message,
        },
      });

      await refundCredits(userId, generation.credits_used, generationId);

      sendToUser(userId, {
        type: 'GENERATION_FAILED',
        generationId,
        userMessage: CONTENT_POLICY_MESSAGE,
      });

      await logToDb(LogLevel.warn, 'openai', 'Image generation content policy rejection', {
        generation_id: generationId,
        user_id: userId,
      });

      return;
    }

    if (error instanceof OpenAIServiceError) {
      await prisma.generation.update({
        where: { id: generationId },
        data: {
          status: GenerationStatus.failed,
          error_message: error.message,
        },
      });

      await refundCredits(userId, generation.credits_used, generationId);

      sendToUser(userId, {
        type: 'GENERATION_FAILED',
        generationId,
        userMessage: API_UNAVAILABLE_MESSAGE,
      });

      await logToDb(LogLevel.error, 'openai', 'Image generation API failure', {
        generation_id: generationId,
        user_id: userId,
        message: error.message,
      });

      return;
    }

    await prisma.generation.update({
      where: { id: generationId },
      data: {
        status: GenerationStatus.failed,
        error_message: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    await refundCredits(userId, generation.credits_used, generationId);

    sendToUser(userId, {
      type: 'GENERATION_FAILED',
      generationId,
      userMessage: API_UNAVAILABLE_MESSAGE,
    });

    logger.error('Unexpected image generation failure', {
      generationId,
      userId,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    await logToDb(LogLevel.error, 'openai', 'Unexpected image generation failure', {
      generation_id: generationId,
      user_id: userId,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

export function startImageGenerationWorker(): void {
  if (!imageGenerationQueue) {
    logger.warn('Image generation worker skipped — queue not available');
    return;
  }

  imageGenerationQueue.process(async (job) => {
    await processImageJob(job as { data: ImageGenerationJobData });
  });

  imageGenerationQueue.on('failed', (job, error) => {
    logger.error('Image generation queue job failed', {
      jobId: job?.id,
      generationId: job?.data?.generationId,
      message: error.message,
    });
  });

  logger.info('Image generation worker started (Bull queue)');
}
