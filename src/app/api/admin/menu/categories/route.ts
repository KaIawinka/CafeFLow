import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';

async function tenantId(request: NextRequest) {
  const auth = await verifyAdminOrManager(request);
  if (!auth.success || !auth.userId) return { error: auth.error || NextResponse.json({ error: 'Не авторизован' }, { status: 401 }) };
  const user = await prisma.users.findUnique({ where: { id: auth.userId }, select: { tenant_id: true } });
  if (!user?.tenant_id) return { error: NextResponse.json({ error: 'Tenant не настроен' }, { status: 409 }) };
  return { id: user.tenant_id };
}

export async function GET(request: NextRequest) {
  const result = await tenantId(request);
  if ('error' in result) return result.error;
  const categories = await prisma.menu_categories.findMany({ where: { tenant_id: result.id }, orderBy: [{ sort_order: 'asc' }, { name: 'asc' }] });
  return NextResponse.json({ categories });
}

export async function POST(request: NextRequest) {
  const result = await tenantId(request);
  if ('error' in result) return result.error;
  const body = await request.json().catch(() => ({})) as { name?: string; slug?: string; description?: string; parentId?: string; sortOrder?: number; isActive?: boolean };
  const name = body.name?.trim() || '';
  const slug = body.slug?.trim().toLowerCase() || name.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '');
  if (!name || name.length > 150 || !slug || slug.length > 150) return NextResponse.json({ error: 'Название и slug категории обязательны' }, { status: 400 });
  const sortOrder = Number.isInteger(body.sortOrder) ? body.sortOrder as number : 0;
  const category = await prisma.menu_categories.create({ data: { tenant_id: result.id, name, slug, description: body.description?.trim() || null, parent_id: body.parentId || null, sort_order: sortOrder, is_active: body.isActive !== false } });
  return NextResponse.json({ category }, { status: 201 });
}