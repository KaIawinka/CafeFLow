import { ShieldCheck, LayoutDashboard, User, UserCircle } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';
import { localeNames } from '@/app/i18n/config';

export interface RoleConfig {
  label: string;
  color: string;
  icon: React.ReactNode;
}

export const roleConfig: Record<string, RoleConfig> = {
  admin: {
    label: 'Администратор',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    icon: <ShieldCheck className="w-3 h-3" />,
  },
  manager: {
    label: 'Менеджер',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    icon: <LayoutDashboard className="w-3 h-3" />,
  },
  kitchen: {
    label: 'Кухня',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    icon: <User className="w-3 h-3" />,
  },
  employee: {
    label: 'Сотрудник',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    icon: <User className="w-3 h-3" />,
  },
  customer: {
    label: 'Клиент',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    icon: <UserCircle className="w-3 h-3" />,
  },
  guest: {
    label: 'Гость',
    color: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    icon: <UserCircle className="w-3 h-3" />,
  },
};

export const themeLabels = {
  light: 'Светлая',
  dark: 'Тёмная',
};

// Локализованные названия языков
const languageNames: Record<Locale, Record<Locale, string>> = {
  ru: { ru: 'Русский', en: 'Английский', kg: 'Кыргызский' },
  en: { ru: 'Russian', en: 'English', kg: 'Kyrgyz' },
  kg: { ru: 'Орусча', en: 'Англисче', kg: 'Кыргызча' },
};

export function getLocalizedLanguageName(locale: Locale, inLocale: Locale): string {
  return languageNames[inLocale]?.[locale] || localeNames[locale];
}

export interface NavLink {
  href: string;
  label: string;
}

export function getNavLinks(userRole?: string): NavLink[] {
  if (!userRole) return [];

  const links: NavLink[] = [];

  if (userRole === 'admin' || userRole === 'manager') {
    links.push({ href: '/admin', label: 'Админ панель' });
  }

  if (userRole === 'kitchen') {
    links.push({ href: '/kitchen', label: 'Кухня' });
  }

  links.push({ href: '/orders', label: 'Заказы' });

  return links;
}

export function getUserDisplayName(firstName: string, lastName?: string, displayName?: string): string {
  return displayName || `${firstName} ${lastName || ''}`.trim();
}

export function getUserInitials(firstName?: string): string {
  return firstName?.[0]?.toUpperCase() || 'U';
}
