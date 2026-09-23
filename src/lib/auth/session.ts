import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { verifyAccessToken } from './jwt';
import { prisma } from '@/lib/prisma';

export async function getUserFromSession(request: NextRequest) {
  try {
    // Try to get token from cookies
    const token = request.cookies.get('accessToken')?.value;
    if (!token) return null;

    // Verify token
    const payload = await verifyAccessToken(token);
    if (!payload) return null;

    // Fetch user data
    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        tenant_id: true,
      },
    });

    if (!user || user.status !== 'active') return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenant_id,
    };
  } catch (error) {
    // Token is invalid or expired
    return null;
  }
}

export async function getUserFromServerCookies() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return null;

    const payload = await verifyAccessToken(token);
    if (!payload) return null;

    const user = await prisma.users.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        status: true,
        tenant_id: true,
      },
    });

    if (!user || user.status !== 'active') return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      tenantId: user.tenant_id,
    };
  } catch (error) {
    return null;
  }
}
