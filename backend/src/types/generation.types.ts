export type GenerationType = 'image' | 'video';

export type GenerationStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface GenerationParameters {
  size?: string;
  quality?: 'standard' | 'hd';
  style?: 'vivid' | 'natural';
  duration?: string | number;
  aspect_ratio?: string;
  provider?: string;
  [key: string]: string | number | undefined;
}

export interface GenerationResponse {
  id: string;
  type: GenerationType;
  prompt: string;
  parameters: GenerationParameters;
  status: GenerationStatus;
  api_provider: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  credits_used: number;
  credits_refunded?: boolean;
  created_at: string;
  completed_at: string | null;
}
