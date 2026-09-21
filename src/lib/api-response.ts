import { NextRequest, NextResponse } from 'next/server';
import { getLocaleTranslations, type TranslationCatalog } from '@/app/i18n/catalog';
import { defaultLocale, locales, type Locale } from '@/app/i18n/config';

type ApiErrorKey = keyof TranslationCatalog['api']['errors'];

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
