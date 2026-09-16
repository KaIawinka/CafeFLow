import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublicCafeContext } from '@/lib/public-context';

function serialize<T>(value: T): T { return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item)); }
function guestToken() { return randomBytes(48).toString('base64url'); }
function idempotencyKey() { return randomBytes(24).toString('base64url'); }
function orderNumber() { return `CF-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`; }

type OrderItemInput = { productId: string; quantity: number; comment?: string };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { customerName?: string; customerPhone?: string; tableId?: string; comment?: string; idempotencyKey?: string; items?: OrderItemInput[] };
    const customerName = body.customerName?.trim();
    const customerPhone = body.customerPhone?.trim() || 'guest';
    const requestIdempotencyKey = body.idempotencyKey?.trim() || request.cookies.get('guestOrderIdempotencyKey')?.value || idempotencyKey();
    const items = body.items || [];
    if (!customerName || customerName.length > 200 || customerPhone.length > 40 || !body.tableId || requestIdempotencyKey.length > 120 || !items.length || items.some((item) => !item.productId || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20)) {
      return NextResponse.json({ error: 'Укажите имя, столик и корректные позиции заказа' }, { status: 400 });
    }
    const context = await getPublicCafeContext();
    if (!context?.branch) return NextResponse.json({ error: 'Филиал кафе пока не настроен' }, { status: 503 });

    const existingOrder = await prisma.orders.findFirst({
      where: { tenant_id: context.tenant.id, idempotency_key: requestIdempotencyKey },
      select: { id: true, order_number: true, status: true, total: true, currency: true, created_at: true, guest_token: true },
    });
    if (existingOrder) {
      const response = NextResponse.json(serialize({ order: existingOrder }));
      response.cookies.set('guestOrderToken', existingOrder.guest_token || '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
      response.cookies.set('guestOrderIdempotencyKey', idempotencyKey(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24, path: '/' });
      return response;
    }

    const products = await prisma.products.findMany({ where: { tenant_id: context.tenant.id, id: { in: items.map((item) => item.productId) }, is_available: true, deleted_at: null }, select: { id: true, name: true, price: true, currency: true } });
    if (products.length !== new Set(items.map((item) => item.productId)).size) return NextResponse.json({ error: 'Одно из блюд больше недоступно' }, { status: 409 });
    const table = await prisma.restaurant_tables.findFirst({ where: { id: body.tableId, tenant_id: context.tenant.id, branch_id: context.branch.id, status: 'active' }, select: { id: true, name: true } });
    if (!table) return NextResponse.json({ error: 'Столик недоступен' }, { status: 409 });

    const lines = items.map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId)!;
      const unitPrice = Number(product.price);
      return { product_id: product.id, product_name: product.name, unit_price: unitPrice, quantity: item.quantity, modifiers_total: 0, discount_amount: 0, line_total: unitPrice * item.quantity, comment: item.comment?.trim() || null };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.line_total, 0);
    const token = guestToken();
    let order;
    try {
      order = await prisma.orders.create({ data: { tenant_id: context.tenant.id, branch_id: context.branch.id, order_number: orderNumber(), idempotency_key: requestIdempotencyKey, customer_name: customerName, customer_phone: customerPhone, fulfillment_type: 'dine_in', status: 'new', payment_status: 'pending', subtotal, discount_total: 0, delivery_fee: 0, total: subtotal, currency: context.tenant.currency, comment: body.comment?.trim() || null, delivery_address: { tableId: table.id, tableName: table.name }, guest_token: token, order_items: { create: lines } }, select: { id: true, order_number: true, status: true, total: true, currency: true, created_at: true, guest_token: true } });
    } catch (error) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
        const concurrentOrder = await prisma.orders.findFirst({
          where: { tenant_id: context.tenant.id, idempotency_key: requestIdempotencyKey },
          select: { id: true, order_number: true, status: true, total: true, currency: true, created_at: true, guest_token: true },
        });
        if (concurrentOrder) {
          const response = NextResponse.json(serialize({ order: concurrentOrder }));
          response.cookies.set('guestOrderToken', concurrentOrder.guest_token || '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
          response.cookies.set('guestOrderIdempotencyKey', idempotencyKey(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24, path: '/' });
          return response;
        }
      }
      throw error;
    }
    const response = NextResponse.json(serialize({ order }), { status: 201 });
    response.cookies.set('guestOrderToken', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 30, path: '/' });
    response.cookies.set('guestOrderIdempotencyKey', idempotencyKey(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24, path: '/' });
    return response;
  } catch (error) {
    console.error('Public order create error', error);
    return NextResponse.json({ error: 'Не удалось создать заказ' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || request.cookies.get('guestOrderToken')?.value;
  if (!token) return NextResponse.json({ error: 'Токен заказа обязателен' }, { status: 400 });
  try {
    const order = await prisma.orders.findUnique({ where: { guest_token: token }, include: { order_items: true } });
    if (!order) return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    return NextResponse.json(serialize({ order }));
  } catch (error) {
    console.error('Public order read error', error);
    return NextResponse.json({ error: 'Не удалось загрузить заказ' }, { status: 500 });
  }
}
