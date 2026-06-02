import bcrypt from 'bcryptjs';
import type { Response } from 'express';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/appError';
import { toAuthUser } from '@/modules/auth/auth.utils';
import { REFRESH_COOKIE_NAME } from '@/modules/auth/auth.utils';
import { config } from '@/config';
import type { AuthUser } from '@/types/auth.types';
import type { ProjectResponse } from '@/types/users.types';
import type {
  ChangePasswordInput,
  CreateProjectInput,
  UpdateProfileInput,
} from './users.schema';

const BCRYPT_ROUNDS = 12;

const userSelect = {
  id: true,
  full_name: true,
  email: true,
  role: true,
  credit_balance: true,
  subscription_status: true,
  is_verified: true,
} as const;

function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: config.NODE_ENV === 'production',
    sameSite: 'strict',
  });
}

function mapProject(
  project: {
    id: string;
    name: string;
    description: string | null;
    created_at: Date;
    updated_at: Date;
    _count: { generations: number };
  },
): ProjectResponse {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    created_at: project.created_at.toISOString(),
    updated_at: project.updated_at.toISOString(),
    generation_count: project._count.generations,
  };
}

export async function getProfile(userId: string): Promise<{ user: AuthUser }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelect,
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found.');
  }

  return { user: toAuthUser(user) };
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<{ user: AuthUser }> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      full_name: input.full_name?.trim(),
    },
    select: userSelect,
  });

  return { user: toAuthUser(user) };
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
  res: Response,
): Promise<{ message: string }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password_hash: true },
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found.');
  }

  const currentValid = await bcrypt.compare(input.current_password, user.password_hash);
  if (!currentValid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Current password is incorrect.');
  }

  const passwordHash = await bcrypt.hash(input.new_password, BCRYPT_ROUNDS);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password_hash: passwordHash,
      refresh_token_hash: null,
    },
  });

  clearRefreshCookie(res);

  return { message: 'Password changed successfully.' };
}

export async function listProjects(userId: string): Promise<ProjectResponse[]> {
  const projects = await prisma.project.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    include: {
      _count: {
        select: { generations: true },
      },
    },
  });

  return projects.map(mapProject);
}

export async function createProject(
  userId: string,
  input: CreateProjectInput,
): Promise<ProjectResponse> {
  const project = await prisma.project.create({
    data: {
      user_id: userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
    },
    include: {
      _count: {
        select: { generations: true },
      },
    },
  });

  return mapProject(project);
}
