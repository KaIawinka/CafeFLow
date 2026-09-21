import { randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPublicCafeContext } from '@/lib/public-context';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { addressSnapshot } from '@/lib/customer-address';
import { apiPublicMessage } from '@/lib/api-response';

function serialize<T>(value: T): T { return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item)); }
function guestToken() { return randomBytes(48).toString('base64url'); }
function idempotencyKey() { return randomBytes(24).toString('base64url'); }
function orderNumber() { return `CF-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`; }

type StoredCartItem = { productId?: unknown; quantity?: unknown };

async function getOrderingUser(request: NextRequest, tenantId: string) {
  const token = request.cookies.get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  if (!payload) return null;
  return prisma.users.findFirst({
    where: { id: payload.userId, tenant_id: tenantId, status: 'active' },
    select: { id: true },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { customerName?: string; customerPhone?: string; tableId?: string; comment?: string; idempotencyKey?: string; fulfillmentType?: 'dine_in' | 'pickup' | 'delivery'; paymentMethod?: 'cash' | 'card' | 'online' | 'other'; deliveryAddress?: Record<string, unknown>; addressId?: string; zoneId?: string; desiredAt?: string; promoCode?: string };
    const customerName = body.customerName?.trim();
    const customerPhone = body.customerPhone?.trim() || 'guest';
    const fulfillmentType = body.fulfillmentType || 'dine_in';
    const paymentMethod = body.paymentMethod || 'cash';
    const promoCode = body.promoCode?.trim().toUpperCase() || null;
    const requestIdempotencyKey = body.idempotencyKey?.trim() || request.cookies.get('guestOrderIdempotencyKey')?.value || idempotencyKey();
    if (!customerName || customerName.length > 200 || customerPhone.length > 40 || !['dine_in', 'pickup', 'delivery'].includes(fulfillmentType) || !['cash', 'card', 'online', 'other'].includes(paymentMethod) || requestIdempotencyKey.length > 120) {
      return NextResponse.json({ error: apiPublicMessage(request, 'orderInputInvalid') }, { status: 400 });
    }
    const context = await getPublicCafeContext(request);
    if (!context?.branch) return NextResponse.json({ error: apiPublicMessage(request, 'branchNotConfigured') }, { status: 503 });
    const branch = context.branch;
    const orderingUser = await getOrderingUser(request, context.tenant.id);
    let deliveryAddress: Record<string, unknown> | undefined = body.deliveryAddress;
    const addressId = body.addressId?.trim();
    if (addressId) {
      if (fulfillmentType !== 'delivery') return NextResponse.json({ error: apiPublicMessage(request, 'savedAddressDeliveryOnly') }, { status: 400 });
      if (!orderingUser) return NextResponse.json({ error: apiPublicMessage(request, 'savedAddressAuthRequired') }, { status: 401 });
      const savedAddress = await prisma.customer_addresses.findFirst({
        where: { id: addressId, tenant_id: context.tenant.id, user_id: orderingUser.id },
        select: { id: true, label: true, address_text: true, entrance: true, floor: true, apartment: true, comment: true, latitude: true, longitude: true },
      });
      if (!savedAddress) return NextResponse.json({ error: apiPublicMessage(request, 'savedAddressNotFound') }, { status: 404 });
      deliveryAddress = addressSnapshot(savedAddress);
    }

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

    const cartSession = request.cookies.get('guestCartSession')?.value;
    if (!cartSession) return NextResponse.json({ error: apiPublicMessage(request, 'cartStale') }, { status: 409 });
    const cart = await prisma.carts.findFirst({ where: { tenant_id: context.tenant.id, branch_id: branch.id, session_key: cartSession, status: 'active' }, select: { id: true, items: true } });
    const storedItems = Array.isArray(cart?.items) ? cart.items as StoredCartItem[] : [];
    const quantities = new Map<string, number>();
    for (const item of storedItems) {
      if (typeof item.productId !== 'string' || !Number.isInteger(item.quantity) || Number(item.quantity) < 1 || Number(item.quantity) > 20) {
        return NextResponse.json({ error: apiPublicMessage(request, 'cartInvalidItems') }, { status: 409 });
      }
      quantities.set(item.productId, (quantities.get(item.productId) || 0) + Number(item.quantity));
    }
    const productIds = [...quantities.keys()];
    if (!cart || !productIds.length) return NextResponse.json({ error: apiPublicMessage(request, 'cartStale') }, { status: 409 });
    const products = await prisma.products.findMany({ where: { tenant_id: context.tenant.id, id: { in: productIds }, is_available: true, deleted_at: null }, select: { id: true, name: true, price: true, currency: true } });
    if (products.length !== productIds.length) return NextResponse.json({ error: apiPublicMessage(request, 'cartProductUnavailable') }, { status: 409 });
    const table = fulfillmentType === 'dine_in'
      ? await prisma.restaurant_tables.findFirst({ where: { id: body.tableId, tenant_id: context.tenant.id, branch_id: branch.id, status: 'active' }, select: { id: true, name: true } })
      : null;
    if (fulfillmentType === 'dine_in' && !table) return NextResponse.json({ error: apiPublicMessage(request, 'tableUnavailable') }, { status: 409 });
    if (fulfillmentType === 'delivery' && (!deliveryAddress || typeof deliveryAddress.addressText !== 'string' || !deliveryAddress.addressText.trim() || deliveryAddress.addressText.length > 500 || !body.zoneId)) return NextResponse.json({ error: apiPublicMessage(request, 'deliveryAddressRequired') }, { status: 400 });
    const zone = fulfillmentType === 'delivery' && body.zoneId
      ? await prisma.delivery_zones.findFirst({ where: { id: body.zoneId, tenant_id: context.tenant.id, branch_id: branch.id, is_active: true }, select: { id: true, delivery_fee: true, min_order_amount: true, estimated_minutes: true } })
      : null;
    if (fulfillmentType === 'delivery' && !zone) return NextResponse.json({ error: apiPublicMessage(request, 'deliveryZoneUnavailable') }, { status: 409 });

    const lines = products.map((product) => {
      const unitPrice = product.price;
      const quantity = quantities.get(product.id)!;
      return { product_id: product.id, product_name: product.name, unit_price: unitPrice, quantity, modifiers_total: new Prisma.Decimal(0), discount_amount: new Prisma.Decimal(0), line_total: unitPrice.mul(quantity), comment: null };
    });
    const subtotal = lines.reduce((sum, line) => sum.add(line.line_total), new Prisma.Decimal(0));
    if (zone && subtotal.lt(zone.min_order_amount)) return NextResponse.json({ error: apiPublicMessage(request, 'deliveryMinimumAmount', { amount: zone.min_order_amount.toString() }) }, { status: 409 });
    const deliveryFee = zone?.delivery_fee || new Prisma.Decimal(0);
    let promotionId: string | null = null;
    let promotionUsageLimit: number | null = null;
    let discountTotal = new Prisma.Decimal(0);
    if (promoCode) {
      const promotion = await prisma.promotions.findFirst({ where: { tenant_id: context.tenant.id, code: promoCode, is_active: true, OR: [{ starts_at: null }, { starts_at: { lte: new Date() } }], AND: [{ OR: [{ ends_at: null }, { ends_at: { gte: new Date() } }] }] }, select: { id: true, type: true, value: true, min_order_amount: true, max_discount: true, usage_limit: true, usage_count: true } });
      if (!promotion) return NextResponse.json({ error: apiPublicMessage(request, 'promotionInvalid') }, { status: 404 });
      if (promotion.usage_limit !== null && promotion.usage_count >= promotion.usage_limit) return NextResponse.json({ error: apiPublicMessage(request, 'promotionLimit') }, { status: 409 });
      if (promotion.min_order_amount && subtotal.lt(promotion.min_order_amount)) return NextResponse.json({ error: apiPublicMessage(request, 'promotionMinimumAmount', { amount: promotion.min_order_amount.toString() }) }, { status: 409 });
      discountTotal = promotion.type === 'percent' ? subtotal.mul(promotion.value).div(100) : promotion.type === 'fixed' ? promotion.value : promotion.type === 'free_delivery' ? deliveryFee : new Prisma.Decimal(0);
      if (promotion.max_discount && discountTotal.gt(promotion.max_discount)) discountTotal = promotion.max_discount;
      if (discountTotal.gt(subtotal.add(deliveryFee))) discountTotal = subtotal.add(deliveryFee);
      promotionId = promotion.id;
      promotionUsageLimit = promotion.usage_limit;
    }
    const total = subtotal.add(deliveryFee).sub(discountTotal);
    const desiredAt = body.desiredAt ? new Date(body.desiredAt) : null;
    if (desiredAt && Number.isNaN(desiredAt.getTime())) return NextResponse.json({ error: apiPublicMessage(request, 'desiredTimeInvalid') }, { status: 400 });
    const token = guestToken();
    const newOrderNumber = orderNumber();
    const staff = await prisma.users.findMany({
      where: { tenant_id: context.tenant.id, status: 'active', role: { in: ['admin', 'manager', 'kitchen', 'employee'] } },
      select: { id: true },
    });
    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        const orderAddress = fulfillmentType === 'dine_in' ? { tableId: table?.id, tableName: table?.name } : deliveryAddress;
        const jsonDeliveryAddress = orderAddress ? orderAddress as Prisma.InputJsonValue : Prisma.JsonNull;
        if (promotionId) {
          const consumed = await tx.promotions.updateMany({ where: { id: promotionId, tenant_id: context.tenant.id, is_active: true, ...(promoCode ? { code: promoCode } : {}), ...(promotionUsageLimit === null ? {} : { OR: [{ usage_limit: null }, { usage_count: { lt: promotionUsageLimit } }] }) }, data: { usage_count: { increment: 1 } } });
          if (consumed.count !== 1) throw new Error('PROMOTION_UNAVAILABLE');
        }
        const createdOrder = await tx.orders.create({ data: { tenant_id: context.tenant.id, branch_id: branch.id, user_id: orderingUser?.id || null, order_number: newOrderNumber, idempotency_key: requestIdempotencyKey, customer_name: customerName, customer_phone: customerPhone, fulfillment_type: fulfillmentType, status: 'new', payment_status: 'pending', promotion_id: promotionId, subtotal, discount_total: discountTotal, delivery_fee: deliveryFee, total, currency: context.tenant.currency, desired_at: desiredAt, comment: body.comment?.trim() || null, delivery_address: jsonDeliveryAddress, guest_token: token, order_items: { create: lines }, payment: { create: { tenant_id: context.tenant.id, method: paymentMethod, amount: total, currency: context.tenant.currency, status: 'pending' } }, ...(fulfillmentType === 'delivery' && zone ? { order_delivery: { create: { zone_id: zone.id, address_snapshot: deliveryAddress as Prisma.InputJsonValue, status: 'pending' } } } : {}) }, select: { id: true, order_number: true, status: true, total: true, currency: true, created_at: true, guest_token: true } });
        if (fulfillmentType === 'delivery') {
          const createdDelivery = await tx.order_deliveries.findUnique({ where: { order_id: createdOrder.id }, select: { id: true } });
          if (createdDelivery) await tx.order_delivery_events.create({ data: { delivery_id: createdDelivery.id, to_status: 'pending', reason: 'Delivery created' } });
        }
        if (staff.length) {
          await tx.notifications.createMany({ data: staff.map((member) => ({ tenant_id: context.tenant.id, user_id: member.id, channel: 'in_app' as const, type: 'order_status' as const, subject: 'Новый заказ', body: `Заказ ${newOrderNumber} ожидает подтверждения`, status: 'queued' as const, attempts: 0 })) });
        }
        const converted = await tx.carts.updateMany({ where: { id: cart.id, status: 'active' }, data: { status: 'converted', items: [], subtotal: 0 } });
        if (converted.count !== 1) throw new Error('CART_ALREADY_CONVERTED');
        return createdOrder;
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'CART_ALREADY_CONVERTED') {
        return NextResponse.json({ error: apiPublicMessage(request, 'cartAlreadyUsed') }, { status: 409 });
      }
      if (error instanceof Error && error.message === 'PROMOTION_UNAVAILABLE') {
        return NextResponse.json({ error: apiPublicMessage(request, 'promotionUnavailable') }, { status: 409 });
      }
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
    return NextResponse.json({ error: apiPublicMessage(request, 'orderCreateFailed') }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') || request.cookies.get('guestOrderToken')?.value;
  if (!token) return NextResponse.json({ error: apiPublicMessage(request, 'orderTokenRequired') }, { status: 400 });
  try {
    const context = await getPublicCafeContext(request);
    if (!context) return NextResponse.json({ error: apiPublicMessage(request, 'cafeNotConfigured') }, { status: 503 });
    const order = await prisma.orders.findFirst({ where: { guest_token: token, tenant_id: context.tenant.id }, include: { order_items: true } });
    if (!order) return NextResponse.json({ error: apiPublicMessage(request, 'orderNotFound') }, { status: 404 });
    return NextResponse.json(serialize({ order }));
  } catch (error) {
    console.error('Public order read error', error);
    return NextResponse.json({ error: apiPublicMessage(request, 'orderLoadFailed') }, { status: 500 });
  }
}
