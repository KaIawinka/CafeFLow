import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPublicCafeContext } from '@/lib/public-context';

const cartCookie = 'guestCartSession';
const maxQuantity = 20;
type CartInput = { productId: string; quantity: number };

function sessionKey() { return randomBytes(32).toString('base64url'); }
function serialize<T>(value: T): T { return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item)); }

async function getCartContext(request: NextRequest) {
  const context = await getPublicCafeContext(request);
  if (!context?.branch) return null;
  const existingSession = request.cookies.get(cartCookie)?.value;
  return { ...context, sessionKey: existingSession || sessionKey() };
}

async function loadCart(tenantId: string, session: string) {
  return prisma.carts.findFirst({ where: { tenant_id: tenantId, session_key: session, status: 'active' } });
}

function responseWithCart(cart: unknown, session: string, status = 200) {
  const response = NextResponse.json(serialize({ cart }), { status });
  response.cookies.set(cartCookie, session, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
  return response;
}

export async function GET(request: NextRequest) {
  try {
    const context = await getCartContext(request);
    if (!context) return NextResponse.json({ error: 'Филиал кафе пока не настроен' }, { status: 503 });
    const cart = await loadCart(context.tenant.id, context.sessionKey);
    return responseWithCart(cart || { items: [], subtotal: 0, status: 'active' }, context.sessionKey);
  } catch (error) {
    console.error('Public cart read error', error);
    return NextResponse.json({ error: 'Не удалось загрузить корзину' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const context = await getCartContext(request);
    if (!context) return NextResponse.json({ error: 'Филиал кафе пока не настроен' }, { status: 503 });
    if (!context.branch) return NextResponse.json({ error: 'Филиал кафе пока не настроен' }, { status: 503 });
    const branch = context.branch;

    const body = await request.json() as { items?: CartInput[] };
    const input = body.items || [];
    if (!Array.isArray(input) || input.length > 100 || input.some((item) => !item?.productId || !Number.isInteger(item.quantity) || item.quantity < 0 || item.quantity > maxQuantity)) {
      return NextResponse.json({ error: 'Некорректное содержимое корзины' }, { status: 400 });
    }

    const quantities = new Map<string, number>();
    for (const item of input) quantities.set(item.productId, (quantities.get(item.productId) || 0) + item.quantity);
    const productIds = [...quantities.entries()].filter(([, quantity]) => quantity > 0).map(([productId]) => productId);
    const products = await prisma.products.findMany({
      where: { tenant_id: context.tenant.id, id: { in: productIds }, is_available: true, deleted_at: null },
      select: { id: true, name: true, price: true, currency: true },
    });
    if (products.length !== productIds.length) return NextResponse.json({ error: 'Одно из блюд больше недоступно' }, { status: 409 });

    const items = products.map((product) => ({ productId: product.id, quantity: quantities.get(product.id) || 0, unitPrice: product.price.toString(), name: product.name, currency: product.currency }));
    const subtotal = items.reduce((sum, item) => sum.add(new Prisma.Decimal(item.unitPrice).mul(item.quantity)), new Prisma.Decimal(0));
    const existing = await loadCart(context.tenant.id, context.sessionKey);
    const cart = existing
      ? await prisma.carts.update({ where: { id: existing.id }, data: { branch_id: branch.id, items, subtotal }, select: { id: true, items: true, subtotal: true, status: true, updated_at: true } })
      : await prisma.carts.create({ data: { tenant_id: context.tenant.id, branch_id: branch.id, session_key: context.sessionKey, status: 'active', items, subtotal }, select: { id: true, items: true, subtotal: true, status: true, updated_at: true } });
    return responseWithCart(cart, context.sessionKey);
  } catch (error) {
    console.error('Public cart update error', error);
    return NextResponse.json({ error: 'Не удалось сохранить корзину' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const context = await getCartContext(request);
    if (!context) return NextResponse.json({ error: 'Филиал кафе пока не настроен' }, { status: 503 });
    await prisma.carts.updateMany({ where: { tenant_id: context.tenant.id, session_key: context.sessionKey, status: 'active' }, data: { status: 'abandoned', items: [], subtotal: 0 } });
    return responseWithCart({ items: [], subtotal: 0, status: 'abandoned' }, context.sessionKey);
  } catch (error) {
    console.error('Public cart delete error', error);
    return NextResponse.json({ error: 'Не удалось очистить корзину' }, { status: 500 });
  }
}
