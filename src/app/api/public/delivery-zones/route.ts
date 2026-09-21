import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { apiPublicMessage } from '@/lib/api-response';
import { getPublicCafeContext } from '@/lib/public-context';

export async function GET(request: NextRequest) {
  const context = await getPublicCafeContext(request);
  if (!context?.branch) return NextResponse.json({ error: apiPublicMessage(request, 'branchNotConfigured') }, { status: 503 });
  const zones = await prisma.delivery_zones.findMany({ where: { tenant_id: context.tenant.id, branch_id: context.branch.id, is_active: true }, select: { id: true, name: true, min_order_amount: true, delivery_fee: true, estimated_minutes: true }, orderBy: { name: 'asc' } });
  return NextResponse.json({ zones: zones.map((zone) => ({ ...zone, min_order_amount: zone.min_order_amount.toString(), delivery_fee: zone.delivery_fee.toString() })) });
}