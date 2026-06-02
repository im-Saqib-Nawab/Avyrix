import type { Request, Response } from 'express';
import type { ApiSuccessResponse } from '@/types/api.types';
import type { CreditTransactionResponse } from '@/types/credits.types';
import * as billingService from './billing.service';

export async function getPlans(
  _req: Request,
  res: Response<ApiSuccessResponse<ReturnType<typeof billingService.getPlans>>>,
): Promise<void> {
  res.json({ success: true, data: billingService.getPlans() });
}

export async function createCheckout(
  req: Request,
  res: Response<ApiSuccessResponse<{ checkout_url: string }>>,
): Promise<void> {
  const result = await billingService.createCheckoutSession(
    req.user!.id,
    req.user!.email,
    req.body,
  );
  res.json({ success: true, data: result });
}

export async function getHistory(
  req: Request,
  res: Response<ApiSuccessResponse<CreditTransactionResponse[]>>,
): Promise<void> {
  const history = await billingService.getPurchaseHistory(req.user!.id);
  res.json({ success: true, data: history });
}
