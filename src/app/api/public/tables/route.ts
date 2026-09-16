import { randomBytes } from 'node:crypto';
import { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getPublicCafeContext } from '@/lib/public-context';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const context = await getPublicCafeContext();
    if (!context?.branch) return NextResponse.json({ error: 'Филиал кафе пока не настроен' }, { status: 503 });
    const tables = await prisma.restaurant_tables.findMany({ where: { tenant_id: context.tenant.id, branch_id: context.branch.id, status: 'active' }, select: { id: true, name: true, zone: true, capacity: true, position: true }, orderBy: { name: 'asc' } });
    const response = NextResponse.json({ tables });
    if (!request.cookies.get('guestOrderIdempotencyKey')) {
      response.cookies.set('guestOrderIdempotencyKey', randomBytes(24).toString('base64url'), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24, path: '/' });
    }
    return response;
  } catch {
    return NextResponse.json({ error: 'Не удалось загрузить столики' }, { status: 500 });
  }
}
