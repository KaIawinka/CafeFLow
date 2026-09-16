import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

type ActorResult = { user: { id: string; tenant_id: string }; error?: never } | { user?: never; error: NextResponse };

async function actor(request: NextRequest): Promise<ActorResult> {
  const token = request.cookies.get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload) return { error: NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) };
  const user = await prisma.users.findUnique({ where: { id: payload.userId }, select: { id: true, tenant_id: true } });
  if (!user?.tenant_id) return { error: NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 }) };
  return { user: { id: user.id, tenant_id: user.tenant_id } };
}

export async function GET(request: NextRequest) {
  const result = await actor(request);
  if ('error' in result) return result.error;
  const favorites = await prisma.favorites.findMany({ where: { tenant_id: result.user.tenant_id, user_id: result.user.id }, include: { product: { select: { id: true, name: true, slug: true, price: true, currency: true, image_file_ids: true, is_available: true } } }, orderBy: { created_at: 'desc' } });
  return NextResponse.json({ favorites });
}

export async function POST(request: NextRequest) {
  const result = await actor(request);
  if ('error' in result) return result.error;
  const body = await request.json().catch(() => ({})) as { productId?: string };
  if (!body.productId) return NextResponse.json({ error: 'Блюдо обязательно' }, { status: 400 });
  const product = await prisma.products.findFirst({ where: { id: body.productId, tenant_id: result.user.tenant_id, deleted_at: null }, select: { id: true } });
  if (!product) return NextResponse.json({ error: 'Блюдо не найдено' }, { status: 404 });
  const favorite = await prisma.favorites.upsert({ where: { user_id_product_id: { user_id: result.user.id, product_id: product.id } }, create: { tenant_id: result.user.tenant_id, user_id: result.user.id, product_id: product.id }, update: {} });
  return NextResponse.json({ favorite }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const result = await actor(request);
  if ('error' in result) return result.error;
  const productId = request.nextUrl.searchParams.get('productId');
  if (!productId) return NextResponse.json({ error: 'Блюдо обязательно' }, { status: 400 });
  await prisma.favorites.deleteMany({ where: { tenant_id: result.user.tenant_id, user_id: result.user.id, product_id: productId } });
  return NextResponse.json({ success: true });
}
