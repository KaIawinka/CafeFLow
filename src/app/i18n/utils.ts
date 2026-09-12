import { type Locale, defaultLocale, locales } from './config';

type TranslationKey = 'landing' | 'common';

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export async function getTranslations(locale: Locale, key: TranslationKey) {
  try {
    const translations = await import(`./locales/${locale}/${key}.json`);
    return translations.default;
  } catch {
    console.warn(`Translation file not found: ${locale}/${key}.json, falling back to ${defaultLocale}`);
    const fallback = await import(`./locales/${defaultLocale}/${key}.json`);
    return fallback.default;
  }
}

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

export function getLocaleFromUrl(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  const potentialLocale = segments[0];
  
  if (potentialLocale && isValidLocale(potentialLocale)) {
    return potentialLocale;
  }
  
  return defaultLocale;
}

// Функции для работы с cookie на клиенте
export function setLocaleCookie(locale: Locale): void {
  if (typeof document !== 'undefined') {
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${60 * 60 * 24 * 365}`;
  }
}

export function getLocaleCookie(): Locale | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const cookies = document.cookie.split(';');
  const localeCookie = cookies.find(cookie => cookie.trim().startsWith(`${LOCALE_COOKIE}=`));
  
  if (localeCookie) {
    const locale = localeCookie.split('=')[1].trim();
    return isValidLocale(locale) ? locale : null;
  }
  
  return null;
}
