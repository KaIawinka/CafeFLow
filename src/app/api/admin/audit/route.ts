import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';
import { apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'view_audit');
  if (!auth.success || !auth.userId) return auth.error || apiError(request, 'unauthorized', 401);
  if (!auth.tenantId) return NextResponse.json({ logs: [], pagination: { page: 1, pageSize: 50, total: 0 } });
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
  const pageSize = 50;
  const action = request.nextUrl.searchParams.get('action')?.trim();
  const where = { tenant_id: auth.tenantId, ...(action ? { action: { startsWith: action } } : {}) };
  const [logs, total] = await Promise.all([
    prisma.activity_logs.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, action: true, entity_type: true, entity_id: true, before_data: true, after_data: true, actor_user_id: true, created_at: true } }),
    prisma.activity_logs.count({ where }),
  ]);
  return NextResponse.json({ logs, pagination: { page, pageSize, total } });
}