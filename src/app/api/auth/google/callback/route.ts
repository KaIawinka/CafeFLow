import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth/password';
import { createAuthSession, generateTokenPair, getTokenExpirySeconds, hashSessionToken } from '@/lib/auth/jwt';
import { checkCodeGenerationRateLimit, createVerificationCode } from '@/lib/telegram/utils';
import { sendVerificationCode } from '@/lib/telegram/messages';
import {
  exchangeGoogleCode,
  generateOAuthPassword,
  getGoogleClientSecret,
  getGoogleStateCookieName,
  getGoogleStateCookieOptions,
  readGoogleState,
} from '@/lib/auth/google';
import { logger } from '@/lib/logger';

function loginUrl(request: NextRequest, locale: string, error: string, redirect?: string) {
  const url = new URL(`/${locale}/login`, request.url);
  url.searchParams.set('error', error);
  if (redirect) url.searchParams.set('redirect', redirect);
  return url;
}

function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string) {
  response.cookies.set('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: getTokenExpirySeconds('access'), path: '/' });
  response.cookies.set('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: getTokenExpirySeconds('refresh'), path: '/' });
}

export async function GET(request: NextRequest) {
  const stateCookie = request.cookies.get(getGoogleStateCookieName())?.value;
  const state = readGoogleState(stateCookie);
  const fallbackLocale = state?.locale || 'ru';
  const clearState = (response: NextResponse) => {
    response.cookies.set(getGoogleStateCookieName(), '', { ...getGoogleStateCookieOptions(), maxAge: 0 });
    return response;
  };

  if (!state || !stateCookie || stateCookie !== request.nextUrl.searchParams.get('state')) {
    return clearState(NextResponse.redirect(loginUrl(request, fallbackLocale, 'google_state_invalid')));
  }
  if (!getGoogleClientSecret()) {
    return clearState(NextResponse.redirect(loginUrl(request, state.locale, 'google_not_configured', state.redirect)));
  }

  const code = request.nextUrl.searchParams.get('code');
  if (!code) return clearState(NextResponse.redirect(loginUrl(request, state.locale, 'google_denied', state.redirect)));

  try {
    const googleUser = await exchangeGoogleCode(request, code);
    if (!googleUser?.email || !googleUser.email_verified) {
      return clearState(NextResponse.redirect(loginUrl(request, state.locale, 'google_email_unverified', state.redirect)));
    }

    const email = googleUser.email.trim().toLowerCase();
    let user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, first_name: true, last_name: true, display_name: true, avatar_file_id: true, role: true, status: true, email_verified_at: true, two_fa_enabled: true, telegram_chat_id: true, requires_approval: true },
    });

    if (user && user.status !== 'active' && user.status !== 'pending') {
      return clearState(NextResponse.redirect(loginUrl(request, state.locale, 'google_account_blocked', state.redirect)));
    }

    if (!user) {
      const firstName = (googleUser.given_name || googleUser.name || 'CaféFlow').slice(0, 100);
      const lastName = googleUser.family_name?.slice(0, 100) || null;
      const passwordHash = await hashPassword(generateOAuthPassword());
      user = await prisma.$transaction(async (transaction) => {
        const createdUser = await transaction.users.create({
          data: {
            email,
            password_hash: passwordHash,
            first_name: firstName,
            last_name: lastName,
            display_name: googleUser.name?.slice(0, 150) || `${firstName}${lastName ? ` ${lastName}` : ''}`,
            role: 'customer',
            status: 'active',
            email_verified_at: new Date(),
            language: state.locale,
            timezone: 'Asia/Bishkek',
            last_login_at: new Date(),
            last_seen_at: new Date(),
          },
          select: { id: true, email: true, first_name: true, last_name: true, display_name: true, avatar_file_id: true, role: true, status: true, email_verified_at: true, two_fa_enabled: true, telegram_chat_id: true, requires_approval: true },
        });
        await transaction.user_settings.create({ data: { user_id: createdUser.id } });
        return createdUser;
      });
    } else if (user.status === 'pending') {
      user = await prisma.users.update({
        where: { id: user.id },
        data: { status: 'active', email_verified_at: new Date(), last_seen_at: new Date() },
        select: { id: true, email: true, first_name: true, last_name: true, display_name: true, avatar_file_id: true, role: true, status: true, email_verified_at: true, two_fa_enabled: true, telegram_chat_id: true, requires_approval: true },
      });
    } else if (!user.email_verified_at) {
      user = await prisma.users.update({
        where: { id: user.id },
        data: { email_verified_at: new Date(), last_seen_at: new Date() },
        select: { id: true, email: true, first_name: true, last_name: true, display_name: true, avatar_file_id: true, role: true, status: true, email_verified_at: true, two_fa_enabled: true, telegram_chat_id: true, requires_approval: true },
      });
    }

    if (user.two_fa_enabled && user.telegram_chat_id) {
      const rateLimit = await checkCodeGenerationRateLimit(user.id);
      if (!rateLimit.allowed) return clearState(NextResponse.redirect(loginUrl(request, state.locale, 'google_code_rate_limited', state.redirect)));
      const verificationCode = await createVerificationCode(user.id, '2fa_login', request.headers.get('x-forwarded-for') || 'unknown');
      const sent = await sendVerificationCode(user.id, verificationCode, 5);
      if (!sent.success && process.env.NODE_ENV !== 'development') {
        return clearState(NextResponse.redirect(loginUrl(request, state.locale, 'google_code_send_failed', state.redirect)));
      }
      if (!sent.success) {
        logger.warn('Google OAuth 2FA bypassed in development', { userId: user.id });
      } else {
      const tempSessionId = crypto.randomUUID();
      await prisma.auth_sessions.create({ data: { id: tempSessionId, user_id: user.id, token: hashSessionToken(crypto.randomUUID()), expires_at: new Date(Date.now() + 5 * 60 * 1000), ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null, user_agent: request.headers.get('user-agent')?.slice(0, 500) || null, is_2fa_verified: false } });
      const response = NextResponse.redirect(loginUrl(request, state.locale, 'google_2fa_required', state.redirect));
      response.cookies.set(getGoogleStateCookieName(), '', { ...getGoogleStateCookieOptions(), maxAge: 0 });
      const target = new URL(response.headers.get('location') || loginUrl(request, state.locale, 'google_2fa_required', state.redirect));
      target.searchParams.set('email', user.email);
      target.searchParams.set('tempSessionId', tempSessionId);
      response.headers.set('location', target.toString());
      return response;
      }
    }

    const sessionId = crypto.randomUUID();
    const { accessToken, refreshToken } = await generateTokenPair({ userId: user.id, email: user.email, role: user.role, status: user.status, requiresApproval: user.requires_approval, sessionId });
    await createAuthSession({ sessionId, userId: user.id, refreshToken, request });
    await prisma.users.update({ where: { id: user.id }, data: { last_login_at: new Date(), last_seen_at: new Date() } });

    const destination = new URL(state.redirect, request.url);
    const response = NextResponse.redirect(destination);
    response.cookies.set(getGoogleStateCookieName(), '', { ...getGoogleStateCookieOptions(), maxAge: 0 });
    setAuthCookies(response, accessToken, refreshToken);
    return response;
  } catch (error) {
    logger.error('Google OAuth callback error', error);
    return clearState(NextResponse.redirect(loginUrl(request, state.locale, 'google_failed', state.redirect)));
  }
}