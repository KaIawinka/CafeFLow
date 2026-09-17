import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';

async function scope(request: NextRequest, id: string) {
  const auth = await verifyAdminOrManager(request, 'manage_menu');
  if (!auth.success || !auth.userId) return { error: auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) };
  if (!auth.tenantId) return { error: NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 }) };
  const product = await prisma.products.findFirst({ where: { id, tenant_id: auth.tenantId, deleted_at: null } });
  if (!product) return { error: NextResponse.json({ error: 'Блюдо не найдено' }, { status: 404 }) };
  return { product };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await scope(request, id);
  if ('error' in result) return result.error;
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const product = await prisma.products.update({ where: { id }, data: { ...(typeof body.name === 'string' && body.name.trim() ? { name: body.name.trim() } : {}), ...(typeof body.slug === 'string' && body.slug.trim() ? { slug: body.slug.trim().toLowerCase() } : {}), ...(typeof body.description === 'string' ? { description: body.description.trim() } : {}), ...(typeof body.composition === 'string' ? { composition: body.composition.trim() } : {}), ...(typeof body.price === 'string' && Number.isFinite(Number(body.price)) && Number(body.price) >= 0 ? { price: new Prisma.Decimal(body.price) } : {}), ...(typeof body.categoryId === 'string' ? { category_id: body.categoryId || null } : {}), ...(typeof body.preparationMinutes === 'number' ? { preparation_minutes: body.preparationMinutes } : {}), ...(typeof body.sortOrder === 'number' ? { sort_order: body.sortOrder } : {}), ...(typeof body.isAvailable === 'boolean' ? { is_available: body.isAvailable } : {}), ...(typeof body.isFeatured === 'boolean' ? { is_featured: body.isFeatured } : {}), ...(body.modifiers !== undefined ? { modifiers: body.modifiers as Prisma.InputJsonValue } : {}), ...(body.allergens !== undefined ? { allergens: body.allergens as Prisma.InputJsonValue } : {}), ...(body.imageFileIds !== undefined ? { image_file_ids: body.imageFileIds as Prisma.InputJsonValue } : {}) } });
  return NextResponse.json({ product });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await scope(request, id);
  if ('error' in result) return result.error;
  await prisma.products.update({ where: { id }, data: { deleted_at: new Date(), is_available: false } });
  return NextResponse.json({ success: true });
}