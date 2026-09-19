import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateTokenPair, getTokenExpirySeconds, hashSessionToken, verifyRefreshToken } from '@/lib/auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const oldRefreshToken = request.cookies.get('refreshToken')?.value;
    if (!oldRefreshToken) return new NextResponse(null, { status: 204 });
    const payload = await verifyRefreshToken(oldRefreshToken);
    if (!payload?.sessionId) return NextResponse.json({ error: 'Сессия истекла' }, { status: 401 });

    const { accessToken, refreshToken } = await generateTokenPair(payload);
    const sessionUpdate = await prisma.auth_sessions.updateMany({
      where: { id: payload.sessionId, user_id: payload.userId, token: hashSessionToken(oldRefreshToken) },
      data: {
        token: hashSessionToken(refreshToken),
        expires_at: new Date(Date.now() + getTokenExpirySeconds('refresh') * 1000),
        last_activity: new Date(),
      },
    });
    if (sessionUpdate.count !== 1) return NextResponse.json({ error: 'Сессия уже обновлена' }, { status: 401 });

    const response = NextResponse.json({ success: true });
    response.cookies.set('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: getTokenExpirySeconds('access'), path: '/' });
    response.cookies.set('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: getTokenExpirySeconds('refresh'), path: '/' });
    return response;
  } catch (error) {
    console.error('Refresh token error', error);
    return NextResponse.json({ error: 'Не удалось обновить сессию' }, { status: 401 });
  }
}