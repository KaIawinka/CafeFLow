'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { startTransition, useState, useEffect, useRef } from 'react';
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
  Bell,
  CalendarDays,
  ClipboardList,
  Home,
  ShoppingCart,
  Utensils,
  Search,
  Heart,
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
  siteName?: string;
  siteLogo?: string;
}

function savePreferredLanguage(locale: Locale) {
  document.cookie = `preferredLanguage=${locale}; path=/; max-age=31536000`;
}

function getPreferredLocale(pathname: string): Locale {
  const urlLocale = pathname.split('/')[1];
  if (locales.includes(urlLocale as Locale)) {
    return urlLocale as Locale;
  }

  const cookieLocale = typeof document === 'undefined' ? null : document.cookie
    .split(';')
    .map((cookie) => cookie.trim().split('='))
    .find(([key]) => key === 'preferredLanguage')?.[1];

  return locales.includes(cookieLocale as Locale) ? cookieLocale as Locale : 'ru';
}

export function UnifiedHeader({ user, siteName = 'CaféFlow', siteLogo = '/cafeflow-logo.svg' }: UnifiedHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [logoutCountdown, setLogoutCountdown] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { theme, toggleTheme } = useTheme();
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = getPreferredLocale(pathname);
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

  useEffect(() => {
    if (!logoutConfirm || logoutCountdown <= 0) return;
    const timeoutId = window.setTimeout(() => setLogoutCountdown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearTimeout(timeoutId);
  }, [logoutConfirm, logoutCountdown]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/user/notifications', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json() as { unreadCount?: number };
        if (active) setUnreadNotifications(data.unreadCount || 0);
      } catch {
        // Notification availability must not affect navigation.
      }
    };
    void loadNotifications();
    const intervalId = window.setInterval(() => void loadNotifications(), 20000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [user]);

  const markNotificationsRead = async () => {
    const response = await fetch('/api/user/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
    if (response.ok) setUnreadNotifications(0);
  };

  const switchLocale = (newLocale: Locale) => {
    // Save to cookie (используется middleware для авто-применения)
    savePreferredLanguage(newLocale);
    
    const segments = pathname.split('/').filter(Boolean);
    if (locales.includes(segments[0] as Locale)) {
      segments.shift();
    }
    const newPath = `/${newLocale}${segments.length ? '/' + segments.join('/') : ''}`;
    startTransition(() => router.push(newPath));
    setIsLangDropdownOpen(false);
  };

  const handleLogout = async () => {
    if (!logoutConfirm) {
      setLogoutConfirm(true);
      setLogoutCountdown(3);
      return;
    }

    if (logoutCountdown > 0) return;

    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout request failed');
      router.push(`/${currentLocale}/login`);
      router.refresh();
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoggingOut(false);
      setLogoutConfirm(false);
      setLogoutCountdown(0);
    }
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const destination = query.match(/акци|скид|промо|promo|sale/)
      ? `/${currentLocale}#promotions`
      : query.match(/меню|блюд|menu/)
        ? `/${currentLocale}/menu`
        : query.match(/брон|столик|booking/)
          ? `/${currentLocale}/booking`
          : query.match(/заказ|order/)
            ? `/${currentLocale}/orders`
            : query.match(/корз|cart/)
              ? `/${currentLocale}/cart`
              : query.match(/избран|favorite/)
                ? `/${currentLocale}/menu?view=favorites`
                : query.match(/профил|profile/)
                  ? `/${currentLocale}/profile`
                  : query.match(/админ|admin/)
                    ? `/${currentLocale}/admin`
                    : query.match(/контакт|contact/)
                      ? `/${currentLocale}#contact`
                      : null;

    if (destination) {
      if (destination.startsWith(`${pathname}#`)) {
        document.querySelector(destination.slice(destination.indexOf('#')))?.scrollIntoView({ behavior: 'smooth' });
      } else {
        router.push(destination);
      }
      setSearchQuery('');
      return;
    }

    const searchable = Array.from(document.querySelectorAll<HTMLElement>('h1, h2, h3, p, a, button'));
    const match = searchable.find((element) => element.textContent?.toLowerCase().includes(query));
    if (match) {
      match.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSearchQuery('');
    }
  };

  const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    admin: { 
      label: ui.profile.roleLabels.admin, 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <ShieldCheck className="w-3 h-3" />
    },
    manager: { 
      label: ui.profile.roleLabels.manager, 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <LayoutDashboard className="w-3 h-3" />
    },
    kitchen: { 
      label: ui.header.kitchen, 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <User className="w-3 h-3" />
    },
    employee: { 
      label: ui.profile.roleLabels.employee, 
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
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
  const isStaff = Boolean(user && ['employee', 'kitchen', 'manager', 'admin'].includes(user.role));

  const getNavLinks = () => {
    const labels = {
      ru: { menu: 'Меню', booking: 'Бронь', orders: 'Мои заказы' },
      en: { menu: 'Menu', booking: 'Booking', orders: 'My orders' },
      kg: { menu: 'Меню', booking: 'Брондоо', orders: 'Менин заказдарым' },
    }[currentLocale];
    if (isStaff) {
      const staffLinks = [] as Array<{ href: string; label: string }>;
      if (user?.role === 'admin' || user?.role === 'manager') {
        staffLinks.push({ href: `/${currentLocale}/admin`, label: ui.header.admin });
        staffLinks.push({ href: `/${currentLocale}/admin/deliveries`, label: currentLocale === 'en' ? 'Deliveries' : currentLocale === 'kg' ? 'Жеткирүү' : 'Доставка' });
      }
      if (user?.role === 'kitchen') staffLinks.push({ href: '/kitchen', label: ui.header.kitchen });
      return staffLinks;
    }

    const links = [
      { href: `/${currentLocale}/menu`, label: labels.menu },
      { href: `/${currentLocale}/booking`, label: labels.booking },
      { href: `/${currentLocale}/orders`, label: labels.orders },
    ];

    return links;
  };

  const navLinks = getNavLinks();
  const isCustomerSurface = pathname.startsWith(`/${currentLocale}`)
    && !pathname.includes('/admin')
    && !pathname.includes('/login')
    && !pathname.includes('/register')
    && !pathname.includes('/forgot-password')
    && !isStaff;
  const mobileNavLinks = [
    { href: `/${currentLocale}/menu`, label: currentLocale === 'en' ? 'Menu' : 'Меню', icon: Utensils },
    { href: `/${currentLocale}/booking`, label: currentLocale === 'en' ? 'Booking' : 'Бронь', icon: CalendarDays },
    { href: `/${currentLocale}/orders`, label: currentLocale === 'en' ? 'Orders' : 'Заказы', icon: ClipboardList },
    { href: `/${currentLocale}/cart`, label: currentLocale === 'en' ? 'Cart' : 'Корзина', icon: ShoppingCart },
  ];

  const getNavIcon = (href: string) => {
    if (href.includes('/booking')) return CalendarDays;
    if (href.includes('/orders')) return ClipboardList;
    if (href.includes('/admin')) return ShieldCheck;
    if (href.includes('/deliveries')) return ShoppingCart;
    return Utensils;
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
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#151a1e]/95 shadow-sm backdrop-blur-md">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-orange-500 hover:text-white md:hidden"
            aria-label={isMobileMenuOpen ? ui.header.closeMenu : ui.header.openMenu}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link href={`/${currentLocale}`} className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Image 
              src={siteLogo}
              alt="CafeFlow" 
              width={40} 
              height={40} 
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-xl object-cover shadow-lg" 
            />
            <span className="text-lg font-bold text-[#f5c98a] sm:text-xl">
              {siteName}
            </span>
          </Link>

          <form onSubmit={handleSearch} className="hidden min-w-0 flex-1 md:flex">
            <label className="flex h-10 w-full items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 text-white focus-within:border-orange-400">
              <Search className="h-4 w-4 shrink-0 text-white/60" aria-hidden="true" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={currentLocale === 'en' ? 'Search the site' : currentLocale === 'kg' ? 'Сайттан издөө' : 'Поиск по сайту'}
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
                aria-label={currentLocale === 'en' ? 'Search the site' : 'Поиск по сайту'}
              />
              <button type="submit" className="flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-orange-500 hover:text-white" aria-label="Поиск">
                <Search className="h-4 w-4" />
              </button>
            </label>
          </form>

          {/* Right Section */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <button
                type="button"
                onClick={() => void markNotificationsRead()}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-orange-500 hover:text-white"
                aria-label="Уведомления"
                title="Уведомления"
                >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-5 text-white">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
              </button>
            )}

            {/* Theme Switcher */}
            <div className="hidden md:block">
              <button
                onClick={toggleTheme}
                  className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-orange-500 hover:text-white"
                aria-label={theme === 'light' ? ui.header.darkTheme : ui.header.lightTheme}
                title={theme === 'light' ? ui.header.darkTheme : ui.header.lightTheme}
              >
                {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              </button>
            </div>

            <Link href={`/${currentLocale}/cart`} className="hidden h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-orange-500 hover:text-white md:flex" aria-label="Корзина" title="Корзина">
              <ShoppingCart className="h-4 w-4" />
            </Link>

            <Link href={`/${currentLocale}/menu?view=favorites`} className="hidden h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-orange-500 hover:text-white md:flex" aria-label="Избранное" title="Избранное">
              <Heart className="h-4 w-4" />
            </Link>

            {/* Language Switcher */}
            <div className="hidden md:block relative" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-white/70 transition-colors hover:bg-orange-500 hover:text-white sm:gap-2 sm:px-3"
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
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-white transition-colors hover:bg-white/10"
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
                    
                    <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
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
                        href={`/${currentLocale}/profile`}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        {ui.header.profile}
                      </Link>

                      <Link
                        href={`/${currentLocale}/profile#settings`}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        {ui.header.settings}
                      </Link>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut || logoutCountdown > 0}
                        className={`flex items-center gap-3 px-4 py-2 text-sm w-full transition-colors ${
                          logoutConfirm
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                        } disabled:opacity-50`}
                      >
                        <LogOut className="w-4 h-4" />
                        {isLoggingOut ? ui.header.loggingOut : logoutConfirm ? `${ui.header.confirmLogout}${logoutCountdown > 0 ? ` (${logoutCountdown})` : ''}` : ui.header.logout}
                      </button>
                    </div>
                  )}
                </div>

              </>
            ) : (
              <div className="hidden h-full items-center gap-3 md:flex">
                <Link
                  href={`/${currentLocale}/login`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white transition-colors hover:border-orange-400 hover:bg-orange-500 hover:text-white"
                >
                  {ui.header.login}
                </Link>
                <Link
                  href={`/${currentLocale}/register`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  {ui.header.register}
                </Link>
              </div>
            )}

          </div>
        </div>

        <nav className="hidden min-h-12 items-center justify-center gap-2 border-t border-white/10 md:flex" aria-label="Основная навигация">
          <Link href={`/${currentLocale}`} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${pathname === `/${currentLocale}` ? 'bg-orange-500 text-white' : 'text-white/75 hover:bg-orange-500/15 hover:text-orange-300'}`}><Home className="h-4 w-4" />{ui.header.home}</Link>
          {navLinks.map((link) => {
            const Icon = getNavIcon(link.href);
            return <Link key={link.href} href={link.href} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${pathname === link.href ? 'bg-orange-500 text-white' : 'text-white/75 hover:bg-orange-500/15 hover:text-orange-300'}`}><Icon className="h-4 w-4" />{link.label}</Link>;
          })}
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="absolute left-0 right-0 top-full border-t border-white/10 bg-[#151a1e] py-4 shadow-xl md:max-w-md md:rounded-b-lg">
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
                  <Link href={`/${currentLocale}/login`} className="flex min-h-[44px] items-center px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    {ui.header.login}
                  </Link>
                  <Link href={`/${currentLocale}/register`} className="mx-4 flex min-h-[44px] items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700">
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
                  href={`/${currentLocale}/profile`}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] transition-colors"
                >
                  <User className="w-4 h-4" />
                  {ui.header.profile}
                </Link>

                <Link
                  href={`/${currentLocale}/profile#settings`}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {ui.header.settings}
                </Link>

                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut || logoutCountdown > 0}
                  className={`flex items-center gap-3 px-4 py-3 text-sm w-full min-h-[44px] transition-all ${
                    logoutConfirm
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                      : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                  } disabled:opacity-50`}
                >
                  <LogOut className="w-4 h-4" />
                  {isLoggingOut ? ui.header.loggingOut : logoutConfirm ? `${ui.header.confirmLogout}${logoutCountdown > 0 ? ` (${logoutCountdown})` : ''}` : ui.header.logout}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>

      {isCustomerSurface && (
        <nav className="mobile-bottom-nav md:hidden" aria-label={currentLocale === 'en' ? 'Main navigation' : 'Основная навигация'}>
        <Link href={`/${currentLocale}`} className={`mobile-bottom-nav__item ${pathname === `/${currentLocale}` ? 'mobile-bottom-nav__item--active' : ''}`}>
          <Home className="h-5 w-5" aria-hidden="true" />
          <span>{currentLocale === 'en' ? 'Home' : 'Главная'}</span>
        </Link>
        {mobileNavLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`mobile-bottom-nav__item ${active ? 'mobile-bottom-nav__item--active' : ''}`}>
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          );
        })}
        </nav>
      )}
    </>
  );
}
