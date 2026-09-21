import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { locales, type Locale } from '@/app/i18n/config';
import {
  createGoogleState,
  getGoogleAuthorizationUrl,
  getGoogleStateCookieName,
  getGoogleStateCookieOptions,
} from '@/lib/auth/google';

function safeRedirect(value: string | null, locale: Locale) {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/api/')) return `/${locale}`;
  return value;
}

export async function GET(request: NextRequest) {
  const localeValue = request.nextUrl.searchParams.get('locale');
  const locale = locales.includes(localeValue as Locale) ? localeValue as Locale : 'ru';
  const redirect = safeRedirect(request.nextUrl.searchParams.get('redirect'), locale);
  const state = createGoogleState({
    nonce: crypto.randomUUID(),
    locale,
    redirect,
    issuedAt: Date.now(),
  });
  const authorizationUrl = getGoogleAuthorizationUrl(request, state);
  const loginUrl = new URL(`/${locale}/login`, request.url);
  loginUrl.searchParams.set('error', authorizationUrl ? 'google_start_failed' : 'google_not_configured');

  if (!authorizationUrl) return NextResponse.redirect(loginUrl);

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(getGoogleStateCookieName(), state, getGoogleStateCookieOptions());
  return response;
}