export type CreditTransactionType =
  | 'purchase'
  | 'deduction'
  | 'refund'
  | 'topup'
  | 'admin_adjustment'
  | 'admin';

export interface CreditTransaction {
  id: string;
  date: string;
  description: string;
  type: CreditTransactionType;
  amount: number;
  balance_after: number;
}

export interface CreditPack {
  id: string;
  name: string;
  credits: number;
  price_display: string;
  popular: boolean;
}
