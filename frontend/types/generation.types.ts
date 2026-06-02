export type GenerationType = 'image' | 'video';
export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface GenerationParameters {
  size?: string;
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  duration?: string;
  aspect_ratio?: string;
  [key: string]: string | undefined;
}

export interface Generation {
  id: string;
  type: GenerationType;
  prompt: string;
  status: GenerationStatus;
  media_url: string | null;
  thumbnail_url: string | null;
  credits_used: number;
  credits_refunded?: boolean;
  api_provider: string;
  created_at: string;
  parameters: GenerationParameters;
}

