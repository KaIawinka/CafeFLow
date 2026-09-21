'use client';

import { Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, ShieldAlert } from 'lucide-react';
import { getLocaleTranslations } from '@/app/i18n/catalog';
import { locales, type Locale } from '@/app/i18n/config';

export default function AccessDeniedPage() {
  return (
    <Suspense fallback={null}>
      <AccessDeniedContent />
    </Suspense>
  );
}

function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const locale = (locales.find((item) => pathname.split('/')[1] === item) || 'ru') as Locale;
  const translations = getLocaleTranslations(locale);
  const copy = translations.ui.accessDenied;
  const roleNames = translations.ui.profile.roles as Record<string, string>;
  const required = searchParams.get('required');
  const current = searchParams.get('current');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950 dark:to-orange-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-100 dark:border-gray-700">
        <div className="flex flex-col items-center text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
            <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {copy.title}
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {copy.description}
          </p>

          {/* Role Info */}
          {required && current && (
            <div className="w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-left text-sm">
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{copy.yourRole}</span>{' '}
                    <span className="text-red-700 dark:text-red-400 font-semibold">
                      {roleNames[current] || current}
                    </span>
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 mt-1">
                    <span className="font-medium">{copy.required}</span>{' '}
                    <span className="text-green-700 dark:text-green-400 font-semibold">
                      {roleNames[required] || required}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-3 w-full">
            <Link
              href={`/${locale}/profile`}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-4 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
            >
              {copy.profile}
            </Link>
            <Link
              href={`/${locale}`}
              className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors min-h-[44px] flex items-center justify-center"
            >
              {copy.home}
            </Link>
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            {copy.help}
          </p>
        </div>
      </div>
    </div>
  );
}
