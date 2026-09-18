/**
 * JWT Token Management
 * Using jose library for secure JWT operations
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { getJwtSecret } from '@/lib/config';

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days
const SESSION_IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * JWT Payload Interface
 */
export interface TokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  status?: string;
  requiresApproval?: boolean;
  sessionId?: string;
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export async function createAuthSession(params: {
  sessionId: string;
  userId: string;
  refreshToken: string;
  request: Request;
  is2faVerified?: boolean;
}) {
  const forwardedFor = params.request.headers.get('x-forwarded-for');
  await prisma.auth_sessions.create({
    data: {
      id: params.sessionId,
      user_id: params.userId,
      token: hashSessionToken(params.refreshToken),
      expires_at: new Date(Date.now() + getTokenExpirySeconds('refresh') * 1000),
      ip_address: forwardedFor?.split(',')[0]?.trim() || params.request.headers.get('x-real-ip') || null,
      user_agent: params.request.headers.get('user-agent')?.slice(0, 500) || null,
      is_2fa_verified: params.is2faVerified ?? true,
    },
  });
}

/**
 * Generate Access Token
 */
export async function generateAccessToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    status: payload.status,
    requiresApproval: payload.requiresApproval,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .setIssuer('cafeflow')
    .setAudience('cafeflow-admin')
    .sign(getJwtSecret());

  return token;
}

/**
 * Generate Refresh Token
 */
export async function generateRefreshToken(payload: TokenPayload): Promise<string> {
  const token = await new SignJWT({
    userId: payload.userId,
    sessionId: payload.sessionId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .setIssuer('cafeflow')
    .setAudience('cafeflow-admin')
    .sign(getJwtSecret());

  return token;
}

/**
 * Verify Access Token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: 'cafeflow',
      audience: 'cafeflow-admin',
    });

    const jwtPayload = payload as TokenPayload;
    if (!jwtPayload.userId) {
      return null;
    }

    if (!jwtPayload.sessionId) return null;
    const now = new Date();
    const session = await prisma.auth_sessions.findFirst({
      where: { id: jwtPayload.sessionId, user_id: jwtPayload.userId, expires_at: { gt: now }, last_activity: { gt: new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS) } },
      select: { id: true },
    });
    if (!session) return null;
    await prisma.auth_sessions.update({ where: { id: session.id }, data: { last_activity: now } });

    const currentUser = await prisma.users.findUnique({
      where: { id: jwtPayload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        requires_approval: true,
      },
    });

    if (!currentUser) {
      return null;
    }

    return {
      ...jwtPayload,
      userId: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      status: currentUser.status,
      requiresApproval: currentUser.requires_approval,
    };
  } catch (error) {
    logger.error('JWT verification failed', error);
    return null;
  }
}

/**
 * Verify Refresh Token
 */
export async function verifyRefreshToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      issuer: 'cafeflow',
      audience: 'cafeflow-admin',
    });

    const jwtPayload = payload as TokenPayload;
    if (!jwtPayload.userId) {
      return null;
    }

    if (!jwtPayload.sessionId) return null;
    const now = new Date();
    const session = await prisma.auth_sessions.findFirst({
      where: { id: jwtPayload.sessionId, user_id: jwtPayload.userId, token: hashSessionToken(token), expires_at: { gt: now }, last_activity: { gt: new Date(now.getTime() - SESSION_IDLE_TIMEOUT_MS) } },
      select: { id: true },
    });
    if (!session) return null;
    await prisma.auth_sessions.update({ where: { id: session.id }, data: { last_activity: now } });

    const currentUser = await prisma.users.findUnique({
      where: { id: jwtPayload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        requires_approval: true,
      },
    });

    if (!currentUser) {
      return null;
    }

    return {
      ...jwtPayload,
      userId: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      status: currentUser.status,
      requiresApproval: currentUser.requires_approval,
    };
  } catch (error) {
    logger.error('Refresh token verification failed', error);
    return null;
  }
}

/**
 * Generate Token Pair (access + refresh)
 */
export async function generateTokenPair(payload: TokenPayload): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    generateAccessToken(payload),
    generateRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.substring(7);
}

/**
 * Get token expiry time in seconds
 */
export function getTokenExpirySeconds(type: 'access' | 'refresh'): number {
  if (type === 'access') {
    return 15 * 60; // 15 minutes
  }
  return 7 * 24 * 60 * 60; // 7 days
}
