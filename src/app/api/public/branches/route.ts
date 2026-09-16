import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPublicCafeContext } from '@/lib/public-context';

export async function GET(request: NextRequest) {
  const context = await getPublicCafeContext(request);
  if (!context) return NextResponse.json({ error: 'Кафе пока не настроено' }, { status: 503 });
  const branches = await prisma.branches.findMany({
    where: { tenant_id: context.tenant.id, status: 'active' },
    select: { id: true, name: true, code: true, address_text: true, phone: true, timezone: true },
    orderBy: { created_at: 'asc' },
  });
  return NextResponse.json({ tenant: context.tenant, selectedBranchId: context.branch?.id || null, branches });
}