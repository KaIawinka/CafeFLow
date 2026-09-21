import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getPublicCafeContext } from '@/lib/public-context';
import { apiPublicMessage } from '@/lib/api-response';
import { calculatePromotionDiscount } from '@/lib/promotions/discount';

export async function POST(request: NextRequest) {
  const context = await getPublicCafeContext(request);
  if (!context) return NextResponse.json({ error: apiPublicMessage(request, 'cafeNotConfigured') }, { status: 503 });
  const body = await request.json().catch(() => ({})) as { code?: string; subtotal?: string | number; deliveryFee?: string | number };
  const code = body.code?.trim().toUpperCase();
  if (!code || body.subtotal === undefined || !Number.isFinite(Number(body.subtotal)) || Number(body.subtotal) < 0 || (body.deliveryFee !== undefined && (!Number.isFinite(Number(body.deliveryFee)) || Number(body.deliveryFee) < 0))) return NextResponse.json({ error: apiPublicMessage(request, 'promotionRequired') }, { status: 400 });
  const subtotal = new Prisma.Decimal(String(body.subtotal));
  const deliveryFee = new Prisma.Decimal(String(body.deliveryFee ?? 0));
  const promotion = await prisma.promotions.findFirst({ where: { tenant_id: context.tenant.id, code, is_active: true, OR: [{ starts_at: null }, { starts_at: { lte: new Date() } }], AND: [{ OR: [{ ends_at: null }, { ends_at: { gte: new Date() } }] }] } });
  if (!promotion) return NextResponse.json({ error: apiPublicMessage(request, 'promotionInvalid') }, { status: 404 });
  if (promotion.usage_limit !== null && promotion.usage_count >= promotion.usage_limit) return NextResponse.json({ error: apiPublicMessage(request, 'promotionLimit') }, { status: 409 });
  if (promotion.min_order_amount && subtotal.lt(promotion.min_order_amount)) return NextResponse.json({ error: apiPublicMessage(request, 'promotionMinimumAmount', { amount: promotion.min_order_amount.toString() }) }, { status: 409 });
  const discount = calculatePromotionDiscount({ type: promotion.type, value: promotion.value, subtotal, deliveryFee, maxDiscount: promotion.max_discount });
  return NextResponse.json({ promotion: { id: promotion.id, code: promotion.code, type: promotion.type }, discount: discount.toString(), subtotal: subtotal.toString() });
}
