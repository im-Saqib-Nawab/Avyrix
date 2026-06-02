import type { Request, Response } from 'express';
import type { ApiSuccessResponse, PaginatedResponse } from '@/types/api.types';
import type { AdminStatsResponse, AdminUserListItem, ApiHealthResponse } from '@/types/admin.types';
import * as adminService from './admin.service';
import * as apiHealthService from '@/modules/api-health/apiHealth.service';
import type { ListGenerationsQuery, ListLogsQuery, ListUsersQuery } from './admin.schema';

export async function getStats(
  _req: Request,
  res: Response<ApiSuccessResponse<AdminStatsResponse>>,
): Promise<void> {
  const stats = await adminService.getAdminStats();
  res.json({ success: true, data: stats });
}

export async function listUsers(
  req: Request,
  res: Response<PaginatedResponse<AdminUserListItem>>,
): Promise<void> {
  const query = req.query as unknown as ListUsersQuery;
  const result = await adminService.listUsers(query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getUser(
  req: Request,
  res: Response<ApiSuccessResponse<Awaited<ReturnType<typeof adminService.getUserById>>>>,
): Promise<void> {
  const result = await adminService.getUserById(req.params.id);
  res.json({ success: true, data: result });
}

export async function adjustCredits(
  req: Request,
  res: Response<ApiSuccessResponse<Awaited<ReturnType<typeof adminService.adjustUserCredits>>>>,
): Promise<void> {
  const result = await adminService.adjustUserCredits(
    req.user!.id,
    req.params.id,
    req.body,
  );
  res.json({ success: true, data: result });
}

export async function listGenerations(
  req: Request,
  res: Response<PaginatedResponse<adminService.AdminGenerationItem>>,
): Promise<void> {
  const query = req.query as unknown as ListGenerationsQuery;
  const result = await adminService.listAllGenerations(query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function listLogs(
  req: Request,
  res: Response<PaginatedResponse<Awaited<ReturnType<typeof adminService.listSystemLogs>>['data'][number]>>,
): Promise<void> {
  const query = req.query as unknown as ListLogsQuery;
  const result = await adminService.listSystemLogs(query);
  res.json({ success: true, data: result.data, pagination: result.pagination });
}

export async function getApiHealth(
  _req: Request,
  res: Response<ApiSuccessResponse<ApiHealthResponse>>,
): Promise<void> {
  const health = await apiHealthService.getApiHealth();
  res.json({ success: true, data: health });
}

export async function refreshApiHealth(
  _req: Request,
  res: Response<ApiSuccessResponse<ApiHealthResponse>>,
): Promise<void> {
  const health = await apiHealthService.refreshApiHealth();
  res.json({ success: true, data: health });
}
