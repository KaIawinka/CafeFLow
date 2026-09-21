import { randomBytes } from 'node:crypto';
import { resolveTxt } from 'node:dns/promises';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAdmin } from '@/lib/api-middleware';
import { apiAdminMessage, apiError } from '@/lib/api-response';

function normalizeHostname(value: string): string | null {
  const hostname = value.trim().toLowerCase().replace(/\.$/, '');
  if (!/^(?=.{1,255}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(hostname)) return null;
  return hostname;
}

type ActorResult =
  | { user: { id: string; tenant_id: string }; error?: never }
  | { user?: never; error: NextResponse };

async function actor(request: NextRequest): Promise<ActorResult> {
  const auth = await verifyAdmin(request);
  if (!auth.success || !auth.userId) return { error: auth.error || apiError(request, 'unauthorized', 401) };
  if (!auth.tenantId) return { error: apiError(request, 'tenantNotConfigured', 409) };
  return { user: { id: auth.userId, tenant_id: auth.tenantId } };
}

export async function GET(request: NextRequest) {
  const result = await actor(request);
  if ('error' in result) return result.error;
  const domains = await prisma.tenant_domains.findMany({ where: { tenant_id: result.user.tenant_id }, orderBy: { created_at: 'desc' }, select: { id: true, hostname: true, status: true, verification_token: true, verified_at: true, created_at: true } });
  return NextResponse.json({ domains });
}

export async function POST(request: NextRequest) {
  const result = await actor(request);
  if ('error' in result) return result.error;
  const body = await request.json().catch(() => ({})) as { hostname?: string };
  const hostname = body.hostname ? normalizeHostname(body.hostname) : null;
  if (!hostname) return NextResponse.json({ error: apiAdminMessage(request, 'invalidDomainName') }, { status: 400 });
  const token = `cafeflow-verification=${randomBytes(32).toString('hex')}`;
  try {
    const domain = await prisma.tenant_domains.create({ data: { tenant_id: result.user.tenant_id, hostname, verification_token: token }, select: { id: true, hostname: true, status: true, verification_token: true } });
    return NextResponse.json({ domain, dns: { type: 'TXT', name: `_cafeflow.${hostname}`, value: token } }, { status: 201 });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') return NextResponse.json({ error: apiAdminMessage(request, 'domainAlreadyRegistered') }, { status: 409 });
    return NextResponse.json({ error: apiAdminMessage(request, 'domainCreateFailed') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const result = await actor(request);
  if ('error' in result) return result.error;
  const body = await request.json().catch(() => ({})) as { id?: string };
  if (!body.id) return NextResponse.json({ error: apiAdminMessage(request, 'domainRequired') }, { status: 400 });
  const domain = await prisma.tenant_domains.findFirst({ where: { id: body.id, tenant_id: result.user.tenant_id, status: 'pending' }, select: { id: true, hostname: true, verification_token: true } });
  if (!domain) return NextResponse.json({ error: apiAdminMessage(request, 'domainNotFoundOrProcessed') }, { status: 404 });
  let records: string[][] = [];
  try { records = await resolveTxt(`_cafeflow.${domain.hostname}`); } catch { return NextResponse.json({ error: apiAdminMessage(request, 'domainTxtMissing') }, { status: 409 }); }
  if (!records.some((record) => record.join('').trim() === domain.verification_token)) return NextResponse.json({ error: apiAdminMessage(request, 'domainTxtMismatch') }, { status: 409 });
  const verified = await prisma.tenant_domains.update({ where: { id: domain.id }, data: { status: 'verified', verified_at: new Date() }, select: { id: true, hostname: true, status: true, verified_at: true } });
  return NextResponse.json({ domain: verified });
}

export async function DELETE(request: NextRequest) {
  const result = await actor(request);
  if ('error' in result) return result.error;
  const body = await request.json().catch(() => ({})) as { id?: string };
  if (!body.id) return NextResponse.json({ error: apiAdminMessage(request, 'domainRequired') }, { status: 400 });
  const deleted = await prisma.tenant_domains.deleteMany({ where: { id: body.id, tenant_id: result.user.tenant_id } });
  if (deleted.count !== 1) return NextResponse.json({ error: apiAdminMessage(request, 'domainNotFound') }, { status: 404 });
  return NextResponse.json({ success: true });
}