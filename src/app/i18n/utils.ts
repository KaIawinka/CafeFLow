import { type Locale, defaultLocale, locales } from './config';
import { getLocaleTranslations, type TranslationCatalog } from './catalog';

export type TranslationKey = keyof TranslationCatalog;

export const LOCALE_COOKIE = 'NEXT_LOCALE';

export async function getTranslations<Key extends TranslationKey>(locale: Locale, key: Key): Promise<TranslationCatalog[Key]> {
  return getLocaleTranslations(locale)[key];
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
