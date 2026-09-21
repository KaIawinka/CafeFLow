/**
 * API Middleware Helpers
 * Общие функции для проверки авторизации в API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { branch_capability } from '@prisma/client';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';
import { apiError } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { resolveAdminContext } from '@/lib/tenant-context';

export interface AuthResult {
  success: boolean;
  userId?: string;
  role?: string;
  tenantId?: string | null;
  branchId?: string | null;
  branchIds?: string[] | null;
  error?: NextResponse;
}

/**
 * Проверяет JWT токен из cookie
 * Возвращает userId и role или ошибку
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    const token = request.cookies.get('accessToken')?.value;

    if (!token) {
      return { success: false, error: apiError(request, 'unauthorized', 401) };
    }

    const payload = await verifyAccessToken(token);

    if (!payload) {
      return { success: false, error: apiError(request, 'invalidToken', 401) };
    }

    return {
      success: true,
      userId: payload.userId,
      role: payload.role,
    };
  } catch (error) {
    logger.error('Auth verification error:', error);
    return { success: false, error: apiError(request, 'authFailure', 500) };
  }
}

/**
 * Проверяет что пользователь - админ
 */
export async function verifyAdmin(request: NextRequest): Promise<AuthResult> {
  const auth = await verifyAuth(request);

  if (!auth.success) {
    return auth;
  }

  if (auth.role !== 'admin') {
    return { success: false, error: apiError(request, 'adminRequired', 403) };
  }
  if (!auth.userId) return { success: false, error: apiError(request, 'unauthorized', 401) };

  const user = await prisma.users.findUnique({ where: { id: auth.userId }, select: { status: true, branch_id: true } });
  if (!user || user.status !== 'active') {
    return { success: false, error: apiError(request, 'accountUnavailable', 403) };
  }
  if (user.branch_id) {
    const membership = await prisma.branch_memberships.findFirst({ where: { user_id: auth.userId, branch_id: user.branch_id, status: 'active', capabilities: { some: { capability: 'manage_domains' } } }, select: { id: true } });
    if (!membership) return { success: false, error: apiError(request, 'branchAccessDenied', 403) };
  }

  const context = await resolveAdminContext(auth.userId);
  return { ...auth, tenantId: context?.tenantId, branchId: context?.branchId, branchIds: context?.branchIds };
}

/**
 * Проверяет что пользователь - админ или менеджер
 */
export async function verifyAdminOrManager(request: NextRequest, capability?: string): Promise<AuthResult> {
  const auth = await verifyAuth(request);

  if (!auth.success) {
    return auth;
  }

  if (auth.role !== 'admin' && auth.role !== 'manager') {
    return { success: false, error: apiError(request, 'adminOrManagerRequired', 403) };
  }
  if (!auth.userId) return { success: false, error: apiError(request, 'unauthorized', 401) };

  const user = await prisma.users.findUnique({
    where: { id: auth.userId },
    select: { status: true, branch_id: true },
  });
  if (!user || user.status !== 'active') {
    return {
      success: false,
      error: apiError(request, 'accountUnavailable', 403),
    };
  }

  if (user.branch_id) {
    const membership = await prisma.branch_memberships.findFirst({
      where: {
        user_id: auth.userId,
        branch_id: user.branch_id,
        status: 'active',
        ...(capability ? { capabilities: { some: { capability: capability as branch_capability } } } : {}),
      },
      select: { id: true },
    });
    if (!membership) {
      return {
        success: false,
        error: apiError(request, 'branchAccessDenied', 403),
      };
    }
  }

  const context = await resolveAdminContext(auth.userId);
  return { ...auth, tenantId: context?.tenantId, branchId: context?.branchId, branchIds: context?.branchIds };
}
