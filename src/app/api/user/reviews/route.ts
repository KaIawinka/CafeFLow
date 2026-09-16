import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const user = await prisma.users.findUnique({ where: { id: payload.userId }, select: { id: true, tenant_id: true } });
  if (!user?.tenant_id) return NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 });
  const body = await request.json().catch(() => ({})) as { orderId?: string; productId?: string; rating?: number; text?: string };
  if (!Number.isInteger(body.rating) || Number(body.rating) < 1 || Number(body.rating) > 5 || (body.text && body.text.length > 4000)) return NextResponse.json({ error: 'Оценка и текст отзыва некорректны' }, { status: 400 });
  if (!body.orderId && !body.productId) return NextResponse.json({ error: 'Заказ или блюдо обязательно' }, { status: 400 });
  const order = body.orderId ? await prisma.orders.findFirst({ where: { id: body.orderId, tenant_id: user.tenant_id, user_id: user.id, status: 'completed' }, select: { id: true } }) : null;
  if (body.orderId && !order) return NextResponse.json({ error: 'Можно оставить отзыв только по завершённому заказу' }, { status: 403 });
  if (body.productId) {
    const product = await prisma.products.findFirst({ where: { id: body.productId, tenant_id: user.tenant_id, deleted_at: null }, select: { id: true } });
    if (!product) return NextResponse.json({ error: 'Блюдо не найдено' }, { status: 404 });
  }
  const review = await prisma.reviews.create({ data: { tenant_id: user.tenant_id, user_id: user.id, order_id: order?.id || null, product_id: body.productId || null, rating: body.rating as number, text: body.text?.trim() || null, status: 'pending' } });
  return NextResponse.json({ review }, { status: 201 });
}
