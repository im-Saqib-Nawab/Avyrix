import { GenerationStatus, LogLevel } from '@prisma/client';
import { videoGenerationQueue } from '@/lib/bull';
import { prisma } from '@/lib/prisma';
import * as klingService from '@/services/kling.service';
import * as heygenService from '@/services/heygen.service';
import { uploadVideoFromUrl } from '@/services/storage.service';
import { refundCredits } from '@/services/credits.service';
import { sendToUser } from '@/services/websocket.service';
import { logger, logToDb } from '@/services/logger.service';

export interface VideoGenerationJobData {
  generationId: string;
  userId: string;
  prompt: string;
  duration: number;
  aspect_ratio: string;
  provider: 'kling' | 'heygen';
}

const POLL_INTERVAL_MS = 15_000;
const POLL_TIMEOUT_MS = 20 * 60 * 1000;

const FAILURE_MESSAGE =
  'Video generation failed. Your credits have been returned. Please try again.';

const TIMEOUT_MESSAGE =
  'Video generation timed out. Your credits have been returned. Please try again.';

type VideoProviderName = 'kling' | 'heygen';

interface VideoProviderAdapter {
  name: VideoProviderName;
  submit: (
    prompt: string,
    duration: number,
    aspectRatio: string,
  ) => Promise<{ jobId: string }>;
  getStatus: (jobId: string) => Promise<{ status: string; video_url?: string }>;
}

const klingAdapter: VideoProviderAdapter = {
  name: 'kling',
  submit: async (prompt, duration, aspectRatio) => {
    const { job_id } = await klingService.submitVideoJob(prompt, duration, aspectRatio);
    return { jobId: job_id };
  },
  getStatus: (jobId) => klingService.getJobStatus(jobId),
};

const heygenAdapter: VideoProviderAdapter = {
  name: 'heygen',
  submit: async (prompt, duration) => {
    const { video_id } = await heygenService.submitVideoJob(prompt, duration);
    return { jobId: video_id };
  },
  getStatus: (jobId) => heygenService.getJobStatus(jobId),
};

function progressForStatus(status: string): number {
  const normalized = status.toLowerCase();
  if (normalized === 'queued') return 10;
  if (normalized === 'processing') return 40;
  if (normalized === 'rendering') return 70;
  if (normalized === 'finalizing') return 90;
  if (normalized === 'completed') return 100;
  return 40;
}

function stageForStatus(status: string): string {
  const normalized = status.toLowerCase();
  if (normalized === 'queued') return 'Queued for processing...';
  if (normalized === 'rendering') return 'Rendering your video...';
  if (normalized === 'finalizing') return 'Finalizing your video...';
  if (normalized === 'completed') return 'Video ready!';
  return 'Processing your video...';
}

async function pollUntilComplete(
  userId: string,
  generationId: string,
  provider: VideoProviderAdapter,
  jobId: string,
): Promise<string> {
  const startedAt = Date.now();

  while (Date.now() - startedAt < POLL_TIMEOUT_MS) {
    const statusResult = await provider.getStatus(jobId);

    sendToUser(userId, {
      type: 'GENERATION_STATUS',
      generationId,
      status: 'processing',
      stage: stageForStatus(statusResult.status),
      progress: progressForStatus(statusResult.status),
    });

    if (statusResult.status === 'failed') {
      throw new Error(`${provider.name} reported failed status`);
    }

    if (statusResult.status === 'completed' && statusResult.video_url) {
      return statusResult.video_url;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }

  throw new Error('Video generation timed out');
}

async function runGeneration(
  userId: string,
  generationId: string,
  prompt: string,
  duration: number,
  aspectRatio: string,
  preferred: VideoProviderName,
): Promise<string> {
  const primary = preferred === 'heygen' ? heygenAdapter : klingAdapter;
  const fallback = preferred === 'heygen' ? klingAdapter : heygenAdapter;

  try {
    const { jobId } = await primary.submit(prompt, duration, aspectRatio);
    return pollUntilComplete(userId, generationId, primary, jobId);
  } catch (primaryError) {
    logger.warn('Primary video provider failed, trying fallback', {
      primary: primary.name,
      fallback: fallback.name,
      generationId,
      message: primaryError instanceof Error ? primaryError.message : 'Unknown error',
    });

    sendToUser(userId, {
      type: 'PROVIDER_FALLBACK',
      message:
        'Processing your video with an alternate provider. This may take slightly longer.',
    });

    const { jobId } = await fallback.submit(prompt, duration, aspectRatio);
    return pollUntilComplete(userId, generationId, fallback, jobId);
  }
}

async function failGeneration(
  userId: string,
  generationId: string,
  generation: { credits_used: number; created_at: Date },
  errorMessage: string,
  userMessage: string,
  logMessage: string,
): Promise<void> {
  await prisma.generation.update({
    where: { id: generationId },
    data: {
      status: GenerationStatus.failed,
      error_message: errorMessage,
    },
  });

  await refundCredits(userId, generation.credits_used, generationId);

  sendToUser(userId, {
    type: 'GENERATION_FAILED',
    generationId,
    userMessage,
  });

  await logToDb(LogLevel.error, 'video-generation', logMessage, {
    generation_id: generationId,
    user_id: userId,
    message: errorMessage,
  });
}

export async function processVideoJobDirectly(jobData: VideoGenerationJobData): Promise<void> {
  await processVideoJob({ data: jobData });
}

async function processVideoJob(job: { data: VideoGenerationJobData }): Promise<void> {
  const { generationId, userId, prompt, duration, aspect_ratio, provider } = job.data;

  const generation = await prisma.generation.findUnique({
    where: { id: generationId },
  });

  if (!generation) {
    logger.warn('Video job skipped — generation not found', { generationId, userId });
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
    stage: 'Submitting your request...',
    progress: 5,
  });

  try {
    const providerVideoUrl = await runGeneration(
      userId,
      generationId,
      prompt,
      duration,
      aspect_ratio,
      provider,
    );

    sendToUser(userId, {
      type: 'GENERATION_STATUS',
      generationId,
      status: 'processing',
      stage: 'Uploading your video...',
      progress: 95,
    });

    const { media_url, thumbnail_url } = await uploadVideoFromUrl(
      providerVideoUrl,
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
        duration_seconds: Math.round(
          (completedAt.getTime() - generation.created_at.getTime()) / 1000,
        ),
      },
    });

    sendToUser(userId, {
      type: 'GENERATION_COMPLETE',
      generationId,
      progress: 100,
      media_url,
      thumbnail_url,
      credits_used: generation.credits_used,
    });

    await logToDb(LogLevel.info, 'video-generation', 'Video generation completed', {
      generation_id: generationId,
      user_id: userId,
      provider,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = message.toLowerCase().includes('timed out');

    await failGeneration(
      userId,
      generationId,
      generation,
      message,
      isTimeout ? TIMEOUT_MESSAGE : FAILURE_MESSAGE,
      isTimeout ? 'Video generation timed out' : 'Video generation failed',
    );

    logger.error('Video generation job failed', {
      generationId,
      userId,
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

export function startVideoGenerationWorker(): void {
  if (!videoGenerationQueue) {
    logger.warn('Video generation worker skipped — queue not available');
    return;
  }

  videoGenerationQueue.process(async (job) => {
    await processVideoJob(job as { data: VideoGenerationJobData });
  });

  videoGenerationQueue.on('failed', (job, error) => {
    logger.error('Video generation queue job failed', {
      jobId: job?.id,
      generationId: job?.data?.generationId,
      message: error.message,
    });
  });

  logger.info('Video generation worker started (Bull queue)');
}
