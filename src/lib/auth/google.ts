import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { getJwtSecret } from '@/lib/config';

const GOOGLE_AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';
const GOOGLE_STATE_COOKIE = 'google_oauth_state';
const STATE_MAX_AGE_SECONDS = 10 * 60;

export type GoogleOAuthState = {
  nonce: string;
  locale: 'ru' | 'en' | 'kg';
  redirect: string;
  issuedAt: number;
};

export type GoogleUser = {
  sub: string;
  email: string;
  email_verified: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
};

export function getGoogleClientId() {
  return process.env.GOOGLE_CLIENT_ID?.trim() || null;
}

export function getGoogleClientSecret() {
  return process.env.GOOGLE_CLIENT_SECRET?.trim() || null;
}

export function getGoogleRedirectUri(request: Request) {
  const configured = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (configured) return configured;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;
  return `${appUrl.replace(/\/$/, '')}/api/auth/google/callback`;
}

export function createGoogleState(state: GoogleOAuthState) {
  const payload = Buffer.from(JSON.stringify(state)).toString('base64url');
  const signature = createHmac('sha256', getJwtSecret()).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function readGoogleState(value: string | undefined): GoogleOAuthState | null {
  if (!value) return null;
  const [payload, signature] = value.split('.');
  if (!payload || !signature) return null;

  const expected = createHmac('sha256', getJwtSecret()).update(payload).digest('base64url');
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  try {
    const state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as GoogleOAuthState;
    if (!state.nonce || !state.locale || !state.redirect || Date.now() - state.issuedAt > STATE_MAX_AGE_SECONDS * 1000) return null;
    return state;
  } catch {
    return null;
  }
}

export function getGoogleAuthorizationUrl(request: Request, state: string) {
  const clientId = getGoogleClientId();
  if (!clientId) return null;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(request),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return `${GOOGLE_AUTHORIZE_URL}?${params.toString()}`;
}

export function getGoogleStateCookieName() {
  return GOOGLE_STATE_COOKIE;
}

export function getGoogleStateCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: STATE_MAX_AGE_SECONDS,
    path: '/api/auth/google',
  };
}

export async function exchangeGoogleCode(request: Request, code: string): Promise<GoogleUser | null> {
  const clientId = getGoogleClientId();
  const clientSecret = getGoogleClientSecret();
  if (!clientId || !clientSecret) return null;

  const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(request),
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });
  if (!tokenResponse.ok) return null;

  const tokens = await tokenResponse.json() as { access_token?: string };
  if (!tokens.access_token) return null;

  const userResponse = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    cache: 'no-store',
  });
  if (!userResponse.ok) return null;
  return userResponse.json() as Promise<GoogleUser>;
}

export function generateOAuthPassword() {
  return randomBytes(32).toString('base64url');
}