/**
 * JWT Token Management
 * Using jose library for secure JWT operations
 */

import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { logger } from '@/lib/logger';

// JWT secret key
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'cafeflow-super-secret-key-change-in-production'
);

// Token expiration times
const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

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
    .sign(JWT_SECRET);

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
    .sign(JWT_SECRET);

  return token;
}

/**
 * Verify Access Token
 */
export async function verifyAccessToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'cafeflow',
      audience: 'cafeflow-admin',
    });

    return payload as TokenPayload;
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
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer: 'cafeflow',
      audience: 'cafeflow-admin',
    });

    return payload as TokenPayload;
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
