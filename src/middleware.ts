import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { defaultLocale, locales } from './app/i18n/config';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Пропускаем статические файлы и API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }
  
  // Проверяем, есть ли язык в URL
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  if (pathnameHasLocale) {
    // Извлекаем локаль из URL
    const currentLocale = locales.find(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );
    
    // Обновляем cookie с текущей локалью
    if (currentLocale) {
      const response = NextResponse.next();
      response.cookies.set(LOCALE_COOKIE, currentLocale, {
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 год
      });
      return response;
    }
    
    return NextResponse.next();
  }
  
  // Определяем язык по приоритету: cookie > Accept-Language > default
  let locale = defaultLocale;
  
  // Проверяем cookie
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && locales.includes(cookieLocale as any)) {
    locale = cookieLocale as typeof locales[number];
  } else {
    // Определяем язык из заголовка Accept-Language
    const acceptLanguage = request.headers.get('accept-language');
    
    if (acceptLanguage) {
      const preferredLocale = acceptLanguage
        .split(',')
        .map((lang) => lang.split(';')[0].trim().toLowerCase())
        .find((lang) => locales.some((l) => lang.startsWith(l)));
      
      if (preferredLocale) {
        locale = locales.find((l) => preferredLocale.startsWith(l)) || defaultLocale;
      }
    }
  }
  
  // Редирект на URL с языком
  const newUrl = new URL(`/${locale}${pathname}`, request.url);
  const response = NextResponse.redirect(newUrl);
  
  // Устанавливаем cookie с выбранной локалью
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 год
  });
  
  return response;
}

export const config = {
  matcher: ['/((?!_next|api|favicon.ico).*)'],
};
