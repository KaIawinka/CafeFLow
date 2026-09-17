import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';

async function scope(request: NextRequest, id: string) {
  const auth = await verifyAdminOrManager(request, 'manage_menu');
  if (!auth.success || !auth.userId) return { error: auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) };
  const user = await prisma.users.findUnique({ where: { id: auth.userId }, select: { tenant_id: true } });
  if (!user?.tenant_id) return { error: NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 }) };
  const category = await prisma.menu_categories.findFirst({ where: { id, tenant_id: user.tenant_id } });
  if (!category) return { error: NextResponse.json({ error: 'Категория не найдена' }, { status: 404 }) };
  return { category };
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await scope(request, id);
  if ('error' in result) return result.error;
  const body = await request.json().catch(() => ({})) as { name?: string; slug?: string; description?: string | null; parentId?: string | null; sortOrder?: number; isActive?: boolean };
  const category = await prisma.menu_categories.update({ where: { id }, data: { ...(body.name?.trim() ? { name: body.name.trim() } : {}), ...(body.slug?.trim() ? { slug: body.slug.trim().toLowerCase() } : {}), ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}), ...(body.parentId !== undefined ? { parent_id: body.parentId || null } : {}), ...(Number.isInteger(body.sortOrder) ? { sort_order: body.sortOrder } : {}), ...(typeof body.isActive === 'boolean' ? { is_active: body.isActive } : {}) } });
  return NextResponse.json({ category });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await scope(request, id);
  if ('error' in result) return result.error;
  const products = await prisma.products.count({ where: { category_id: id, deleted_at: null } });
  if (products) return NextResponse.json({ error: 'Нельзя удалить категорию с блюдами' }, { status: 409 });
  await prisma.menu_categories.delete({ where: { id } });
  return NextResponse.json({ success: true });
}