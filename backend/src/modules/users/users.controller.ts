import type { Request, Response } from 'express';
import type { ApiSuccessResponse } from '@/types/api.types';
import type { AuthUser } from '@/types/auth.types';
import type { ProjectResponse } from '@/types/users.types';
import * as usersService from './users.service';

export async function getMe(
  req: Request,
  res: Response<ApiSuccessResponse<{ user: AuthUser }>>,
): Promise<void> {
  const result = await usersService.getProfile(req.user!.id);
  res.json({ success: true, data: result });
}

export async function updateMe(
  req: Request,
  res: Response<ApiSuccessResponse<{ user: AuthUser }>>,
): Promise<void> {
  const result = await usersService.updateProfile(req.user!.id, req.body);
  res.json({ success: true, data: result });
}

export async function changePassword(
  req: Request,
  res: Response<ApiSuccessResponse<{ message: string }>>,
): Promise<void> {
  const result = await usersService.changePassword(req.user!.id, req.body, res);
  res.json({ success: true, data: result, message: result.message });
}

export async function listProjects(
  req: Request,
  res: Response<ApiSuccessResponse<ProjectResponse[]>>,
): Promise<void> {
  const projects = await usersService.listProjects(req.user!.id);
  res.json({ success: true, data: projects });
}

export async function createProject(
  req: Request,
  res: Response<ApiSuccessResponse<ProjectResponse>>,
): Promise<void> {
  const project = await usersService.createProject(req.user!.id, req.body);
  res.status(201).json({ success: true, data: project });
}
