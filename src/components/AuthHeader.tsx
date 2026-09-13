'use client';

import Link from 'next/link';
import { ArrowLeft, Globe } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

interface AuthHeaderProps {
  backLink?: string;
  backText?: string;
}

const languages = [
  { code: 'ru', name: 'Русский', nameInRu: 'Русский', nameInEn: 'Russian', nameInKg: 'Орус' },
  { code: 'en', name: 'English', nameInRu: 'Английский', nameInEn: 'English', nameInKg: 'Англис' },
  { code: 'kg', name: 'Кыргызча', nameInRu: 'Кыргызский', nameInEn: 'Kyrgyz', nameInKg: 'Кыргызча' },
];

export function AuthHeader({ backLink = '/ru', backText = 'На главную' }: AuthHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current locale from pathname
  const getCurrentLocale = () => {
    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0];
    return ['ru', 'en', 'kg'].includes(locale) ? locale : 'ru';
  };

  const currentLocale = getCurrentLocale();
  const currentLanguage = languages.find((lang) => lang.code === currentLocale) || languages[0];

  // Get language names based on current locale
  const getLanguageName = (lang: typeof languages[0]) => {
    switch (currentLocale) {
      case 'ru':
        return lang.nameInRu;
      case 'en':
        return lang.nameInEn;
      case 'kg':
        return lang.nameInKg;
      default:
        return lang.name;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    // Save to localStorage
    localStorage.setItem('preferredLanguage', newLocale);
    
    // Replace current locale in pathname with new locale
    const segments = pathname.split('/').filter(Boolean);
    
    // If we're on an auth page (login, register), update the locale
    if (segments.length > 0) {
      segments[0] = newLocale;
      const newPath = '/' + segments.join('/');
      router.push(newPath);
    } else {
      // If no segments, just go to home with new locale
      router.push(`/${newLocale}`);
    }
    
    setIsOpen(false);
  };

  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      {/* Back link */}
      <Link
        href={backLink}
        className="inline-flex items-center gap-2 font-medium text-gray-800 hover:text-amber-700 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {backText}
      </Link>

      {/* Language dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-gray-50 border border-gray-200 transition-colors"
          aria-label="Change language"
        >
          <Globe className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900">
            {getLanguageName(currentLanguage)}
          </span>
          <svg
            className={`h-4 w-4 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  currentLocale === lang.code
                    ? 'bg-amber-50 text-amber-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {getLanguageName(lang)}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
