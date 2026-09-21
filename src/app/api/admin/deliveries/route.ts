import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';
import { deliveryStatuses, type DeliveryStatus } from '@/lib/orders/delivery-status';
import { apiError } from '@/lib/api-response';

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item));
}

function branchScope(auth: { branchIds?: string[] | null; branchId?: string | null }) {
  return auth.branchIds ? { branch_id: { in: auth.branchIds } } : auth.branchId ? { branch_id: auth.branchId } : {};
}

export async function GET(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'manage_orders');
  if (!auth.success || !auth.userId || !auth.tenantId) return auth.error || apiError(request, 'unauthorized', 401);
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
  const pageSize = 25;
  const requestedStatus = request.nextUrl.searchParams.get('status');
  const status = deliveryStatuses.includes(requestedStatus as DeliveryStatus) ? requestedStatus as DeliveryStatus : undefined;
  const orderScope = { tenant_id: auth.tenantId, ...branchScope(auth) };
  const where = { order: orderScope, ...(status ? { status } : {}) };
  const [deliveries, total, couriers] = await Promise.all([
    prisma.order_deliveries.findMany({
      where,
      orderBy: [{ status: 'asc' }, { created_at: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        order: { select: { id: true, order_number: true, branch_id: true, customer_name: true, customer_phone: true, status: true, total: true, currency: true, desired_at: true } },
        courier: { select: { id: true, first_name: true, last_name: true, phone: true } },
        zone: { select: { id: true, name: true, estimated_minutes: true } },
        events: { take: 1, orderBy: { created_at: 'desc' }, select: { from_status: true, to_status: true, reason: true, created_at: true } },
      },
    }),
    prisma.order_deliveries.count({ where }),
    prisma.users.findMany({
      where: {
        tenant_id: auth.tenantId,
        status: 'active',
        role: { in: ['employee', 'manager'] },
        ...(auth.branchIds ? { branch_memberships: { some: { branch_id: { in: auth.branchIds }, status: 'active' } } } : auth.branchId ? { branch_memberships: { some: { branch_id: auth.branchId, status: 'active' } } } : {}),
      },
      orderBy: [{ first_name: 'asc' }, { last_name: 'asc' }],
      select: { id: true, first_name: true, last_name: true, phone: true, branch_memberships: { where: { status: 'active' }, select: { branch_id: true } } },
    }),
  ]);
  return NextResponse.json(serialize({ deliveries, couriers, pagination: { page, pageSize, total } }));
}