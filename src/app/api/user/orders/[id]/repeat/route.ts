import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const { id } = await params;
  const order = await prisma.orders.findFirst({ where: { id, user_id: payload.userId }, select: { tenant_id: true, branch_id: true, order_items: { select: { product_id: true, quantity: true } } } });
  if (!order?.branch_id) return NextResponse.json({ error: 'Заказ не найден или филиал недоступен' }, { status: 404 });
  const productIds = order.order_items.map((item) => item.product_id).filter((id): id is string => Boolean(id));
  const products = await prisma.products.findMany({ where: { tenant_id: order.tenant_id, id: { in: productIds }, is_available: true, deleted_at: null }, select: { id: true, name: true, price: true, currency: true } });
  const available = new Set(products.map((product) => product.id));
  const items = order.order_items.filter((item) => item.product_id && available.has(item.product_id)).map((item) => { const product = products.find((candidate) => candidate.id === item.product_id)!; return { productId: product.id, quantity: item.quantity, unitPrice: product.price.toString(), name: product.name, currency: product.currency }; });
  if (!items.length) return NextResponse.json({ error: 'Блюда из заказа больше недоступны' }, { status: 409 });
  const sessionKey = `user:${payload.userId}:${order.branch_id}`;
  const subtotal = items.reduce((sum, item) => sum.add(new Prisma.Decimal(item.unitPrice).mul(item.quantity)), new Prisma.Decimal(0));
  const cart = await prisma.carts.upsert({ where: { tenant_id_session_key: { tenant_id: order.tenant_id, session_key: sessionKey } }, create: { tenant_id: order.tenant_id, user_id: payload.userId, branch_id: order.branch_id, session_key: sessionKey, status: 'active', items, subtotal }, update: { branch_id: order.branch_id, status: 'active', items, subtotal } });
  return NextResponse.json({ cart: { id: cart.id, items: cart.items, subtotal: cart.subtotal } });
}