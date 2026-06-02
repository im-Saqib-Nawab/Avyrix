export type CreditTransactionType =
  | 'purchase'
  | 'deduction'
  | 'refund'
  | 'topup'
  | 'admin_adjustment';

export interface CreditTransactionResponse {
  id: string;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
  generation_id?: string | null;
}

export interface CreditBalanceResponse {
  balance: number;
  is_low: boolean;
  is_critical: boolean;
}
