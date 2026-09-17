import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';

async function tenantId(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'manage_menu');
  if (!auth.success || !auth.userId) return { error: auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) };
  if (!auth.tenantId) return { error: NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 }) };
  return { id: auth.tenantId };
}

export async function GET(request: NextRequest) {
  const result = await tenantId(request);
  if ('error' in result) return result.error;
  const products = await prisma.products.findMany({ where: { tenant_id: result.id, deleted_at: null }, include: { category: { select: { id: true, name: true } } }, orderBy: [{ sort_order: 'asc' }, { created_at: 'desc' }] });
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const result = await tenantId(request);
  if ('error' in result) return result.error;
  const body = await request.json().catch(() => ({})) as { name?: string; slug?: string; description?: string; composition?: string; price?: string; currency?: string; categoryId?: string; weight?: string; imageFileIds?: unknown; modifiers?: unknown; allergens?: unknown; preparationMinutes?: number; sortOrder?: number; isAvailable?: boolean; isFeatured?: boolean };
  const name = body.name?.trim() || '';
  const price = body.price?.trim() || '';
  if (!name || name.length > 200 || !price || !Number.isFinite(Number(price)) || Number(price) < 0) return NextResponse.json({ error: 'Название и корректная цена обязательны' }, { status: 400 });
  const slug = body.slug?.trim().toLowerCase() || name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '');
  const sortOrder = Number.isInteger(body.sortOrder) ? body.sortOrder as number : 0;
  const product = await prisma.products.create({ data: { tenant_id: result.id, category_id: body.categoryId || null, name, slug, description: body.description?.trim() || null, composition: body.composition?.trim() || null, price: new Prisma.Decimal(price), currency: body.currency?.trim().toUpperCase().slice(0, 3) || 'KGS', weight: body.weight ? new Prisma.Decimal(body.weight) : null, image_file_ids: body.imageFileIds as Prisma.InputJsonValue || undefined, modifiers: body.modifiers as Prisma.InputJsonValue || undefined, allergens: body.allergens as Prisma.InputJsonValue || undefined, preparation_minutes: Number.isInteger(body.preparationMinutes) ? body.preparationMinutes : null, sort_order: sortOrder, is_available: body.isAvailable !== false, is_featured: body.isFeatured === true } });
  return NextResponse.json({ product }, { status: 201 });
}