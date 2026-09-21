import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { apiError, apiUserMessage } from '@/lib/api-response';

function serialize<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (_, item) => typeof item === 'bigint' ? item.toString() : item));
}

async function getUserId(request: NextRequest) {
  const token = request.cookies.get('accessToken')?.value;
  const payload = token ? await verifyAccessToken(token) : null;
  return payload?.userId || null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return apiError(request, 'unauthorized', 401);

    const notifications = await prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 50,
      select: { id: true, channel: true, type: true, subject: true, body: true, status: true, read_at: true, created_at: true },
    });
    const unreadCount = notifications.filter((notification) => !notification.read_at).length;
    return NextResponse.json(serialize({ notifications, unreadCount }));
  } catch (error) {
    console.error('User notifications read error', error);
    return NextResponse.json({ error: apiUserMessage(request, 'notificationsLoadFailed') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) return apiError(request, 'unauthorized', 401);
    const body = await request.json() as { id?: string; all?: boolean };
    if (!body.id && !body.all) return NextResponse.json({ error: apiUserMessage(request, 'notificationRequired') }, { status: 400 });

    if (body.all) {
      await prisma.notifications.updateMany({ where: { user_id: userId, read_at: null }, data: { read_at: new Date(), status: 'read' } });
    } else {
      const updated = await prisma.notifications.updateMany({ where: { id: body.id, user_id: userId }, data: { read_at: new Date(), status: 'read' } });
      if (updated.count !== 1) return NextResponse.json({ error: apiUserMessage(request, 'notificationNotFound') }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('User notification update error', error);
    return NextResponse.json({ error: apiUserMessage(request, 'notificationsUpdateFailed') }, { status: 500 });
  }
}
