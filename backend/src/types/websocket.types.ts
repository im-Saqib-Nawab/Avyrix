import type { CreditBalanceResponse } from '@/types/credits.types';

export type WSEventType =
  | 'CONNECTED'
  | 'GENERATION_STATUS'
  | 'GENERATION_COMPLETE'
  | 'GENERATION_FAILED'
  | 'PROVIDER_FALLBACK'
  | 'CREDITS_UPDATED'
  | 'PING'
  | 'PONG';

export interface WSConnectedEvent {
  type: 'CONNECTED';
  message: string;
}

export interface WSGenerationStatusEvent {
  type: 'GENERATION_STATUS';
  generationId: string;
  status: string;
  stage?: string;
  progress?: number;
}

export interface WSGenerationCompleteEvent {
  type: 'GENERATION_COMPLETE';
  generationId: string;
  media_url: string;
  thumbnail_url?: string;
  credits_used?: number;
  progress?: number;
}

export interface WSGenerationFailedEvent {
  type: 'GENERATION_FAILED';
  generationId: string;
  userMessage: string;
}

export interface WSProviderFallbackEvent {
  type: 'PROVIDER_FALLBACK';
  message: string;
}

export interface WSCreditsUpdatedEvent {
  type: 'CREDITS_UPDATED';
  balance: number;
  is_low: boolean;
  is_critical: boolean;
}

export interface WSPingEvent {
  type: 'PING';
}

export interface WSPongEvent {
  type: 'PONG';
}

export type WSClientMessage = WSPingEvent;

export type WSServerMessage =
  | WSConnectedEvent
  | WSGenerationStatusEvent
  | WSGenerationCompleteEvent
  | WSGenerationFailedEvent
  | WSProviderFallbackEvent
  | WSCreditsUpdatedEvent
  | WSPongEvent;

export function toCreditsUpdatedEvent(balance: CreditBalanceResponse): WSCreditsUpdatedEvent {
  return {
    type: 'CREDITS_UPDATED',
    balance: balance.balance,
    is_low: balance.is_low,
    is_critical: balance.is_critical,
  };
}
