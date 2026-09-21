import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdminOrManager } from '@/lib/api-middleware';
import { apiError, apiAdminMessage } from '@/lib/api-response';

async function tenantId(request: NextRequest) {
  const auth = await verifyAdminOrManager(request, 'manage_menu');
  if (!auth.success || !auth.userId) return { error: auth.error || apiError(request, 'unauthorized', 401) };
  if (!auth.tenantId) return { error: apiError(request, 'tenantNotConfigured', 409) };
  return { id: auth.tenantId };
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
  if (!name || name.length > 150 || !slug || slug.length > 150) return NextResponse.json({ error: apiAdminMessage(request, 'categoryInputInvalid') }, { status: 400 });
  const parentId = body.parentId?.trim() || null;
  if (parentId) {
    const parent = await prisma.menu_categories.findFirst({ where: { id: parentId, tenant_id: result.id }, select: { id: true } });
    if (!parent) return NextResponse.json({ error: apiAdminMessage(request, 'categoryNotFound') }, { status: 404 });
  }
  const sortOrder = Number.isInteger(body.sortOrder) ? body.sortOrder as number : 0;
  const category = await prisma.menu_categories.create({ data: { tenant_id: result.id, name, slug, description: body.description?.trim() || null, parent_id: parentId, sort_order: sortOrder, is_active: body.isActive !== false } });
  return NextResponse.json({ category }, { status: 201 });
}