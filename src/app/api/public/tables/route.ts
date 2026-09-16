import { NextResponse } from 'next/server';
import { getPublicCafeContext } from '@/lib/public-context';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const context = await getPublicCafeContext();
    if (!context?.branch) return NextResponse.json({ error: 'Филиал кафе пока не настроен' }, { status: 503 });
    const tables = await prisma.restaurant_tables.findMany({ where: { tenant_id: context.tenant.id, branch_id: context.branch.id, status: 'active' }, select: { id: true, name: true, zone: true, capacity: true, position: true }, orderBy: { name: 'asc' } });
    return NextResponse.json({ tables });
  } catch {
    return NextResponse.json({ error: 'Не удалось загрузить столики' }, { status: 500 });
  }
}
