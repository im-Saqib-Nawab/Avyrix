import {
  GenerationType,
  LogLevel,
  Prisma,
  SubscriptionStatus,
  TransactionType,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/appError';
import { toAuthUser } from '@/modules/auth/auth.utils';
import { toGenerationResponse } from '@/modules/generations/generations.mapper';
import type {
  AdminStatsResponse,
  AdminUserListItem,
} from '@/types/admin.types';
import type { PaginationMeta } from '@/types/api.types';
import type {
  AdjustCreditsInput,
  ListGenerationsQuery,
  ListLogsQuery,
  ListUsersQuery,
} from './admin.schema';
import type { GenerationResponse } from '@/types/generation.types';

function startOfTodayUtc(): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function formatSubscriptionLabel(status: SubscriptionStatus): string {
  switch (status) {
    case SubscriptionStatus.active:
      return 'Pro';
    case SubscriptionStatus.past_due:
      return 'Past Due';
    case SubscriptionStatus.cancelled:
      return 'Cancelled';
    default:
      return 'Free';
  }
}

export async function getAdminStats(): Promise<AdminStatsResponse> {
  const startOfToday = startOfTodayUtc();

  const [
    total_users,
    active_users_today,
    total_generations,
    total_generations_today,
    image_generations,
    image_generations_today,
    video_generations,
    video_generations_today,
    creditsAggregate,
    purchaseAggregate,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.generation.findMany({
      where: { created_at: { gte: startOfToday } },
      distinct: ['user_id'],
      select: { user_id: true },
    }),
    prisma.generation.count(),
    prisma.generation.count({ where: { created_at: { gte: startOfToday } } }),
    prisma.generation.count({ where: { type: GenerationType.image } }),
    prisma.generation.count({
      where: { created_at: { gte: startOfToday }, type: GenerationType.image },
    }),
    prisma.generation.count({ where: { type: GenerationType.video } }),
    prisma.generation.count({
      where: { created_at: { gte: startOfToday }, type: GenerationType.video },
    }),
    prisma.creditTransaction.aggregate({
      where: {
        type: TransactionType.deduction,
        created_at: { gte: startOfToday },
      },
      _sum: { amount: true },
    }),
    prisma.creditTransaction.aggregate({
      where: { type: TransactionType.purchase },
      _sum: { amount: true },
    }),
  ]);

  const credits_consumed_today = Math.abs(creditsAggregate._sum.amount ?? 0);
  const total_revenue = Math.max(0, (purchaseAggregate._sum.amount ?? 0) * 0.09);

  return {
    total_users,
    active_users_today: active_users_today.length,
    total_generations,
    total_generations_today,
    image_generations,
    image_generations_today,
    video_generations,
    video_generations_today,
    credits_consumed_today,
    total_revenue,
  };
}

export async function listUsers(query: ListUsersQuery) {
  const { page, limit, search } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.UserWhereInput = {};
  if (search?.trim()) {
    const term = search.trim();
    where.OR = [
      { full_name: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
    ];
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { generations: true } },
      },
    }),
  ]);

  const data: AdminUserListItem[] = users.map((user) => ({
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    role: user.role,
    credit_balance: user.credit_balance,
    subscription_status: formatSubscriptionLabel(user.subscription_status),
    created_at: user.created_at.toISOString(),
    generation_count: user._count.generations,
  }));

  const pagination: PaginationMeta = {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };

  return { data, pagination };
}

export async function getUserById(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      full_name: true,
      email: true,
      role: true,
      credit_balance: true,
      subscription_status: true,
      is_verified: true,
      created_at: true,
      generations: {
        orderBy: { created_at: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found.');
  }

  const { generations, ...profile } = user;

  return {
    user: {
      ...toAuthUser(profile),
      created_at: profile.created_at.toISOString(),
      subscription_label: formatSubscriptionLabel(profile.subscription_status),
    },
    recent_generations: generations.map(toGenerationResponse),
  };
}

export async function adjustUserCredits(
  adminId: string,
  userId: string,
  input: AdjustCreditsInput,
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true, credit_balance: true, full_name: true, email: true },
    });

    if (!user) {
      throw new AppError(404, 'NOT_FOUND', 'User not found.');
    }

    const newBalance = user.credit_balance + input.amount;
    if (newBalance < 0) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Credit balance cannot go below zero.');
    }

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credit_balance: newBalance },
      select: {
        id: true,
        full_name: true,
        email: true,
        role: true,
        credit_balance: true,
        subscription_status: true,
        is_verified: true,
      },
    });

    await tx.creditTransaction.create({
      data: {
        user_id: userId,
        type: TransactionType.admin_adjustment,
        amount: input.amount,
        balance_after: newBalance,
        description: input.reason.trim(),
        created_by: adminId,
      },
    });

    return {
      user: toAuthUser(updated),
      credit_balance: newBalance,
    };
  });
}

export async function listAllGenerations(query: ListGenerationsQuery) {
  const { page, limit, type, status, user_id, search, from, to } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.GenerationWhereInput = {};

  if (type !== 'all') {
    where.type = type;
  }
  if (status) {
    where.status = status;
  }
  if (user_id) {
    where.user_id = user_id;
  }
  if (search?.trim()) {
    where.prompt = { contains: search.trim(), mode: 'insensitive' };
  }
  if (from || to) {
    where.created_at = {};
    if (from) where.created_at.gte = new Date(from);
    if (to) where.created_at.lte = new Date(to);
  }

  const [total, generations] = await Promise.all([
    prisma.generation.count({ where }),
    prisma.generation.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        user: { select: { id: true, email: true, full_name: true } },
      },
    }),
  ]);

  const data = generations.map((generation) => ({
    ...toGenerationResponse(generation),
    user: {
      id: generation.user.id,
      email: generation.user.email,
      full_name: generation.user.full_name,
    },
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function listSystemLogs(query: ListLogsQuery) {
  const { page, limit, severity, service } = query;
  const skip = (page - 1) * limit;

  const where: Prisma.SystemLogWhereInput = {};
  if (severity) {
    where.level = severity as LogLevel;
  }
  if (service?.trim()) {
    where.service = service.trim();
  }

  const [total, logs] = await Promise.all([
    prisma.systemLog.count({ where }),
    prisma.systemLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
  ]);

  const data = logs.map((log) => ({
    id: log.id,
    level: log.level,
    service: log.service,
    message: log.message,
    meta: log.meta,
    request_id: log.request_id,
    user_id: log.user_id,
    created_at: log.created_at.toISOString(),
  }));

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export type AdminGenerationItem = GenerationResponse & {
  user: { id: string; email: string; full_name: string };
};

export type { AdminUserListItem };
