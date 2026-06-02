import type { Request, Response } from 'express';
import type { ApiSuccessResponse, PaginatedResponse } from '@/types/api.types';
import type { CreditBalanceResponse, CreditTransactionResponse } from '@/types/credits.types';
import * as creditsService from './credits.service';
import type { ListTransactionsQuery } from './credits.schema';

export async function getBalance(
  req: Request,
  res: Response<ApiSuccessResponse<CreditBalanceResponse>>,
): Promise<void> {
  const balance = await creditsService.getCreditBalance(req.user!.id);
  res.json({ success: true, data: balance });
}

export async function listTransactions(
  req: Request,
  res: Response<PaginatedResponse<CreditTransactionResponse>>,
): Promise<void> {
  const query = req.query as unknown as ListTransactionsQuery;
  const result = await creditsService.listCreditTransactions(
    req.user!.id,
    query.page,
    query.limit,
  );

  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
}
