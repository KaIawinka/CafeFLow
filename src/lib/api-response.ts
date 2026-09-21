import { NextRequest, NextResponse } from 'next/server';
import { getLocaleTranslations, type TranslationCatalog } from '@/app/i18n/catalog';
import { defaultLocale, locales, type Locale } from '@/app/i18n/config';

type ApiErrorKey = keyof TranslationCatalog['api']['errors'];
type ApiAuthCatalog = TranslationCatalog['api']['auth'];
type ApiUserCatalog = TranslationCatalog['api']['user'];
type ApiPublicCatalog = TranslationCatalog['api']['public'];
type ApiAdminCatalog = TranslationCatalog['api']['admin'];
type ApiMessageKey = {
  [Key in keyof ApiAuthCatalog]: ApiAuthCatalog[Key] extends string ? Key : never;
}[keyof ApiAuthCatalog];
type ApiListKey = {
  [Key in keyof ApiAuthCatalog]: ApiAuthCatalog[Key] extends string[] ? Key : never;
}[keyof ApiAuthCatalog];
type ApiUserMessageKey = keyof ApiUserCatalog;
type ApiPublicMessageKey = keyof ApiPublicCatalog;
type ApiAdminMessageKey = keyof ApiAdminCatalog;

function parseLocale(value: string | null | undefined): Locale | undefined {
  if (!value) return undefined;
  const candidate = value.toLowerCase().split(/[-_]/)[0];
  if (candidate === 'ky') return 'kg';
  return locales.includes(candidate as Locale) ? candidate as Locale : undefined;
}

export function getRequestLocale(request: NextRequest): Locale {
  let refererLocale: string | undefined;
  const referer = request.headers.get('referer');
  if (referer) {
    try {
      refererLocale = new URL(referer).pathname.split('/').filter(Boolean)[0];
    } catch {
      refererLocale = undefined;
    }
  }

  const acceptLanguage = request.headers.get('accept-language')?.split(',')[0];
  const candidates = [
    request.headers.get('x-locale'),
    request.nextUrl.searchParams.get('locale'),
    refererLocale,
    acceptLanguage,
  ];

  for (const candidate of candidates) {
    const locale = parseLocale(candidate);
    if (locale) return locale;
  }

  return defaultLocale;
}

export function apiError(request: NextRequest, key: ApiErrorKey, status: number) {
  const locale = getRequestLocale(request);
  return NextResponse.json(
    { error: getLocaleTranslations(locale).api.errors[key] },
    { status },
  );
}

export function apiMessage(
  request: NextRequest,
  key: ApiMessageKey,
  params: Record<string, string | number> = {},
) {
  const locale = getRequestLocale(request);
  return interpolateApiMessage(getLocaleTranslations(locale).api.auth[key], params);
}

export function apiList(request: NextRequest, key: ApiListKey) {
  const locale = getRequestLocale(request);
  return getLocaleTranslations(locale).api.auth[key];
}

export function apiUserMessage(
  request: NextRequest,
  key: ApiUserMessageKey,
  params: Record<string, string | number> = {},
) {
  const locale = getRequestLocale(request);
  return interpolateApiMessage(getLocaleTranslations(locale).api.user[key], params);
}

export function apiPublicMessage(
  request: NextRequest,
  key: ApiPublicMessageKey,
  params: Record<string, string | number> = {},
) {
  const locale = getRequestLocale(request);
  return interpolateApiMessage(getLocaleTranslations(locale).api.public[key], params);
}

export function apiAdminMessage(
  request: NextRequest,
  key: ApiAdminMessageKey,
  params: Record<string, string | number> = {},
) {
  const locale = getRequestLocale(request);
  return interpolateApiMessage(getLocaleTranslations(locale).api.admin[key], params);
}

function interpolateApiMessage(template: string, params: Record<string, string | number>) {
  return Object.entries(params).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    template,
  );
}
