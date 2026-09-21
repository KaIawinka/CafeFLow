import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';
import { apiError } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload) return apiError(request, 'unauthorized', 401);
  const reservations = await prisma.reservations.findMany({ where: { user_id: payload.userId }, orderBy: { start_at: 'desc' }, take: 100, select: { id: true, guest_name: true, guests_count: true, start_at: true, end_at: true, status: true, comment: true, created_at: true } });
  return NextResponse.json({ reservations });
}