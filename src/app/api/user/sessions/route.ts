import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';

async function currentSession(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  return token ? verifyAccessToken(token) : null;
}

export async function GET(request: NextRequest) {
  const payload = await currentSession(request);
  if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const sessions = await prisma.auth_sessions.findMany({
    where: { user_id: payload.userId, expires_at: { gt: new Date() } },
    select: { id: true, ip_address: true, user_agent: true, is_2fa_verified: true, last_activity: true, created_at: true, expires_at: true },
    orderBy: { last_activity: 'desc' },
  });
  return NextResponse.json({ sessions: sessions.map((session) => ({ ...session, current: session.id === payload.sessionId })) });
}

export async function DELETE(request: NextRequest) {
  const payload = await currentSession(request);
  if (!payload) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  const body = await request.json().catch(() => ({})) as { sessionId?: string };
  if (!body.sessionId || body.sessionId === payload.sessionId) return NextResponse.json({ error: 'Для текущей сессии используйте выход' }, { status: 400 });
  const deleted = await prisma.auth_sessions.deleteMany({ where: { id: body.sessionId, user_id: payload.userId } });
  if (deleted.count !== 1) return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
  return NextResponse.json({ success: true });
}