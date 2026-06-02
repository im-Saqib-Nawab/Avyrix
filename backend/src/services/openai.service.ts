import axios, { AxiosError } from 'axios';
import axiosRetry from 'axios-retry';
import { config } from '@/config';

export class OpenAIContentPolicyError extends Error {
  constructor(message = 'Content policy violation') {
    super(message);
    this.name = 'OpenAIContentPolicyError';
  }
}

export class OpenAIServiceError extends Error {
  constructor(message = 'OpenAI service error') {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}

const openaiClient = axios.create({
  baseURL: 'https://api.openai.com/v1',
  headers: { Authorization: `Bearer ${config.OPENAI_API_KEY}` },
  timeout: 120000,
});

axiosRetry(openaiClient, {
  retries: 3,
  retryDelay: (retryCount) => retryCount * 2000,
  retryCondition: (error: AxiosError) => {
    const status = error.response?.status;
    return !status || [429, 500, 502, 503, 504].includes(status);
  },
});

interface OpenAIErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

function mapAxiosError(error: unknown): never {
  if (!axios.isAxiosError(error)) {
    throw error;
  }

  const status = error.response?.status;
  const body = error.response?.data as OpenAIErrorBody | undefined;
  const code = body?.error?.code?.toLowerCase() ?? '';

  if (status === 400 || status === 422) {
    if (code.includes('content_policy')) {
      throw new OpenAIContentPolicyError(body?.error?.message);
    }
    throw new OpenAIServiceError(body?.error?.message ?? 'OpenAI request rejected');
  }

  if (status && [401, 403].includes(status)) {
    throw new OpenAIServiceError(body?.error?.message ?? 'OpenAI request rejected');
  }

  if (!status || [429, 500, 502, 503, 504].includes(status) || error.code === 'ECONNABORTED') {
    throw new OpenAIServiceError('OpenAI service unavailable');
  }

  throw new OpenAIServiceError(body?.error?.message ?? 'OpenAI request failed');
}

export async function generateImage(
  prompt: string,
  size: string,
  quality: string,
  style: string,
): Promise<string> {
  try {
    const response = await openaiClient.post<{
      data: Array<{ b64_json?: string }>;
    }>('/images/generations', {
      model: 'dall-e-3',
      prompt,
      size,
      quality,
      style,
      n: 1,
      response_format: 'b64_json',
    });

    const base64 = response.data.data[0]?.b64_json;
    if (!base64) {
      throw new OpenAIServiceError('OpenAI returned an empty image payload');
    }

    return base64;
  } catch (error) {
    if (error instanceof OpenAIContentPolicyError || error instanceof OpenAIServiceError) {
      throw error;
    }
    mapAxiosError(error);
  }
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export async function pingOpenAI(): Promise<boolean> {
  try {
    await openaiClient.get('/models', { timeout: 15000 });
    return true;
  } catch {
    return false;
  }
}

export async function enhancePrompt(prompt: string): Promise<string> {
  try {
    const response = await openaiClient.post<ChatCompletionResponse>('/chat/completions', {
      model: 'gpt-4o',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at writing detailed, vivid image generation prompts. Given a basic prompt, enhance it with artistic details, lighting, style, and composition details to produce a better image. Return ONLY the enhanced prompt text, nothing else.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const enhanced = response.data.choices[0]?.message?.content?.trim();
    if (!enhanced) {
      throw new OpenAIServiceError('OpenAI returned an empty enhanced prompt');
    }

    return enhanced;
  } catch (error) {
    if (error instanceof OpenAIServiceError) {
      throw error;
    }
    mapAxiosError(error);
  }
}
