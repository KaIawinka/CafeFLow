'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { locales, localeNames, type Locale } from '@/app/i18n/config';
import { setLocaleCookie } from '@/app/i18n/utils';
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
  Monitor,
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

export function UnifiedHeader({ user }: UnifiedHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = (locales.find((locale) => pathname.split('/')[1] === locale) || 'ru') as Locale;

  // Load theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on navigation
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const timeoutId = window.setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname, isMobileMenuOpen]);

  const applyTheme = (newTheme: 'light' | 'dark') => {
    const root = document.documentElement;
    root.classList.toggle('dark', newTheme === 'dark');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
    setIsThemeDropdownOpen(false);
  };

  const switchLocale = (newLocale: Locale) => {
    // Save to localStorage
    localStorage.setItem('preferredLanguage', newLocale);
    
    const segments = pathname.split('/').filter(Boolean);
    if (locales.includes(segments[0] as Locale)) {
      segments.shift();
    }
    setLocaleCookie(newLocale);
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
      label: 'Администратор', 
      color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
      icon: <ShieldCheck className="w-3 h-3" />
    },
    manager: { 
      label: 'Менеджер', 
      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
      icon: <LayoutDashboard className="w-3 h-3" />
    },
    kitchen: { 
      label: 'Кухня', 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <User className="w-3 h-3" />
    },
    employee: { 
      label: 'Сотрудник', 
      color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      icon: <User className="w-3 h-3" />
    },
    customer: { 
      label: 'Клиент', 
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      icon: <UserCircle className="w-3 h-3" />
    },
    guest: { 
      label: 'Гость', 
      color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
      icon: <UserCircle className="w-3 h-3" />
    },
  };

  const currentRole = user ? roleConfig[user.role] || roleConfig.customer : null;

  const getNavLinks = () => {
    if (!user) return [];
    
    const links = [];
    
    if (user.role === 'admin' || user.role === 'manager') {
      links.push({ href: '/admin', label: 'Админ панель' });
    }
    
    if (user.role === 'kitchen') {
      links.push({ href: '/kitchen', label: 'Кухня' });
    }
    
    links.push({ href: '/orders', label: 'Заказы' });
    
    return links;
  };

  const navLinks = getNavLinks();

  const themeIcons = {
    light: <Sun className="w-4 h-4" />,
    dark: <Moon className="w-4 h-4" />,
  };

  const themeLabels = {
    light: 'Светлая',
    dark: 'Тёмная',
  };

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
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${currentLocale}`} className="flex items-center gap-3">
            <Image src="/Logo-CafeFlow.png" alt="CafeFlow" width={40} height={40} className="h-10 w-10 rounded-xl object-cover shadow-lg" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              CaféFlow
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors ${
                  pathname === link.href
                    ? 'text-amber-600 dark:text-amber-500'
                    : 'text-gray-600 dark:text-gray-400 hover:text-amber-600 dark:hover:text-amber-500'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Theme Switcher */}
            <div className="hidden md:block relative" ref={themeDropdownRef}>
              <button
                onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                aria-label="Переключить тему"
              >
                {themeIcons[theme]}
              </button>

              {isThemeDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                  {(['light', 'dark'] as const).map((themeOption) => (
                    <button
                      key={themeOption}
                      onClick={() => handleThemeChange(themeOption)}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        theme === themeOption
                          ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {themeIcons[themeOption]}
                      <span>{themeLabels[themeOption]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Language Switcher */}
            <div className="hidden md:block relative" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium">{localeNames[currentLocale]}</span>
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
                        Профиль
                      </Link>

                      <Link
                        href="/profile#settings"
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Настройки
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
                        {isLoggingOut ? 'Выход...' : logoutConfirm ? 'Подтвердить выход' : 'Выйти'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  ) : (
                    <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                  )}
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href={`/${currentLocale}`}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                >
                  Главная
                </Link>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-500 transition-colors"
                >
                  Войти
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Регистрация
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {user && isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 py-4">
            <div className="flex items-center gap-3 px-4 py-3 mb-4">
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
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2 text-sm font-medium ${
                    pathname === link.href
                      ? 'text-amber-600 dark:text-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/profile"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <User className="w-4 h-4" />
                Профиль
              </Link>

              <Link
                href="/profile#settings"
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <Settings className="w-4 h-4" />
                Настройки
              </Link>

              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className={`flex items-center gap-3 px-4 py-2 text-sm w-full ${
                  logoutConfirm
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                } disabled:opacity-50`}
              >
                <LogOut className="w-4 h-4" />
                {isLoggingOut ? 'Выход...' : logoutConfirm ? 'Подтвердить выход' : 'Выйти'}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
