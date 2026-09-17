"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { locales, type Locale } from '@/app/i18n/config';
import { getUiTranslations } from '@/lib/ui-translations';

export default function NotFound() {
  const pathname = usePathname();
  const locale = (locales.find((item) => pathname.split('/')[1] === item) || 'ru') as Locale;
  const ui = getUiTranslations(locale);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-amber-50 dark:from-zinc-950 dark:to-zinc-900 px-4">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 mb-4">
            404
          </div>
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4">
            {ui.notFound.title}
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-8 max-w-md mx-auto">
            {ui.notFound.description}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
          >
            {ui.notFound.home}
          </Link>
          <Link
            href={`/${locale}#contact`}
            className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-lg border-2 border-zinc-200 dark:border-zinc-700 hover:border-amber-600 dark:hover:border-amber-500 transition-all"
          >
            {ui.notFound.contact}
          </Link>
        </div>

        {/* Decorative element */}
        <div className="mt-16 text-9xl opacity-10">
          404
        </div>
      </div>
    </div>
  );
}
