'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { locales, type Locale } from '@/app/i18n/config';
import { LanguageSwitcher } from './LanguageSwitcher';
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

interface UserHeaderProps {
  user?: UserData | null;
}

export function UserHeader({ user }: UserHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu after navigation without a synchronous state update in the effect.
  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const timeoutId = window.setTimeout(() => setIsMobileMenuOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [pathname, isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
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

  // Navigation links based on role
  const getNavLinks = () => {
    if (!user) return [];
    
    const links = [];
    
    // Admin and Manager can access admin panel
    if (user.role === 'admin' || user.role === 'manager') {
      links.push({ href: '/admin', label: 'Админ панель' });
    }
    
    // Kitchen staff
    if (user.role === 'kitchen') {
      links.push({ href: '/kitchen', label: 'Кухня' });
    }
    
    // All authenticated users
    links.push({ href: '/orders', label: 'Заказы' });
    
    return links;
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/ru" className="flex items-center gap-3">
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

          {/* User Menu or Auth Buttons */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLocale={(locales.find((locale) => pathname.split('/')[1] === locale) || 'ru') as Locale} />
            {user ? (
              <>
                {/* Desktop User Dropdown */}
                <div className="hidden md:block relative" ref={dropdownRef}>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    {/* Avatar */}
                    {user.avatarUrl ? (
                      <Image src={user.avatarUrl} alt="Аватар" width={32} height={32} className="h-8 w-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-sm font-semibold">
                        {user.firstName?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    
                    {/* User Info */}
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

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {user.displayName || `${user.firstName} ${user.lastName || ''}`.trim()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {user.email}
                        </div>
                      </div>

                      {/* Menu Items */}
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
                        className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Выйти
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
              // Not logged in
              <div className="flex items-center gap-3">
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
            {/* User Info */}
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

            {/* Navigation Links */}
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
                className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
