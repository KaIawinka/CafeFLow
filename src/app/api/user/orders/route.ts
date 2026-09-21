import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload) return apiError(request, 'unauthorized', 401);
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') || 1));
  const pageSize = 20;
  const where = { user_id: payload.userId };
  const [orders, total] = await Promise.all([
    prisma.orders.findMany({ where, orderBy: { created_at: 'desc' }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, order_number: true, status: true, fulfillment_type: true, payment_status: true, total: true, currency: true, created_at: true, order_items: { select: { product_name: true, quantity: true, line_total: true } } } }),
    prisma.orders.count({ where }),
  ]);
  return NextResponse.json({ orders, pagination: { page, pageSize, total } });
}