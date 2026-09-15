import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['ru', 'en', 'kg'];
const defaultLocale = 'ru';

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Игнорируем статические файлы и API
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // файлы с расширениями
  ) {
    return NextResponse.next();
  }

  // Получаем сохранённый язык из cookie (проверяем оба варианта)
  const savedLocale = 
    request.cookies.get('preferredLanguage')?.value || 
    request.cookies.get('NEXT_LOCALE')?.value;
  
  console.log('[Middleware] pathname:', pathname);
  console.log('[Middleware] cookies:', {
    preferredLanguage: request.cookies.get('preferredLanguage')?.value,
    NEXT_LOCALE: request.cookies.get('NEXT_LOCALE')?.value,
    savedLocale
  });
  
  // Проверяем текущий язык в URL
  const segments = pathname.split('/').filter(Boolean);
  const currentLocale = segments[0];

  console.log('[Middleware] currentLocale from URL:', currentLocale);

  // Если в URL есть валидный язык
  if (locales.includes(currentLocale)) {
    // Если есть сохранённый язык и он отличается от текущего
    if (savedLocale && locales.includes(savedLocale) && savedLocale !== currentLocale) {
      // Заменяем язык в URL
      segments[0] = savedLocale;
      const newPathname = '/' + segments.join('/');
      
      console.log('[Middleware] Redirecting to:', newPathname);
      
      const url = request.nextUrl.clone();
      url.pathname = newPathname;
      
      return NextResponse.redirect(url);
    }
    
    console.log('[Middleware] Locale matches, passing through');
    // Язык совпадает - пропускаем
    return NextResponse.next();
  }

  // Если в URL нет языка - добавляем сохранённый или дефолтный
  const localeToUse = (savedLocale && locales.includes(savedLocale)) ? savedLocale : defaultLocale;
  const newPathname = `/${localeToUse}${pathname}`;
  
  console.log('[Middleware] No locale in URL, adding:', localeToUse);
  
  const url = request.nextUrl.clone();
  url.pathname = newPathname;
  
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    // Применяем middleware ко всем путям кроме:
    '/((?!_next|api|static|.*\\..*).*)',
  ],
};
