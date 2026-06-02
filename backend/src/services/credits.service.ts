import { TransactionType, type CreditTransaction } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/appError';
import type {
  CreditBalanceResponse,
  CreditTransactionResponse,
  CreditTransactionType,
} from '@/types/credits.types';
import type { PaginationMeta } from '@/types/api.types';

export function buildBalanceResponse(balance: number): CreditBalanceResponse {
  return {
    balance,
    is_low: balance < 20,
    is_critical: balance < 5,
  };
}

function mapTransactionType(type: TransactionType): CreditTransactionType {
  switch (type) {
    case TransactionType.purchase:
      return 'purchase';
    case TransactionType.deduction:
      return 'deduction';
    case TransactionType.refund:
      return 'refund';
    case TransactionType.topup:
      return 'topup';
    case TransactionType.admin_adjustment:
      return 'admin_adjustment';
    default:
      return 'deduction';
  }
}

function toTransactionResponse(transaction: CreditTransaction): CreditTransactionResponse {
  return {
    id: transaction.id,
    type: mapTransactionType(transaction.type),
    amount: transaction.amount,
    balance_after: transaction.balance_after,
    description: transaction.description,
    created_at: transaction.created_at.toISOString(),
    generation_id: transaction.generation_id,
  };
}

export async function getCreditBalance(userId: string): Promise<CreditBalanceResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credit_balance: true },
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found.');
  }

  return buildBalanceResponse(user.credit_balance);
}

export async function listCreditTransactions(
  userId: string,
  page: number,
  limit: number,
): Promise<{ data: CreditTransactionResponse[]; pagination: PaginationMeta }> {
  const skip = (page - 1) * limit;

  const [total, transactions] = await Promise.all([
    prisma.creditTransaction.count({ where: { user_id: userId } }),
    prisma.creditTransaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
  ]);

  return {
    data: transactions.map(toTransactionResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function deductCredits(
  userId: string,
  amount: number,
  generationId: string,
  description: string,
): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credit_balance: true },
    });

    if (!user || user.credit_balance < amount) {
      throw new AppError(
        402,
        'INSUFFICIENT_CREDITS',
        "You don't have enough credits. Purchase more to continue.",
      );
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credit_balance: { decrement: amount } },
      select: { credit_balance: true },
    });

    await tx.creditTransaction.create({
      data: {
        user_id: userId,
        generation_id: generationId,
        type: TransactionType.deduction,
        amount: -amount,
        balance_after: updated.credit_balance,
        description,
      },
    });

    return updated.credit_balance;
  });
}

export async function refundCredits(
  userId: string,
  amount: number,
  generationId: string,
): Promise<number | null> {
  return prisma.$transaction(async (tx) => {
    const generation = await tx.generation.findUnique({
      where: { id: generationId },
    });

    if (!generation || generation.credits_refunded) {
      return null;
    }

    await tx.generation.update({
      where: { id: generationId },
      data: { credits_refunded: true },
    });

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credit_balance: { increment: amount } },
      select: { credit_balance: true },
    });

    await tx.creditTransaction.create({
      data: {
        user_id: userId,
        generation_id: generationId,
        type: TransactionType.refund,
        amount,
        balance_after: updated.credit_balance,
        description: 'Automatic refund — generation failed',
      },
    });

    return updated.credit_balance;
  });
}
