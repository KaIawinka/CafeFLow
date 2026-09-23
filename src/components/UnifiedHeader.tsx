'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { startTransition, useState, useEffect, useRef } from 'react';
import { locales, localeNames, type Locale } from '@/app/i18n/config';
import { getLocaleTranslations } from '@/app/i18n/catalog';
import { useTheme } from '@/components/ThemeProvider';
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
  Info,
  MapPin,
  Phone,
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

type SearchItem = { label: string; description: string; href: string; keywords: readonly string[] };

function collectTranslationSearchItems(value: unknown, path: string, href: string, result: SearchItem[] = []) {
  if (typeof value === 'string' && value.trim().length > 2) {
    result.push({ label: value, description: path, href, keywords: [value] });
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      collectTranslationSearchItems(child, path ? `${path} / ${key}` : key, href, result);
    });
  }
  return result;
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
  const translations = getLocaleTranslations(currentLocale);
  const header = translations.ui.header;
  const roleLabels = translations.ui.profile.roles;
  const isStaff = Boolean(user && ['employee', 'kitchen', 'manager', 'admin'].includes(user.role));
  const canSearchAdmin = user?.role === 'admin' || user?.role === 'manager';

  const searchItemMeta = [
    { key: 'home', href: `/${currentLocale}`, keywords: ['главная', 'home', 'башкы', 'добро пожаловать', 'атмосфера', 'еда'] },
    { key: 'menu', href: `/${currentLocale}/menu`, keywords: ['меню', 'блюда', 'menu', 'еда', 'напитки', 'кофе', 'завтрак', 'шеф', 'десерт'] },
    { key: 'booking', href: `/${currentLocale}/booking`, keywords: ['бронь', 'бронирование', 'столик', 'booking', 'брондо', 'ужин', 'встреча'] },
    { key: 'orders', href: `/${currentLocale}/orders`, keywords: ['заказы', 'заказ', 'orders', 'буйрутма', 'доставка', 'статус'] },
    { key: 'cart', href: `/${currentLocale}/cart`, keywords: ['корзина', 'cart', 'себет'] },
    { key: 'favorites', href: `/${currentLocale}/favorites`, keywords: ['избранное', 'favorites', 'сүйүктүү', 'любимое'] },
    { key: 'reviews', href: `/${currentLocale}/reviews`, keywords: ['отзывы', 'reviews', 'пикирлер', 'комментарии', 'мнения'] },
    { key: 'about', href: `/${currentLocale}/about`, keywords: ['о нас', 'about', 'биз жөнүндө', 'компания', 'история'] },
    { key: 'locations', href: `/${currentLocale}/locations`, keywords: ['адреса', 'locations', 'дарек', 'филиалы', 'карта', '2гис'] },
    { key: 'contact', href: `/${currentLocale}/contact`, keywords: ['контакты', 'contact', 'байланыш', 'связь', 'телефон', 'email'] },
    { key: 'promotions', href: `/${currentLocale}#promotions`, keywords: ['акции', 'скидки', 'промо', 'promo', 'sale', 'акция', 'новинка', 'сезон'] },
    { key: 'profile', href: `/${currentLocale}/profile`, keywords: ['профиль', 'profile', 'личные данные'] },
    { key: 'settings', href: `/${currentLocale}/settings`, keywords: ['настройки', 'settings', 'жөндөөлөр', 'аккаунт', 'уведомления'] },
    { key: 'registration', href: `/${currentLocale}/register`, keywords: ['регистрация', 'register', 'sign up', 'катталуу', 'аккаунт'] },
    { key: 'login', href: `/${currentLocale}/login`, keywords: ['войти', 'login', 'sign in', 'кирүү'] },
    { key: 'forgotPassword', href: `/${currentLocale}/forgot-password`, keywords: ['пароль', 'password', 'забыли', 'forgot', 'сырсөз'] },
    { key: 'adminPanel', href: `/${currentLocale}/admin`, keywords: ['админ', 'admin', 'панель', 'башкаруу'], staffOnly: true },
    { key: 'adminMenu', href: `/${currentLocale}/admin/menu`, keywords: ['админ меню', 'admin menu', 'категории', 'блюда'], staffOnly: true },
    { key: 'deliveries', href: `/${currentLocale}/admin/deliveries`, keywords: ['доставка', 'deliveries', 'жеткирүү'], staffOnly: true },
    { key: 'adminDashboard', href: `/${currentLocale}/admin/dashboard`, keywords: ['dashboard', 'статистика', 'показатели', 'башкаруу'], staffOnly: true },
  ] as const;
  const searchItems: SearchItem[] = searchItemMeta
    .filter((item) => !('staffOnly' in item) || canSearchAdmin)
    .filter((item) => item.key !== 'cart' || !isStaff)
    .map(({ key, href, keywords }) => ({ ...header.searchItems[key], href, keywords }));
  const translationSearchItems = collectTranslationSearchItems(translations, 'i18n', pathname)
    .filter((item) => !item.label.includes('google_'));
  const searchableItems = [...searchItems, ...translationSearchItems];

  const searchResults = searchQuery.trim()
    ? searchableItems
      .filter((item, index, items) => items.findIndex((candidate) => candidate.label === item.label && candidate.href === item.href) === index)
      .filter((item) => `${item.label} ${item.description} ${item.keywords.join(' ')}`.toLowerCase().includes(searchQuery.trim().toLowerCase()))
    : [];
  const similarResults = searchQuery.trim() && searchResults.length === 0
    ? searchableItems.filter((item) => item.keywords.some((keyword) => keyword[0] === searchQuery.trim().toLowerCase()[0])).slice(0, 3)
    : [];

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
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMobileMenuOpen(false);
    };
    mediaQuery.addEventListener('change', closeOnDesktop);
    if (mediaQuery.matches) {
      const timeoutId = window.setTimeout(() => setIsMobileMenuOpen(false), 0);
      return () => {
        window.clearTimeout(timeoutId);
        mediaQuery.removeEventListener('change', closeOnDesktop);
      };
    }
    return () => mediaQuery.removeEventListener('change', closeOnDesktop);
  }, []);

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
    const newPath = `/${newLocale}${segments.length ? '/' + segments.join('/') : ''}${window.location.search}${window.location.hash}`;
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

  const navigateToSearchResult = (destination: string) => {
    if (destination.includes('/admin') && !canSearchAdmin) return;
    if (destination === pathname) {
      const query = searchQuery.trim().toLowerCase();
      const match = Array.from(document.querySelectorAll<HTMLElement>('main, main *'))
        .filter((element) => element.children.length === 0)
        .find((element) => element.textContent?.toLowerCase().includes(query));
      match?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else if (destination.startsWith(`${pathname}#`)) {
      document.querySelector(destination.slice(destination.indexOf('#')))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      router.push(destination);
    }
    setSearchQuery('');
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    if (searchResults[0]) {
      navigateToSearchResult(searchResults[0].href);
      return;
    }

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
                    : canSearchAdmin && query.match(/админ|admin|башкаруу|башкаруу панели/)
                    ? `/${currentLocale}/admin`
                    : query.match(/контакт|contact/)
                      ? `/${currentLocale}#contact`
                      : null;

    if (destination) return navigateToSearchResult(destination);

    const searchable = Array.from(document.querySelectorAll<HTMLElement>('main, main *')).filter((element) => element.children.length === 0);
    const match = searchable.find((element) => element.textContent?.toLowerCase().includes(query));
    if (match) {
      match.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setSearchQuery('');
    }
  };

  const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    admin: { 
      label: roleLabels.admin,
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <ShieldCheck className="w-3 h-3" />
    },
    manager: { 
      label: roleLabels.manager,
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <LayoutDashboard className="w-3 h-3" />
    },
    kitchen: { 
      label: roleLabels.kitchen,
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <User className="w-3 h-3" />
    },
    employee: { 
      label: roleLabels.employee,
      color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
      icon: <User className="w-3 h-3" />
    },
    customer: { 
      label: roleLabels.customer,
      color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      icon: <UserCircle className="w-3 h-3" />
    },
    guest: { 
      label: roleLabels.guest,
      color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
      icon: <UserCircle className="w-3 h-3" />
    },
  };

  const currentRole = user ? roleConfig[user.role] || roleConfig.customer : null;
  const isAdmin = user?.role === 'admin';

  const getNavLinks = () => {
    const labels = header.nav;
    if (isStaff) {
      const staffLinks = [] as Array<{ href: string; label: string }>;
      if (user?.role === 'admin' || user?.role === 'manager') {
        staffLinks.push({ href: `/${currentLocale}/admin`, label: header.adminPanel });
        if (user.role !== 'admin') {
          staffLinks.push({ href: `/${currentLocale}/admin/deliveries`, label: header.nav.deliveries });
        }
      }
      if (user?.role === 'kitchen') staffLinks.push({ href: '/kitchen', label: header.kitchen });
      return staffLinks;
    }

    const links = [
      { href: `/${currentLocale}/menu`, label: labels.menu },
      { href: `/${currentLocale}/booking`, label: labels.booking },
      { href: `/${currentLocale}/favorites`, label: 'Избранное' },
      { href: `/${currentLocale}/reviews`, label: 'Отзывы' },
      { href: `/${currentLocale}/about`, label: 'О нас' },
      { href: `/${currentLocale}/locations`, label: 'Адреса' },
      { href: `/${currentLocale}/contact`, label: 'Контакты' },
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
    { href: `/${currentLocale}/menu`, label: header.nav.menu, icon: Utensils },
    { href: `/${currentLocale}/booking`, label: header.nav.booking, icon: CalendarDays },
    { href: `/${currentLocale}/favorites`, label: 'Избранное', icon: Heart },
    { href: `/${currentLocale}/cart`, label: header.nav.cart, icon: ShoppingCart },
  ];

  const getNavIcon = (href: string) => {
    if (href.includes('/booking')) return CalendarDays;
    if (href.includes('/orders')) return ClipboardList;
    if (href.includes('/admin')) return ShieldCheck;
    if (href.includes('/deliveries')) return ShoppingCart;
    return Utensils;
  };

  // Get localized language names
  const getLocalizedLanguageName = (locale: Locale): string => header.languageNames[locale] || localeNames[locale];

  return (
    <>
      <header data-theme={theme} className="header-surface sticky top-0 z-[100] isolate w-full border-b border-white/10 bg-[#151a1e]/95 shadow-sm backdrop-blur-md">
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-16 items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-orange-500 hover:text-white md:hidden"
            aria-label={isMobileMenuOpen ? header.closeMenu : header.openMenu}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Logo */}
          <Link href={`/${currentLocale}`} className="absolute left-1/2 flex max-w-[160px] -translate-x-1/2 items-center gap-2 truncate sm:static sm:max-w-none sm:translate-x-0 sm:gap-3">
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

          <form onSubmit={handleSearch} className="relative hidden min-w-0 flex-1 md:flex">
            <label className="header-search flex h-10 w-full items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 text-white">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={header.search.placeholder}
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
                aria-label={header.search.placeholder}
              />
              <button type="submit" className="header-search-submit flex h-7 w-7 items-center justify-center rounded-md text-white/70 transition-colors hover:bg-orange-500 hover:text-white" aria-label={header.search.submit}>
                <Search className="h-4 w-4" />
              </button>
            </label>
            {searchQuery.trim() && (
              <div className="header-search-results absolute left-0 right-0 top-[calc(100%+0.6rem)] z-[60] overflow-hidden rounded-xl border border-white/10 bg-[#20272c] p-2 shadow-2xl">
                {searchResults.length > 0 ? (
                  <>
                    <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-300">{header.search.found}</p>
                    {searchResults.slice(0, 5).map((item) => <button type="button" key={item.href} onClick={() => navigateToSearchResult(item.href)} className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left text-white transition hover:bg-orange-500/15"><Search className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" /><span><strong className="block text-sm">{item.label}</strong><span className="block text-xs text-white/55">{item.description}</span></span></button>)}
                  </>
                ) : (
                  <>
                    <p className="px-3 pb-2 pt-1 text-sm font-semibold text-white">{header.search.nothingFound}</p>
                    <p className="px-3 pb-2 text-xs text-white/55">{header.search.similar}</p>
                    {similarResults.length > 0 ? similarResults.map((item) => <button type="button" key={item.href} onClick={() => navigateToSearchResult(item.href)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-white/75 transition hover:bg-orange-500/15 hover:text-white"><Search className="h-4 w-4 text-orange-300" />{item.label}</button>) : <p className="px-3 pb-2 text-xs text-white/45">{header.search.suggestions}</p>}
                  </>
                )}
              </div>
            )}
          </form>

          {/* Right Section */}
          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            {user && (
              <button
                type="button"
                onClick={() => void markNotificationsRead()}
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-orange-500 hover:text-white"
                aria-label={header.notifications}
                title={header.notifications}
                >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-600 px-1 text-center text-[10px] font-bold leading-5 text-white">{unreadNotifications > 99 ? '99+' : unreadNotifications}</span>}
              </button>
            )}

            {/* Theme Switcher */}
            <div className="hidden md:block">
              <label className="cafeflow-theme-switch" title={theme === 'light' ? header.themeDark : header.themeLight}>
                <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} aria-label={theme === 'light' ? header.themeDark : header.themeLight} />
                <span className="cafeflow-theme-switch__slider"><Sun className="cafeflow-theme-switch__sun" /><Moon className="cafeflow-theme-switch__moon" /></span>
              </label>
            </div>

            {!isStaff && (
              <>
                <Link href={`/${currentLocale}/cart`} className="hidden h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-orange-500 hover:text-white md:flex" aria-label={header.nav.cart} title={header.nav.cart}>
                  <ShoppingCart className="h-4 w-4" />
                </Link>

                <Link href={`/${currentLocale}/menu?view=favorites`} className="hidden h-10 w-10 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-orange-500 hover:text-white md:flex" aria-label={header.nav.favorites} title={header.nav.favorites}>
                  <Heart className="h-4 w-4" />
                </Link>
              </>
            )}

            {/* Language Switcher */}
            <div className="hidden md:block relative" ref={langDropdownRef}>
              <button
                onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-white/70 transition-colors hover:bg-orange-500 hover:text-white sm:gap-2 sm:px-3"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs sm:text-sm font-medium hidden sm:inline">{getLocalizedLanguageName(currentLocale)}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangDropdownOpen && (
                <div className="absolute right-0 z-[70] mt-2 w-48 rounded-lg border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
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
                      {getLocalizedLanguageName(locale)}
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
                    className="header-profile flex items-center gap-3 rounded-lg px-3 py-2 text-white transition-colors hover:bg-white/10"
                  >
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt={header.avatar} width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
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
                    <div className="absolute right-0 z-[120] mt-2 w-64 rounded-lg border border-gray-200 bg-white py-2 shadow-xl dark:border-gray-700 dark:bg-gray-800">
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
                        {header.profile}
                      </Link>

                      <Link
                        href={`/${currentLocale}/settings`}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => setIsDropdownOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        {header.settings}
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
                        {isLoggingOut ? header.loggingOut : logoutConfirm ? `${header.logoutConfirm}${logoutCountdown > 0 ? ` (${logoutCountdown})` : ''}` : header.logout}
                      </button>
                    </div>
                  )}
                </div>

              </>
            ) : (
              <div className="hidden h-full items-center gap-3 md:flex">
                <Link
                  href={`/${currentLocale}/login`}
                  className="header-auth-login inline-flex min-h-10 items-center justify-center rounded-lg border border-orange-400/70 px-4 text-sm font-semibold text-orange-200 transition-colors hover:border-orange-400 hover:bg-orange-500 hover:text-white"
                >
                  {header.login}
                </Link>
                <Link
                  href={`/${currentLocale}/register`}
                  className="inline-flex min-h-10 items-center justify-center rounded-lg bg-orange-500 px-4 text-sm font-semibold text-white shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-orange-600"
                >
                  {header.register}
                </Link>
              </div>
            )}

          </div>
        </div>

        <nav className="header-secondary-nav hidden min-h-12 items-center justify-center gap-2 border-t border-white/10 md:flex" aria-label={header.mainNavigation}>
          <Link href={`/${currentLocale}`} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${pathname === `/${currentLocale}` ? 'bg-orange-500 text-white' : 'text-white/75 hover:bg-orange-500/15 hover:text-orange-300'}`}><Home className="h-4 w-4" />{header.home}</Link>
          {navLinks.map((link) => {
            const Icon = getNavIcon(link.href);
            return <Link key={link.href} href={link.href} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors ${pathname === link.href ? 'bg-orange-500 text-white' : 'text-white/75 hover:bg-orange-500/15 hover:text-orange-300'}`}><Icon className="h-4 w-4" />{link.label}</Link>;
          })}
          {!isAdmin && <>
            <Link href={`/${currentLocale}#about`} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-white/75 transition-colors hover:bg-orange-500/15 hover:text-orange-300"><Info className="h-4 w-4" />{header.nav.about}</Link>
            <Link href={`/${currentLocale}#address`} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-white/75 transition-colors hover:bg-orange-500/15 hover:text-orange-300"><MapPin className="h-4 w-4" />{header.nav.address}</Link>
            <Link href={`/${currentLocale}#contact`} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-white/75 transition-colors hover:bg-orange-500/15 hover:text-orange-300"><Phone className="h-4 w-4" />{header.nav.contact}</Link>
          </>}
        </nav>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="header-mobile-menu absolute left-0 right-0 top-full z-[110] border-t border-white/10 bg-[#151a1e] py-4 shadow-xl md:hidden md:max-w-md md:rounded-b-lg">
            {user && <div className="flex items-center gap-3 px-4 py-3 mb-4">
              {user.avatarUrl ? (
                <Image src={user.avatarUrl} alt={header.avatar} width={40} height={40} className="h-10 w-10 rounded-full object-cover" />
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
                    {header.home}
                  </Link>
                  <Link href={`/${currentLocale}/login`} className="flex min-h-[44px] items-center px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800">
                    {header.login}
                  </Link>
                  <Link href={`/${currentLocale}/register`} className="mx-4 flex min-h-[44px] items-center justify-center rounded-lg bg-amber-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-amber-700">
                    {header.register}
                  </Link>
                </div>
              )}

              <div className="my-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                <label className="flex min-h-[44px] items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                  <span>{theme === 'light' ? header.themeDark : header.themeLight}</span>
                  <span className="cafeflow-theme-switch">
                    <input type="checkbox" checked={theme === 'dark'} onChange={toggleTheme} aria-label={theme === 'light' ? header.themeDark : header.themeLight} />
                    <span className="cafeflow-theme-switch__slider"><Sun className="cafeflow-theme-switch__sun" /><Moon className="cafeflow-theme-switch__moon" /></span>
                  </span>
                </label>
              </div>

              {/* Mobile Language Selector */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-2 pt-2">
                <div className="px-4 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <Globe className="w-4 h-4" />
                    <span className="font-medium">{header.language}</span>
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
                        {getLocalizedLanguageName(locale)}
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
                  {header.profile}
                </Link>

                <Link
                  href={`/${currentLocale}/settings`}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 min-h-[44px] transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  {header.settings}
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
                  {isLoggingOut ? header.loggingOut : logoutConfirm ? `${header.logoutConfirm}${logoutCountdown > 0 ? ` (${logoutCountdown})` : ''}` : header.logout}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>

      {isCustomerSurface && (
        <nav className="mobile-bottom-nav md:hidden" aria-label={header.mainNavigation}>
        <Link href={`/${currentLocale}`} className={`mobile-bottom-nav__item ${pathname === `/${currentLocale}` ? 'mobile-bottom-nav__item--active' : ''}`}>
          <Home className="h-5 w-5" aria-hidden="true" />
          <span>{header.home}</span>
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
