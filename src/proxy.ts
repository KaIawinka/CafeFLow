import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ru', 'en', 'kg'];
const defaultLocale = 'ru';
const requestIdPattern = /^[A-Za-z0-9._:-]{1,128}$/;

function withRequestId(request: NextRequest, response: NextResponse) {
  const incomingId = request.headers.get('x-request-id')?.trim();
  const requestId = incomingId && requestIdPattern.test(incomingId) ? incomingId : crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  response.headers.set('x-request-id', requestId);
  return NextResponse.next({ request: { headers: requestHeaders }, headers: response.headers });
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Игнорируем статические файлы и API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // файлы с расширениями
  ) {
    return withRequestId(request, NextResponse.next());
  }

  // Получаем сохранённый язык из cookie (проверяем оба варианта)
  const savedLocale = 
    request.cookies.get('preferredLanguage')?.value || 
    request.cookies.get('NEXT_LOCALE')?.value;
  
  // Проверяем текущий язык в URL
  const segments = pathname.split('/').filter(Boolean);
  const currentLocale = segments[0];

  // Если в URL есть валидный язык
  if (locales.includes(currentLocale)) {
    // An explicit locale in the URL takes precedence over the preference cookie.
    return withRequestId(request, NextResponse.next());
  }

  // Если в URL нет языка - добавляем сохранённый или дефолтный
  const localeToUse = (savedLocale && locales.includes(savedLocale)) ? savedLocale : defaultLocale;
  const newPathname = `/${localeToUse}${pathname}`;
  
  const url = request.nextUrl.clone();
  url.pathname = newPathname;
  
  const response = NextResponse.redirect(url);
  response.headers.set('x-request-id', request.headers.get('x-request-id') || crypto.randomUUID());
  return response;
}

export const config = {
  matcher: [
    // Применяем middleware ко всем путям кроме:
    '/((?!_next|api|static|.*\\..*).*)',
  ],
};
