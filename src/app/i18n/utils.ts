import { type Locale, defaultLocale, locales } from './config';

type TranslationKey = 'landing' | 'common';

export async function getTranslations(locale: Locale, key: TranslationKey) {
  try {
    const translations = await import(`./locales/${locale}/${key}.json`);
    return translations.default;
  } catch (error) {
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
