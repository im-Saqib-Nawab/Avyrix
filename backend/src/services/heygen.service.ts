import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '@/config';
import { logger } from '@/services/logger.service';

const HEYGEN_API_BASE = 'https://api.heygen.com';

export class HeyGenServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'HeyGenServiceError';
  }
}

function createHeyGenClient() {
  const client = axios.create({
    baseURL: HEYGEN_API_BASE,
    headers: {
      'x-api-key': config.HEYGEN_API_KEY,
      'Content-Type': 'application/json',
    },
    timeout: 60000,
  });

  axiosRetry(client, {
    retries: 3,
    retryDelay: (retryCount) => retryCount * 2000,
    retryCondition: (error: AxiosError) => {
      const status = error.response?.status;
      return !status || [429, 500, 502, 503, 504].includes(status);
    },
  });

  return client;
}

interface HeyGenVideoAgentSession {
  session_id?: string;
  video_id?: string | null;
  status?: string;
  video_url?: string | null;
}

interface HeyGenVideo {
  video_id?: string;
  status?: string;
  video_url?: string | null;
  failure_message?: string | null;
}

function mapHeyGenStatus(status: string | undefined): string {
  const normalized = (status ?? 'processing').toLowerCase();
  if (normalized === 'completed') return 'completed';
  if (normalized === 'failed') return 'failed';
  if (normalized === 'pending') return 'queued';
  if (normalized.includes('render')) return 'rendering';
  if (normalized.includes('final')) return 'finalizing';
  return 'processing';
}

export async function submitVideoJob(
  prompt: string,
  duration: number,
): Promise<{ video_id: string }> {
  try {
    const client = createHeyGenClient();
    const response = await client.post<{ data?: HeyGenVideoAgentSession }>('/v3/video-agents', {
      prompt: `${prompt.trim()} (Target duration: ${duration} seconds.)`,
      mode: 'generate',
    });

    const sessionId = response.data?.data?.session_id;
    if (!sessionId) {
      throw new HeyGenServiceError('HeyGen did not return a session_id');
    }

    return { video_id: sessionId };
  } catch (error) {
    logger.error('HeyGen submitVideoJob failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    if (error instanceof HeyGenServiceError) {
      throw error;
    }
    throw new HeyGenServiceError('Failed to submit video job to HeyGen');
  }
}

async function getVideoById(client: ReturnType<typeof createHeyGenClient>, videoId: string) {
  const response = await client.get<{ data?: HeyGenVideo }>(`/v3/videos/${videoId}`);
  const video = response.data?.data;
  if (!video) {
    throw new HeyGenServiceError('HeyGen video status response was empty');
  }

  if (video.status === 'failed') {
    throw new HeyGenServiceError(video.failure_message ?? 'HeyGen video generation failed');
  }

  return {
    status: mapHeyGenStatus(video.status),
    video_url: video.video_url ?? undefined,
  };
}

export async function getJobStatus(
  videoId: string,
): Promise<{ status: string; video_url?: string }> {
  try {
    const client = createHeyGenClient();

    const sessionResponse = await client.get<{ data?: HeyGenVideoAgentSession }>(
      `/v3/video-agents/${videoId}`,
    );
    const session = sessionResponse.data?.data;

    if (session?.video_id) {
      return getVideoById(client, session.video_id);
    }

    if (session?.status === 'failed') {
      return { status: 'failed' };
    }

    if (session?.video_url) {
      return { status: 'completed', video_url: session.video_url };
    }

    return { status: mapHeyGenStatus(session?.status) };
  } catch (error) {
    if (error instanceof HeyGenServiceError) {
      throw error;
    }
    throw new HeyGenServiceError('Failed to fetch HeyGen job status');
  }
}

export async function pingStatus(): Promise<boolean> {
  try {
    const client = createHeyGenClient();
    await client.get('/v3/user/me');
    return true;
  } catch {
    return false;
  }
}
