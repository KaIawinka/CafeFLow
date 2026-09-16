import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublicCafeContext } from '@/lib/public-context';

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item));
}

export async function GET() {
  try {
    const context = await getPublicCafeContext();
    if (!context) return NextResponse.json({ error: 'Кафе пока не настроено' }, { status: 503 });
    const products = await prisma.products.findMany({
      where: { tenant_id: context.tenant.id, is_available: true, deleted_at: null },
      select: { id: true, name: true, slug: true, description: true, price: true, currency: true, weight: true, image_file_ids: true, modifiers: true, allergens: true, preparation_minutes: true, sort_order: true, category: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    });
    return NextResponse.json(serialize({ tenant: context.tenant, branch: context.branch, products }));
  } catch (error) {
    console.error('Public menu error', error);
    return NextResponse.json({ error: 'Не удалось загрузить меню' }, { status: 500 });
  }
}
