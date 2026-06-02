import crypto from 'crypto';
import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '@/config';
import { logger } from '@/services/logger.service';

const KLING_API_BASE = 'https://api.klingai.com';

export class KlingServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'KlingServiceError';
  }
}

function generateKlingToken(accessKey: string, secretKey: string): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    .toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ iss: accessKey, exp: now + 1800, nbf: now - 5 }),
  ).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(`${header}.${payload}`)
    .digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function createKlingClient() {
  const token = generateKlingToken(config.KLING_ACCESS_KEY, config.KLING_SECRET_KEY);
  const client = axios.create({
    baseURL: KLING_API_BASE,
    headers: {
      Authorization: `Bearer ${token}`,
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

function mapAspectRatio(aspectRatio: string): string {
  if (aspectRatio === '9:16') return '9:16';
  if (aspectRatio === '1:1') return '1:1';
  return '16:9';
}

interface KlingApiResponse<T> {
  code?: number;
  message?: string;
  data?: T;
}

interface KlingTaskData {
  task_id?: string;
  task_status?: string;
  task_status_msg?: string;
  task_result?: {
    videos?: Array<{ url?: string }>;
  };
}

function assertKlingSuccess<T>(response: KlingApiResponse<T>, context: string): T {
  if (response.code !== undefined && response.code !== 0) {
    throw new KlingServiceError(response.message ?? `Kling API error during ${context}`);
  }
  if (!response.data) {
    throw new KlingServiceError(`Kling API returned no data during ${context}`);
  }
  return response.data;
}

export async function submitVideoJob(
  prompt: string,
  duration: number,
  aspectRatio: string,
): Promise<{ job_id: string }> {
  try {
    const client = createKlingClient();
    const response = await client.post<KlingApiResponse<KlingTaskData>>('/v1/videos/text2video', {
      model_name: 'kling-v1',
      prompt,
      duration: String(duration),
      aspect_ratio: mapAspectRatio(aspectRatio),
    });

    const data = assertKlingSuccess(response.data, 'submit');
    const job_id = data.task_id;
    if (!job_id) {
      throw new KlingServiceError('Kling did not return a task_id');
    }

    return { job_id };
  } catch (error) {
    logger.error('Kling submitVideoJob failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    if (error instanceof KlingServiceError) {
      throw error;
    }
    throw new KlingServiceError('Failed to submit video job to Kling');
  }
}

export async function getJobStatus(
  jobId: string,
): Promise<{ status: string; video_url?: string }> {
  try {
    const client = createKlingClient();
    const response = await client.get<KlingApiResponse<KlingTaskData>>(
      `/v1/videos/text2video/${jobId}`,
    );

    const data = assertKlingSuccess(response.data, 'status');
    const rawStatus = (data.task_status ?? 'processing').toLowerCase();

    let status = 'processing';
    if (['succeed', 'success', 'completed', 'done'].includes(rawStatus)) {
      status = 'completed';
    } else if (['failed', 'error', 'fail'].includes(rawStatus)) {
      status = 'failed';
    } else if (['queued', 'submitted', 'pending'].includes(rawStatus)) {
      status = 'queued';
    } else if (rawStatus.includes('render')) {
      status = 'rendering';
    } else if (rawStatus.includes('final')) {
      status = 'finalizing';
    }

    const video_url = data.task_result?.videos?.[0]?.url;

    return { status, video_url };
  } catch (error) {
    if (error instanceof KlingServiceError) {
      throw error;
    }
    throw new KlingServiceError('Failed to fetch Kling job status');
  }
}

export async function pingStatus(): Promise<boolean> {
  try {
    const client = createKlingClient();
    await client.get('/v1/videos/text2video');
    return true;
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    return status === 401 || status === 404 || status === 405;
  }
}
