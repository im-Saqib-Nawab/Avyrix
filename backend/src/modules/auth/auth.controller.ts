import type { Request, Response } from 'express';
import type { ApiSuccessResponse } from '@/types/api.types';
import type { AuthTokensResponse, RefreshTokenResponse } from '@/types/auth.types';
import * as authService from './auth.service';
import { REFRESH_COOKIE_NAME } from './auth.utils';

export async function register(
  req: Request,
  res: Response<ApiSuccessResponse<AuthTokensResponse>>,
): Promise<void> {
  const result = await authService.register(req.body, res);
  res.status(201).json({ success: true, data: result });
}

export async function login(
  req: Request,
  res: Response<ApiSuccessResponse<AuthTokensResponse>>,
): Promise<void> {
  const result = await authService.login(req.body, res);
  res.json({ success: true, data: result });
}

export async function refresh(
  req: Request,
  res: Response<ApiSuccessResponse<RefreshTokenResponse>>,
): Promise<void> {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;
  const result = await authService.refreshSession(refreshToken, res);
  res.json({ success: true, data: result });
}

export async function logout(
  req: Request,
  res: Response<ApiSuccessResponse<{ message: string }>>,
): Promise<void> {
  const result = await authService.logout(req.user!.id, res);
  res.json({ success: true, data: result, message: result.message });
}

export async function me(
  req: Request,
  res: Response<ApiSuccessResponse<{ user: AuthTokensResponse['user'] }>>,
): Promise<void> {
  const result = await authService.getMe(req.user!.id);
  res.json({ success: true, data: result });
}

export async function verifyEmail(
  req: Request,
  res: Response<ApiSuccessResponse<{ message: string; user?: AuthTokensResponse['user'] }>>,
): Promise<void> {
  const result = await authService.verifyEmail(req.params.token);
  res.json({ success: true, data: result, message: result.message });
}

export async function verifyEmailPost(
  req: Request,
  res: Response<ApiSuccessResponse<{ message: string; user?: AuthTokensResponse['user'] }>>,
): Promise<void> {
  const result = await authService.verifyEmail(req.body.token);
  res.json({ success: true, data: result, message: result.message });
}

export async function resendVerification(
  req: Request,
  res: Response<ApiSuccessResponse<{ message: string }>>,
): Promise<void> {
  const result = await authService.resendVerification(req.user!.id);
  res.json({ success: true, data: result, message: result.message });
}

export async function forgotPassword(
  req: Request,
  res: Response<ApiSuccessResponse<{ message: string }>>,
): Promise<void> {
  const result = await authService.forgotPassword(req.body);
  res.json({ success: true, data: result, message: result.message });
}

export async function resetPassword(
  req: Request,
  res: Response<ApiSuccessResponse<{ message: string }>>,
): Promise<void> {
  const result = await authService.resetPassword(req.body);
  res.json({ success: true, data: result, message: result.message });
}
