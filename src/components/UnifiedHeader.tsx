'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { locales, localeNames, type Locale } from '@/app/i18n/config';
import { useTheme } from '@/components/ThemeProvider';
import { getUiTranslations } from '@/lib/ui-translations';
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  LayoutDashboard,
  UserCircle,
  Globe,
  Sun,
  Moon,
} from 'lucide-react';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  displayName?: string;
  avatarFileId?: string;
  avatarUrl?: string;
  role: string;
  status: string;
}

interface UnifiedHeaderProps {
  user?: UserData | null;
}

function savePreferredLanguage(locale: Locale) {
  document.cookie = `preferredLanguage=${locale}; path=/; max-age=31536000`;
}

export function UnifiedHeader({ user }: UnifiedHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = (locales.find((locale) => pathname.split('/')[1] === locale) || 'ru') as Locale;
  const ui = getUiTranslations(currentLocale);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname]);

  const switchLocale = (newLocale: Locale) => {
    // Save to cookie (используется middleware для авто-применения)
    savePreferredLanguage(newLocale);
    
    const segments = pathname.split('/').filter(Boolean);
    if (locales.includes(segments[0] as Locale)) {
      segments.shift();
    }
    const newPath = `/${newLocale}${segments.length ? '/' + segments.join('/') : ''}`;
    router.push(newPath);
    setIsLangDropdownOpen(false);
  };

  const handleLogout = async () => {
    if (!logoutConfirm) {
      setLogoutConfirm(true);
      // Reset after 3 seconds
      setTimeout(() => setLogoutConfirm(false), 3000);
      return;
    }

    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
      setLogoutConfirm(false);
    }
  };

  const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    admin: { 
      label: ui.profile.roleLabels.admin, 
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      icon: <ShieldCheck className="w-3 h-3" />
    },
    manager: { 
      label: ui.profile.roleLabels.manager, 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      icon: <LayoutDashboard className="w-3 h-3" />
    },
    kitchen: { 
      label: ui.header.kitchen, 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <User className="w-3 h-3" />
    },
    employee: { 
      label: ui.profile.roleLabels.employee, 
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      icon: <User className="w-3 h-3" />
    },
    customer: { 
      label: ui.profile.roleLabels.customer, 
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      icon: <UserCircle className="w-3 h-3" />
    },
    guest: { 
      label: ui.profile.roleLabels.guest, 
      color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
      icon: <UserCircle className="w-3 h-3" />
    },
  };

  const currentRole = user ? roleConfig[user.role] || roleConfig.customer : null;

  const getNavLinks = () => {
    if (!user) return [];
    
    const links = [];
    
    if (user.role === 'admin' || user.role === 'manager') {
      links.push({ href: '/admin', label: ui.header.admin });
    }
    
    if (user.role === 'kitchen') {
      links.push({ href: '/kitchen', label: ui.header.kitchen });
    }
    
    links.push({ href: '/orders', label: ui.header.orders });
    
    return links;
  };

  const navLinks = getNavLinks();

  // Get localized language names
  const getLocalizedLanguageName = (locale: Locale, inLocale: Locale): string => {
    const names: Record<Locale, Record<Locale, string>> = {
      ru: { ru: 'Русский', en: 'Английский', kg: 'Кыргызский' },
      en: { ru: 'Russian', en: 'English', kg: 'Kyrgyz' },
      kg: { ru: 'Орусча', en: 'Англисче', kg: 'Кыргызча' },
    };
    return names[inLocale]?.[locale] || localeNames[locale];
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <Link href={`/${currentLocale}`} className="flex items-center gap-2 sm:gap-3">
            <Image 
              src="/Logo-CafeFlow.png" 
              alt="CafeFlow" 
              width={40} 
              height={40} 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-cover shadow-lg" 
            />
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
              CaféFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex min-h-10 items-center text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Switcher */}
            <div className="hidden md:block">
              <button
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                aria-label={theme === 'light' ? ui.header.darkTheme : ui.header.lightTheme}
                title={theme === 'light' ? ui.header.darkTheme : ui.header.lightTheme}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>

            {/* Language Switcher */}
            <div className="hidden md:block relative" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300 touch-manipulation"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">{localeNames[currentLocale]}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                  {locales.map((locale) => (
                    <button
                      key={locale}
                      onClick={() => switchLocale(locale)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                        currentLocale === locale
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 font-medium'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {getLocalizedLanguageName(locale, currentLocale)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <>
                {/* Desktop User Dropdown */}
                <div className="hidden md:block relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="Аватар" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                        {user.firstName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    
                    <div className="text-left">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.displayName || `${user.firstName} ${user.lastName || ''}`.trim()}
                      </div>
                      {currentRole && (
                        <div className={`text-xs px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${currentRole.color}`}>
                          {currentRole.icon}
                          <span>{currentRole.label}</span>
                        </div>
                      )}
                    </div>
                    
                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.displayName || `${user.firstName} ${user.lastName || ''}`.trim()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {user.email}
                        </div>
                      </div>

                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        {ui.header.profile}
                      </Link>

                      <Link
                        href="/profile#settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        {ui.header.settings}
                      </Link>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className={`flex items-center gap-3 px-4 py-2 text-sm w-full transition-colors ${
                          logoutConfirm
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        } disabled:opacity-50`}
                      >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? ui.header.loggingOut : logoutConfirm ? ui.header.confirmLogout : ui.header.logout}
                      </button>
                    </div>
                  )}
                </div>

              </>
            ) : (
              <div className="hidden h-full items-center gap-3 md:flex">
                <Link
                  href={`/${currentLocale}`}
                  className="inline-flex min-h-10 items-center text-sm font-medium text-gray-700 transition-colors hover:text-amber-600 dark:text-gray-300 dark:hover:text-amber-500"
                >
                  {ui.header.home}
                </Link>
                <Link
                  href="/login"
                  className="inline-flex min-h-10 items-center text-sm font-medium text-gray-700 transition-colors hover:text-amber-600 dark:text-gray-300 dark:hover:text-amber-500"
                >
                  {ui.header.login}
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  {ui.header.register}
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
              aria-label={isMobileMenuOpen ? ui.header.closeMenu : ui.header.openMenu}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              ) : (
                <Menu className="h-6 w-6 text-gray-700 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-4">
            {user && <div className="flex items-center gap-3 px-4 py-3 mb-4">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt="Аватар" width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                  {user.firstName?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.displayName || `${user.firstName} ${user.lastName || ''}`.trim()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {user.email}
                </div>
              </div>
            </div>}

            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-3 text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                    pathname === link.href
                      ? 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {!user && (
                <div className="space-y-1">
                  <Link href={`/${currentLocale}`} className="flex min-h-[44px] items-center px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    {ui.header.home}
                  </Link>
                  <Link href="/login" className="flex min-h-[44px] items-center px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    {ui.header.login}
                  </Link>
                  <Link href="/register" className="mx-4 flex min-h-[44px] items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700">
                    {ui.header.register}
                  </Link>
                </div>
              )}

              <div className="my-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                <button
                  onClick={toggleTheme}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  aria-label={theme === 'light' ? ui.header.darkTheme : ui.header.lightTheme}
                >
                  {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                  <span>{theme === 'light' ? ui.header.darkTheme : ui.header.lightTheme}</span>
                </button>
              </div>

              {/* Mobile Language Selector */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                <div className="px-4 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <Globe className="w-4 h-4" />
                    <span className="font-medium">{ui.header.language}</span>
                  </div>
                  <div className="space-y-1">
                    {locales.map((locale) => (
                      <button
                        key={locale}
                        onClick={() => switchLocale(locale)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all min-h-[44px] flex items-center ${
                          currentLocale === locale
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                      >
                        {getLocalizedLanguageName(locale, currentLocale)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] transition-colors"
                >
                  <User className="w-4 h-4" />
                  {ui.header.profile}
                </Link>

                <Link
                  href="/profile#settings"
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {ui.header.settings}
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className={`flex items-center gap-3 px-4 py-3 text-sm w-full min-h-[44px] transition-all ${
                    logoutConfirm
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  } disabled:opacity-50`}
                >
                  <LogOut className="w-4 h-4" />
                  {isLoggingOut ? ui.header.loggingOut : logoutConfirm ? ui.header.confirmLogout : ui.header.logout}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
