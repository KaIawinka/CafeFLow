'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const VALID_LOCALES = ['ru', 'en', 'kg'];

/**
 * Компонент для синхронизации языка из localStorage с URL
 * Автоматически перенаправляет на сохранённый язык при загрузке страницы
 */
export function LanguageSync() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Получаем сохранённый язык
    const savedLanguage = localStorage.getItem('preferredLanguage');
    
    // Если нет сохранённого языка, ничего не делаем
    if (!savedLanguage || !VALID_LOCALES.includes(savedLanguage)) {
      return;
    }

    // Получаем текущий язык из URL
    const segments = pathname.split('/').filter(Boolean);
    const currentLocale = segments[0];

    // Если текущий язык не совпадает с сохранённым
    if (VALID_LOCALES.includes(currentLocale) && currentLocale !== savedLanguage) {
      // Заменяем язык в URL
      segments[0] = savedLanguage;
      const newPath = '/' + segments.join('/');
      
      // Перенаправляем (replace, чтобы не добавлять в историю)
      router.replace(newPath);
    } else if (!VALID_LOCALES.includes(currentLocale)) {
      // Если в URL вообще нет языка, добавляем сохранённый
      const newPath = `/${savedLanguage}${pathname}`;
      router.replace(newPath);
    }
  }, []); // Выполняется только один раз при монтировании

  return null; // Компонент невидимый
}
