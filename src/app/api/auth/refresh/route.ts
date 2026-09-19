import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTokenPair, getTokenExpirySeconds, hashSessionToken, verifyRefreshToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const oldRefreshToken = request.cookies.get('refreshToken')?.value;
    if (!oldRefreshToken) return new NextResponse(null, { status: 204 });
    const payload = await verifyRefreshToken(oldRefreshToken);
    if (!payload?.sessionId) return NextResponse.json({ error: 'Сессия истекла' }, { status: 401 });

    const sessionId = randomUUID();
    const { accessToken, refreshToken } = await generateTokenPair({ ...payload, sessionId });
    await prisma.$transaction([
      prisma.auth_sessions.deleteMany({ where: { id: payload.sessionId, user_id: payload.userId, token: hashSessionToken(oldRefreshToken) } }),
      prisma.auth_sessions.create({
        data: {
          id: sessionId,
          user_id: payload.userId,
          token: hashSessionToken(refreshToken),
          expires_at: new Date(Date.now() + getTokenExpirySeconds('refresh') * 1000),
          ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || null,
          user_agent: request.headers.get('user-agent')?.slice(0, 500) || null,
          is_2fa_verified: true,
        },
      }),
    ]);

    const response = NextResponse.json({ success: true });
    response.cookies.set('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: getTokenExpirySeconds('access'), path: '/' });
    response.cookies.set('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: getTokenExpirySeconds('refresh'), path: '/' });
    return response;
  } catch (error) {
    console.error('Refresh token error', error);
    return NextResponse.json({ error: 'Не удалось обновить сессию' }, { status: 401 });
  }
}