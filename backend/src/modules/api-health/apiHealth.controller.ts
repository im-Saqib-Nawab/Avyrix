import type { Request, Response } from 'express';
import type { ApiSuccessResponse } from '@/types/api.types';

/** Public lightweight health summary (no auth). */
export async function getPublicHealth(
  _req: Request,
  res: Response<ApiSuccessResponse<{ status: string }>>,
): Promise<void> {
  res.json({ success: true, data: { status: 'ok' } });
}
