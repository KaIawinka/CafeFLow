'use client';

import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Users,
  Settings as SettingsIcon,
  Loader2,
  Search,
  Save,
  ShoppingCart,
  Package,
  CalendarDays,
  Table2,
  ChefHat,
  Truck,
  ArrowRight,
  LayoutDashboard,
  SlidersHorizontal,
  CalendarClock,
  ArrowDownAZ,
  AtSign,
  ShieldCheck,
  CircleDot,
  RotateCcw,
} from 'lucide-react';
import { locales, type Locale } from '@/app/i18n/config';
import { getUiTranslations } from '@/lib/ui-translations';
import AdminDashboardClient from './dashboard/AdminDashboardClient';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  display_name?: string;
  phone?: string;
  telegram_username?: string;
  role: string;
  status: string;
  created_at: string;
  last_login_at?: string;
  last_seen_at?: string;
  is_online?: boolean;
  requires_approval: boolean;
  two_fa_enabled: boolean;
  language: string;
}

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  logoData: string;
  primaryColor: string;
  maintenanceMode: boolean;
  timezone: string;
  contactPhone: string;
  contactEmail: string;
  addressText: string;
}

interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  payment_status: string;
  total: string | number;
  currency: string;
  created_at: string;
}

interface AdminReservation {
  id: string;
  guest_name: string;
  guest_phone: string;
  guests_count: number;
  start_at: string;
  end_at: string;
  status: string;
  table_ids?: unknown;
  comment?: string | null;
}

interface Product {
  id: string;
  name: string;
  price: string | number;
  currency: string;
  is_available: boolean;
  is_featured: boolean;
  category?: { name: string } | null;
}

type AdminTab = 'dashboard' | 'users' | 'orders' | 'reservations' | 'products' | 'settings';

const pageCopy: Record<Locale, {
  back: string; page: string; of: string; next: string; reservations: string; kitchen: string; waiters: string;
  confirm: string; takeOrder: string; ready: string; pickup: string; confirmDelivery: string; dbOrder: string; tableDetails: string;
  reservationsDescription: string; confirmed: string; allStatuses: string; reset: string; capacity: string; request: string; free: string;
  guests: string; cancel: string; noReservations: string;
}> = {
  ru: { back: 'Назад', page: 'Страница', of: 'из', next: 'Вперёд', reservations: 'Брони', kitchen: 'Кухня', waiters: 'Официанты', confirm: 'Подтвердить', takeOrder: 'Взять в работу', ready: 'Готово', pickup: 'Забрать заказ', confirmDelivery: 'Подтвердить доставку', dbOrder: 'Заказ из базы', tableDetails: 'Столик / детали', reservationsDescription: 'Проверяйте свободные места и подтверждайте заявки гостей.', confirmed: 'подтверждено', allStatuses: 'Все статусы', reset: 'Сбросить', capacity: 'до', request: 'заявка', free: 'Свободен', guests: 'гостей', cancel: 'Отменить', noReservations: 'Бронирований пока нет' },
  en: { back: 'Back', page: 'Page', of: 'of', next: 'Next', reservations: 'Reservations', kitchen: 'Kitchen', waiters: 'Waiters', confirm: 'Confirm', takeOrder: 'Start preparing', ready: 'Ready', pickup: 'Pick up order', confirmDelivery: 'Confirm delivery', dbOrder: 'Database order', tableDetails: 'Table / details', reservationsDescription: 'Check availability and confirm guest requests.', confirmed: 'confirmed', allStatuses: 'All statuses', reset: 'Reset', capacity: 'up to', request: 'request', free: 'Available', guests: 'guests', cancel: 'Cancel', noReservations: 'No reservations yet' },
  kg: { back: 'Артка', page: 'Барак', of: 'ичинен', next: 'Алдыга', reservations: 'Брондоолор', kitchen: 'Ашкана', waiters: 'Официанттар', confirm: 'Ырастоо', takeOrder: 'Иштөөгө алуу', ready: 'Даяр', pickup: 'Буйрутманы алуу', confirmDelivery: 'Жеткирүүнү ырастоо', dbOrder: 'Маалымат базасындагы буйрутма', tableDetails: 'Стол / маалымат', reservationsDescription: 'Бош орундарды текшерип, коноктордун өтүнүчтөрүн ырастаңыз.', confirmed: 'ырасталды', allStatuses: 'Бардык статустар', reset: 'Тазалоо', capacity: 'чейин', request: 'өтүнүч', free: 'Бош', guests: 'конок', cancel: 'Жокко чыгаруу', noReservations: 'Брондоолор азырынча жок' },
};

const orderStatusLabels: Record<Locale, Record<string, string>> = {
  ru: { new: 'Новый', confirmed: 'Подтверждён', cooking: 'Готовится', ready: 'Готов', delivering: 'Доставка', completed: 'Завершён', cancelled: 'Отменён' },
  en: { new: 'New', confirmed: 'Confirmed', cooking: 'Cooking', ready: 'Ready', delivering: 'Delivery', completed: 'Completed', cancelled: 'Cancelled' },
  kg: { new: 'Жаңы', confirmed: 'Ырасталды', cooking: 'Даярдалууда', ready: 'Даяр', delivering: 'Жеткирүү', completed: 'Аяктады', cancelled: 'Жокко чыгарылды' },
};

const reservationStatusLabels: Record<Locale, Record<string, string>> = {
  ru: { pending: 'Ожидает', confirmed: 'Подтверждено', seated: 'Гости за столом', completed: 'Завершено', cancelled: 'Отменено', no_show: 'Не пришли' },
  en: { pending: 'Pending', confirmed: 'Confirmed', seated: 'Seated', completed: 'Completed', cancelled: 'Cancelled', no_show: 'No-show' },
  kg: { pending: 'Күтүүдө', confirmed: 'Ырасталды', seated: 'Отурду', completed: 'Аякталды', cancelled: 'Жокко чыгарылды', no_show: 'Келген жок' },
};

function PaginationControls({ page, pageCount, onPageChange, copy }: { page: number; pageCount: number; onPageChange: (page: number) => void; copy: typeof pageCopy[Locale] }) {
  if (pageCount <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button type="button" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200">{copy.back}</button>
      <span className="text-sm text-gray-500 dark:text-gray-400">{copy.page} {page} {copy.of} {pageCount}</span>
      <button type="button" onClick={() => onPageChange(Math.min(pageCount, page + 1))} disabled={page === pageCount} className="min-h-10 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200">{copy.next}</button>
    </div>
  );
}

export default function AdminPage() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = (locales.find((item) => pathname.split('/')[1] === item) || 'ru') as Locale;
  const ui = getUiTranslations(locale);
  const copy = pageCopy[locale];
  const dashboardLabel = ui.admin.stats;
  const errorLoad = ui.admin.errorLoad;
  const requestedTab = searchParams.get('tab');
  const initialTab = ['dashboard', 'users', 'orders', 'reservations', 'products', 'settings'].includes(requestedTab || '') ? requestedTab as AdminTab : 'dashboard';
  const [activeTab, setActiveTab] = useState<AdminTab>(initialTab);
  const [isLoading, setIsLoading] = useState(initialTab !== 'dashboard');
  const [hasLoadedDashboard, setHasLoadedDashboard] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [reservations, setReservations] = useState<AdminReservation[]>([]);
  const [reservationTables, setReservationTables] = useState<Array<{ id: string; name: string; zone: string | null; capacity: number }>>([]);
  const [reservationPage, setReservationPage] = useState(1);
  const [reservationTotal, setReservationTotal] = useState(0);
  const [reservationStatus, setReservationStatus] = useState('all');
  const [reservationDate, setReservationDate] = useState('');
  const [orderQueue, setOrderQueue] = useState<'kitchen' | 'waiters'>('kitchen');
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterOnline, setFilterOnline] = useState<string>('all');
  const [userSort, setUserSort] = useState('newest');
  const [usersPage, setUsersPage] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [usersTotal, setUsersTotal] = useState(0);
  const [isUsersLoading, setIsUsersLoading] = useState(false);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const usersEndRef = useRef<HTMLDivElement>(null);
  const usersRequestRef = useRef(0);
  const [ordersTotal, setOrdersTotal] = useState(0);

  const changeTab = (tab: AdminTab) => {
    setActiveTab(tab);
    const nextParams = new URLSearchParams(searchParams.toString());
    if (tab === 'dashboard') nextParams.delete('tab');
    else nextParams.set('tab', tab);
    const query = nextParams.toString();
    window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname);
  };
  
  // Site settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'CaféFlow',
    siteDescription: ui.admin.description,
    logoUrl: '/cafeflow-logo.svg',
    logoData: '',
    primaryColor: '#f59e0b',
    maintenanceMode: false,
    timezone: 'Asia/Bishkek',
    contactPhone: '',
    contactEmail: '',
    addressText: '',
  });

  const loadDashboard = useEffectEvent(async (signal: AbortSignal) => {
    if (!hasLoadedDashboard) setIsLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (searchQuery.trim()) query.set('search', searchQuery.trim());
      if (filterRole !== 'all') query.set('role', filterRole);
      if (filterStatus !== 'all') query.set('status', filterStatus);
      if (filterOnline !== 'all') query.set('online', filterOnline);
      query.set('view', activeTab);
      query.set('sort', userSort);
      query.set('usersPage', String(usersPage));
      query.set('ordersPage', String(ordersPage));
      const response = await fetch(`/api/admin/dashboard?${query.toString()}`, { cache: 'no-store', signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || errorLoad);
      const nextUsers = data.users || [];
      setUsers((current) => usersPage === 1 ? nextUsers : [...current, ...nextUsers]);
      setHasLoadedDashboard(true);
      setRecentOrders(data.recentOrders || []);
      setUsersTotal(data.pagination?.usersTotal || 0);
      setHasMoreUsers(usersPage * 25 < (data.pagination?.usersTotal || 0) && nextUsers.length > 0);
      setOrdersTotal(data.pagination?.ordersTotal || 0);
      setProducts(data.products || []);
      if (data.tenant) {
        setSiteSettings((current) => ({
          ...current,
          siteName: data.tenant.name || current.siteName,
          primaryColor: data.tenant.primary_color || current.primaryColor,
          timezone: data.tenant.timezone || current.timezone,
          contactPhone: data.tenant.contact_phone || '',
          contactEmail: data.tenant.contact_email || '',
          addressText: data.tenant.address_text || '',
          siteDescription: typeof data.tenant.settings?.siteDescription === 'string' ? data.tenant.settings.siteDescription : current.siteDescription,
          logoUrl: typeof data.tenant.settings?.logoUrl === 'string' ? data.tenant.settings.logoUrl : current.logoUrl,
          logoData: typeof data.tenant.settings?.logoData === 'string' ? data.tenant.settings.logoData : current.logoData,
          maintenanceMode: data.tenant.settings?.maintenanceMode === true,
        }));
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setError(errorLoad);
    } finally {
      if (!hasLoadedDashboard) setIsLoading(false);
    }
  });

  useEffect(() => {
    if (activeTab === 'dashboard') return;
    const requestId = ++usersRequestRef.current;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadDashboard(controller.signal).finally(() => {
        if (requestId === usersRequestRef.current && usersPage === 1) setIsUsersLoading(false);
      });
    }, 300);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [activeTab, filterRole, filterOnline, filterStatus, searchQuery, userSort, usersPage, ordersPage]);

  useEffect(() => {
    if (activeTab !== 'users' || !hasMoreUsers || !usersEndRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) setUsersPage((page) => page + 1);
    }, { rootMargin: '320px' });
    observer.observe(usersEndRef.current);
    return () => observer.disconnect();
  }, [activeTab, hasMoreUsers, usersPage]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const query = new URLSearchParams({ page: String(reservationPage) });
      if (reservationStatus !== 'all') query.set('status', reservationStatus);
      if (reservationDate) query.set('date', reservationDate);
      void fetch(`/api/admin/reservations?${query.toString()}`, { cache: 'no-store' }).then((response) => response.json()).then((data) => {
        setReservations(data.reservations || []);
        setReservationTables(data.tables || []);
        setReservationTotal(data.pagination?.total || 0);
      }).catch(() => setReservations([]));
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [reservationPage, reservationStatus, reservationDate]);

  const updateUser = async (userId: string, changes: { role?: string; status?: string; requiresApproval?: boolean }) => {
    setSavingId(userId);
    setError('');
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: 'user', id: userId, ...changes }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || ui.admin.errorUser);
      setUsers((current) => current.map((user) => user.id === userId ? { ...user, ...data.user } : user));
    } catch {
      setError(ui.admin.errorUser);
    } finally {
      setSavingId(null);
    }
  };

  const saveTenantSettings = async () => {
    setSavingId('tenant');
    setError('');
    try {
      const response = await fetch('/api/admin/dashboard', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: 'tenant', name: siteSettings.siteName, timezone: siteSettings.timezone, primaryColor: siteSettings.primaryColor, contactPhone: siteSettings.contactPhone || null, contactEmail: siteSettings.contactEmail || null, addressText: siteSettings.addressText || null, siteDescription: siteSettings.siteDescription, logoUrl: siteSettings.logoUrl, logoData: siteSettings.logoData || null, maintenanceMode: siteSettings.maintenanceMode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || ui.admin.errorSave);
      setSiteSettings((current) => ({ ...current, siteName: data.tenant.name, timezone: data.tenant.timezone, primaryColor: data.tenant.primary_color || current.primaryColor, contactPhone: data.tenant.contact_phone || '', contactEmail: data.tenant.contact_email || '', addressText: data.tenant.address_text || '', siteDescription: data.tenant.settings?.siteDescription || current.siteDescription, logoUrl: data.tenant.settings?.logoUrl || current.logoUrl, logoData: data.tenant.settings?.logoData || current.logoData, maintenanceMode: data.tenant.settings?.maintenanceMode === true }));
      router.refresh();
    } catch {
      setError(ui.admin.errorSave);
    } finally {
      setSavingId(null);
    }
  };

  const updateOrder = async (orderId: string, orderStatus: string) => {
    setSavingId(orderId);
    setError('');
    try {
      const response = await fetch('/api/admin/dashboard', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource: 'order', id: orderId, orderStatus }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || ui.admin.errorOrder);
      setRecentOrders((current) => current.map((order) => order.id === orderId ? { ...order, ...data.order } : order));
    } catch {
      setError(ui.admin.errorOrder);
    } finally {
      setSavingId(null);
    }
  };

  const advanceOrder = (order: RecentOrder) => {
    const nextStatus = order.status === 'new' ? 'confirmed' : order.status === 'confirmed' ? 'cooking' : order.status === 'cooking' ? 'ready' : order.status === 'ready' ? 'delivering' : 'completed';
    void updateOrder(order.id, nextStatus);
  };

  const updateReservation = async (reservationId: string, status: string) => {
    const response = await fetch('/api/admin/reservations', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: reservationId, status }) });
    if (response.ok) {
      const data = await response.json();
      setReservations((current) => current.map((reservation) => reservation.id === reservationId ? { ...reservation, status: data.reservation.status } : reservation));
    }
  };

  const updateProduct = async (productId: string, changes: { isAvailable?: boolean; price?: string }) => {
    const product = products.find((item) => item.id === productId);
    if (!product) return;
    setSavingId(productId);
    setError('');
    try {
      const response = await fetch('/api/admin/dashboard', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resource: 'product', id: productId, isAvailable: changes.isAvailable ?? product.is_available, price: changes.price ?? String(product.price) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || ui.admin.errorProduct);
      setProducts((current) => current.map((item) => item.id === productId ? { ...item, ...data.product } : item));
    } catch {
      setError(ui.admin.errorProduct);
    } finally {
      setSavingId(null);
    }
  };

  const filteredUsers = users;
  const userSuggestions = showUserSuggestions && searchQuery.trim() ? users.slice(0, 6) : [];
  const hasUserFilters = Boolean(searchQuery.trim() || filterRole !== 'all' || filterStatus !== 'all' || filterOnline !== 'all' || userSort !== 'newest');
  const resetUserFilters = () => {
    setUsers([]);
    setUsersTotal(0);
    setHasMoreUsers(false);
    setIsUsersLoading(true);
    setSearchQuery('');
    setFilterRole('all');
    setFilterStatus('all');
    setFilterOnline('all');
    setUserSort('newest');
    setUsersPage(1);
  };
  const prepareUserQuery = () => {
    setUsers([]);
    setUsersTotal(0);
    setHasMoreUsers(false);
    setIsUsersLoading(true);
    setUsersPage(1);
  };
  const ordersPageCount = Math.max(1, Math.ceil(ordersTotal / 25));
  const reservationPageCount = Math.max(1, Math.ceil(reservationTotal / 25));

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    kitchen: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    employee: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    customer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  if (isLoading) {
    return (
      <div className="admin-page flex min-h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="admin-page min-h-screen w-full">
      <div className="w-full">
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="font-semibold hover:underline">{ui.admin.close}</button>
          </div>
        )}

        {/* Tabs */}
        <div className="grid min-h-[calc(100vh-7rem)] w-full bg-[var(--background)] lg:grid-cols-[260px_minmax(0,1fr)]">
          <div className="min-h-0 overflow-x-auto border-b border-[var(--border)] bg-[var(--card)] lg:sticky lg:top-[113px] lg:h-[calc(100vh-113px)] lg:self-start lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <nav className="grid grid-cols-2 sm:flex sm:min-w-0 lg:flex-col lg:gap-1 lg:p-3">
              <button
                onClick={() => changeTab('dashboard')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation lg:justify-start lg:rounded-md ${
                  activeTab === 'dashboard'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{dashboardLabel}</span>
              </button>
              <button
                onClick={() => changeTab('users')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation lg:justify-start lg:rounded-md ${
                  activeTab === 'users'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{ui.admin.users}</span>
              </button>
              <button
                onClick={() => changeTab('settings')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation lg:justify-start lg:rounded-md ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{ui.admin.settings}</span>
              </button>
              <button
                onClick={() => changeTab('orders')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation lg:justify-start lg:rounded-md ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{ui.admin.ordersTab}</span>
              </button>
              <button
                onClick={() => changeTab('products')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation lg:justify-start lg:rounded-md ${
                  activeTab === 'products'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{ui.admin.productsTab}</span>
              </button>
              <button
                onClick={() => changeTab('reservations')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation lg:justify-start lg:rounded-md ${
                  activeTab === 'reservations'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>{copy.reservations}</span>
              </button>
            </nav>
          </div>

          <div className="min-w-0 bg-[var(--background)] p-4 sm:p-6 xl:p-10">
            {activeTab === 'dashboard' && <AdminDashboardClient locale={locale} embedded />}

            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
                <div className="xl:min-h-screen">
                <aside className="h-fit rounded-[24px] border border-stone-200/80 bg-[#fffdf8] p-4 shadow-[0_18px_50px_-28px_rgba(34,42,38,0.55)] dark:border-gray-700 dark:bg-gray-900 xl:fixed xl:left-[300px] xl:top-[129px] xl:z-20 xl:w-[300px] xl:max-h-[calc(100vh-145px)] xl:overflow-y-auto">
                  <div className="mb-5 border-b border-stone-200 pb-4 dark:border-gray-700">
                    <div className="flex items-center gap-2 text-base font-black text-gray-900 dark:text-white">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#17332f] text-amber-200"><SlidersHorizontal className="h-4 w-4" /></span>
                      {ui.admin.filterTitle}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">{ui.admin.filterSubtitle}</p>
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400"><span className="mb-1.5 flex items-center gap-2 normal-case tracking-normal text-sm text-gray-800 dark:text-gray-200"><CalendarClock className="h-4 w-4 text-amber-600" />{ui.admin.registered}</span>
                      <select value={userSort} onChange={(event) => { prepareUserQuery(); setUserSort(event.target.value); }} className="mt-1 min-h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                        <option value="newest">{ui.admin.newest}</option>
                        <option value="oldest">{ui.admin.oldest}</option>
                        <option value="nameAsc">{ui.admin.alphabetical} (А → Я)</option>
                        <option value="nameDesc">{ui.admin.alphabetical} (Я → А)</option>
                      </select>
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400"><span className="mb-1.5 flex items-center gap-2 normal-case tracking-normal text-sm text-gray-800 dark:text-gray-200"><ShieldCheck className="h-4 w-4 text-amber-600" />{ui.admin.role}</span>
                      <select value={filterRole} onChange={(event) => { prepareUserQuery(); setFilterRole(event.target.value); }} className="mt-1 min-h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                        <option value="all">{ui.admin.allRoles}</option>
                        <option value="admin">{ui.admin.administrators}</option>
                        <option value="manager">{ui.admin.managers}</option>
                        <option value="kitchen">{ui.admin.roleKitchen}</option>
                        <option value="employee">{ui.admin.employees}</option>
                        <option value="customer">{ui.admin.customers}</option>
                      </select>
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400"><span className="mb-1.5 flex items-center gap-2 normal-case tracking-normal text-sm text-gray-800 dark:text-gray-200"><CircleDot className="h-4 w-4 text-amber-600" />{ui.admin.statusFilter}</span>
                      <select value={filterStatus} onChange={(event) => { prepareUserQuery(); setFilterStatus(event.target.value); }} className="mt-1 min-h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                        <option value="all">{ui.admin.allStatuses}</option>
                        <option value="active">{ui.admin.active}</option>
                        <option value="pending">{ui.admin.pending}</option>
                        <option value="blocked">{ui.admin.blocked}</option>
                      </select>
                    </label>
                    <label className="block text-xs font-bold uppercase tracking-[0.08em] text-gray-500 dark:text-gray-400"><span className="mb-1.5 flex items-center gap-2 normal-case tracking-normal text-sm text-gray-800 dark:text-gray-200"><AtSign className="h-4 w-4 text-amber-600" />{ui.admin.presence}</span>
                      <select value={filterOnline} onChange={(event) => { prepareUserQuery(); setFilterOnline(event.target.value); }} className="mt-1 min-h-11 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 text-sm text-gray-900 outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                        <option value="all">{ui.admin.allPresence}</option>
                        <option value="online">{ui.admin.online}</option>
                        <option value="offline">{ui.admin.offline}</option>
                      </select>
                    </label>
                    {hasUserFilters && <button type="button" onClick={resetUserFilters} className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-stone-200 px-3 text-sm font-bold text-gray-600 transition hover:border-amber-400 hover:text-amber-700 dark:border-gray-700 dark:text-gray-300"><RotateCcw className="h-4 w-4" />{ui.admin.clearFilters}</button>}
                  </div>
                </aside>
                </div>

                <div className="min-w-0 space-y-4 sm:space-y-6 xl:-mt-6">
                  <div className="relative rounded-[24px] border border-stone-200/80 bg-[#fffdf8] p-3 shadow-[0_18px_50px_-28px_rgba(34,42,38,0.55)] dark:border-gray-700 dark:bg-gray-900 xl:sticky xl:top-[129px] xl:z-10">
                    <div className="mb-2 flex items-center justify-between px-1"><div className="flex items-center gap-2 text-sm font-black text-gray-900 dark:text-white"><ArrowDownAZ className="h-4 w-4 text-amber-600" />{ui.admin.users}</div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">{usersTotal}</span></div>
                    <Search className="absolute left-6 top-[4.4rem] -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={ui.admin.searchHint}
                      value={searchQuery}
                      onChange={(e) => { prepareUserQuery(); setShowUserSuggestions(true); setSearchQuery(e.target.value); }}
                      onFocus={() => setShowUserSuggestions(true)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          prepareUserQuery();
                          setShowUserSuggestions(false);
                        }
                      }}
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white touch-manipulation"
                    />
                    {userSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
                        {userSuggestions.map((user) => <button key={user.id} type="button" onClick={() => { prepareUserQuery(); setSearchQuery(user.email); setShowUserSuggestions(false); }} className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left last:border-0 hover:bg-amber-50 dark:border-gray-700 dark:hover:bg-gray-700"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-sm font-bold text-white">{user.first_name[0]?.toUpperCase()}</span><span className="min-w-0"><span className="block truncate text-sm font-semibold text-gray-900 dark:text-white">{user.display_name || `${user.first_name} ${user.last_name || ''}`.trim()}</span><span className="block truncate text-xs text-gray-500 dark:text-gray-400">{user.email} · {new Date(user.created_at).toLocaleDateString(locale)}</span></span></button>)}
                      </div>
                    )}
                  </div>

                {/* Users Table/Cards */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* Desktop Table View */}
                  <div className="hidden">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {ui.admin.user}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {ui.admin.email}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {ui.admin.phone}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {ui.admin.presence}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {ui.admin.role}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {ui.admin.status}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {ui.admin.registered}
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {ui.admin.actions}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <td className="w-[19%] px-4 py-4 align-top">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                                  {user.first_name[0]?.toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {user.display_name || `${user.first_name} ${user.last_name || ''}`.trim()}
                                  {user.telegram_username && <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">@{user.telegram_username}</span>}
                                </span>
                              </div>
                            </td>
                            <td className="w-[18%] break-words px-4 py-4 align-top text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </td>
                            <td className="w-[12%] break-words px-4 py-4 align-top text-sm text-gray-600 dark:text-gray-400">
                              {user.phone || '—'}
                            </td>
                            <td className="w-[12%] px-4 py-4 align-top text-sm">
                              <span className={`inline-flex items-center gap-1.5 ${user.is_online ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}><span className="h-2 w-2 rounded-full bg-current" />{user.is_online ? ui.admin.online : ui.admin.offline}</span>
                            </td>
                            <td className="w-[10%] px-4 py-4 align-top">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                                {ui.profile.roleLabels[user.role] || user.role}
                              </span>
                            </td>
                            <td className="w-[10%] px-4 py-4 align-top">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.status === 'active'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {user.status === 'active' ? ui.admin.active : ui.admin.blocked}
                              </span>
                            </td>
                            <td className="w-[10%] break-words px-4 py-4 align-top text-sm text-gray-600 dark:text-gray-400">
                              {new Date(user.created_at).toLocaleDateString(locale)}
                            </td>
                            <td className="w-[19%] px-4 py-4 align-top text-right">
                              <div className="flex items-center justify-end gap-2">
                                <select
                                  aria-label={`${ui.admin.role}: ${user.email}`}
                                  value={user.role}
                                  disabled={savingId === user.id || user.id === ''}
                                  onChange={(event) => void updateUser(user.id, { role: event.target.value })}
                                  className="min-h-10 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                >
                                  {['customer', 'employee', 'kitchen', 'manager', 'admin'].map((role) => <option key={role} value={role}>{ui.profile.roleLabels[role] || role}</option>)}
                                </select>
                                <select
                                  aria-label={`${ui.admin.status}: ${user.email}`}
                                  value={user.status}
                                  disabled={savingId === user.id || user.id === ''}
                                  onChange={(event) => void updateUser(user.id, { status: event.target.value })}
                                  className="min-h-10 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                                >
                                  <option value="active">{ui.admin.active}</option>
                                  <option value="pending">{ui.admin.pending}</option>
                                  <option value="blocked">{ui.admin.blocked}</option>
                                </select>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="grid gap-2 p-2">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition hover:border-amber-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex items-start gap-2.5 border-b border-stone-100 bg-stone-50/80 p-2.5 dark:border-gray-700 dark:bg-gray-800/80">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-sm font-semibold text-white">
                            {user.first_name[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="truncate font-semibold text-gray-900 dark:text-white">{user.display_name || `${user.first_name} ${user.last_name || ''}`.trim()}</h4>
                            <p className="mt-1 break-all text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[user.role]}`}>{ui.profile.roleLabels[user.role] || user.role}</span>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' : user.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200'}`}>{user.status === 'active' ? ui.admin.active : user.status === 'pending' ? ui.admin.pending : ui.admin.blocked}</span>
                              <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${user.is_online ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}><span className="h-2 w-2 rounded-full bg-current" />{user.is_online ? ui.admin.online : ui.admin.offline}</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-2.5 p-2.5 sm:grid-cols-[1fr_auto] sm:items-center">
                          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-600 dark:text-gray-400">
                            <span>{ui.admin.phone}: {user.phone || '—'}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{ui.admin.registered}: {new Date(user.created_at).toLocaleDateString(locale)}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{ui.profile.lastLogin} {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString(locale) : '—'}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{ui.admin.lastSeen}: {user.last_seen_at ? new Date(user.last_seen_at).toLocaleDateString(locale) : '—'}</span>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {user.requires_approval && <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">{ui.admin.pending}</span>}
                              {user.two_fa_enabled && <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-semibold text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">2FA</span>}
                              <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{user.language.toUpperCase()}</span>
                            </div>
                          </div>
                          <div className="grid w-full gap-2 sm:w-[360px] sm:grid-cols-2">
                            <select aria-label={`${ui.admin.role}: ${user.email}`} value={user.role} disabled={savingId === user.id} onChange={(event) => void updateUser(user.id, { role: event.target.value })} className="min-h-10 min-w-0 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                              {['customer', 'employee', 'kitchen', 'manager', 'admin'].map((role) => <option key={role} value={role}>{ui.profile.roleLabels[role] || role}</option>)}
                            </select>
                            <select aria-label={`${ui.admin.status}: ${user.email}`} value={user.status} disabled={savingId === user.id} onChange={(event) => void updateUser(user.id, { status: event.target.value })} className="min-h-10 min-w-0 w-full rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                              <option value="active">{ui.admin.active}</option>
                              <option value="pending">{ui.admin.pending}</option>
                              <option value="blocked">{ui.admin.blocked}</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {filteredUsers.length === 0 && !isUsersLoading && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {ui.admin.notFound}
                    </p>
                  </div>
                )}
                {usersTotal > 0 && <div ref={usersEndRef} className="flex min-h-12 items-center justify-center text-sm text-gray-500 dark:text-gray-400">{hasMoreUsers ? <Loader2 className="h-5 w-5 animate-spin text-amber-600" /> : `${users.length} / ${usersTotal}`}</div>}
              </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{ui.admin.ordersTab}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{ui.admin.manageOrders}</p>
                  </div>
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{recentOrders.length}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2 dark:border-gray-700 dark:bg-gray-900/60">
                  <button type="button" onClick={() => setOrderQueue('kitchen')} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold ${orderQueue === 'kitchen' ? 'bg-white text-orange-700 shadow-sm dark:bg-gray-800 dark:text-orange-300' : 'text-gray-500'}`}><ChefHat className="h-4 w-4" /> {copy.kitchen} <span className="rounded-full bg-orange-100 px-2 py-0.5 text-xs">{recentOrders.filter((order) => ['new', 'confirmed', 'cooking'].includes(order.status)).length}</span></button>
                  <button type="button" onClick={() => setOrderQueue('waiters')} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-4 text-sm font-bold ${orderQueue === 'waiters' ? 'bg-white text-blue-700 shadow-sm dark:bg-gray-800 dark:text-blue-300' : 'text-gray-500'}`}><Truck className="h-4 w-4" /> {copy.waiters} <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs">{recentOrders.filter((order) => ['ready', 'delivering'].includes(order.status)).length}</span></button>
                </div>
                {recentOrders.filter((order) => orderQueue === 'kitchen' ? ['new', 'confirmed', 'cooking'].includes(order.status) : ['ready', 'delivering'].includes(order.status)).map((order) => (
                  <div key={`queue-${order.id}`} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div><div className="flex items-center gap-2"><span className="font-black text-gray-900 dark:text-white">{order.order_number}</span><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{copy.dbOrder}</span></div><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{order.customer_name}</p></div>
                      <button type="button" onClick={() => advanceOrder(order)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#d06b3c] px-4 text-sm font-bold text-white hover:bg-[#b8532c]">{orderQueue === 'kitchen' ? (order.status === 'new' ? copy.confirm : order.status === 'confirmed' ? copy.takeOrder : copy.ready) : (order.status === 'ready' ? copy.pickup : copy.confirmDelivery)} <ArrowRight className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                      <tr><th className="px-4 py-3">№</th><th className="px-4 py-3">{ui.admin.clients}</th><th className="px-4 py-3">{copy.tableDetails}</th><th className="px-4 py-3">{ui.admin.revenue}</th><th className="px-4 py-3">{ui.admin.status}</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="bg-white dark:bg-gray-800">
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">#{order.order_number}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.customer_name}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{copy.dbOrder}</td>
                          <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">{order.total} {order.currency}</td>
                          <td className="px-4 py-3">
                            <select value={order.status} disabled={savingId === order.id} onChange={(event) => void updateOrder(order.id, event.target.value)} className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                              {['new', 'confirmed', 'cooking', 'ready', 'delivering', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{orderStatusLabels[locale][status]}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {recentOrders.length === 0 && <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">{ui.admin.noOrders}</p>}
                </div>
                {ordersTotal > 0 && (
                  <PaginationControls page={ordersPage} pageCount={ordersPageCount} onPageChange={setOrdersPage} copy={copy} />
                )}
              </div>
            )}

            {activeTab === 'products' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-xl font-semibold text-gray-900 dark:text-white">{ui.admin.productsTab}</h2><p className="text-sm text-gray-500 dark:text-gray-400">{ui.admin.manageProducts}</p></div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{products.length}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {products.map((product) => (
                    <div key={product.id} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0"><h3 className="truncate font-semibold text-gray-900 dark:text-white">{product.name}</h3><p className="text-xs text-gray-500 dark:text-gray-400">{product.category?.name || ui.admin.category}</p></div>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${product.is_available ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>{product.is_available ? ui.admin.available : ui.admin.hidden}</span>
                      </div>
                      <div className="mt-4 flex items-center gap-3">
                        <input aria-label={`Цена ${product.name}`} defaultValue={String(product.price)} onBlur={(event) => { if (event.target.value !== String(product.price)) void updateProduct(product.id, { price: event.target.value }); }} className="min-h-10 w-32 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">{product.currency}</span>
                        <button type="button" disabled={savingId === product.id} onClick={() => void updateProduct(product.id, { isAvailable: !product.is_available })} className="ml-auto min-h-10 rounded-lg bg-amber-100 px-3 text-sm font-semibold text-amber-700 transition hover:bg-amber-200 disabled:opacity-50 dark:bg-amber-900/30 dark:text-amber-300">{product.is_available ? ui.admin.hide : ui.admin.publish}</button>
                      </div>
                    </div>
                  ))}
                </div>
                {products.length === 0 && <p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">{ui.admin.noProducts}</p>}
              </div>
            )}

            {activeTab === 'reservations' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div><h2 className="text-xl font-semibold text-gray-900 dark:text-white">{copy.reservations}</h2><p className="text-sm text-gray-500 dark:text-gray-400">{copy.reservationsDescription}</p></div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">{reservations.filter((reservation) => reservation.status === 'confirmed').length} {copy.confirmed}</span>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900/60 sm:flex-row">
                  <input type="date" value={reservationDate} onChange={(event) => { setReservationDate(event.target.value); setReservationPage(1); }} className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
                  <select value={reservationStatus} onChange={(event) => { setReservationStatus(event.target.value); setReservationPage(1); }} className="min-h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white">
                    <option value="all">{copy.allStatuses}</option>
                    {['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show'].map((status) => <option key={status} value={status}>{reservationStatusLabels[locale][status]}</option>)}
                  </select>
                  {(reservationDate || reservationStatus !== 'all') && <button type="button" onClick={() => { setReservationDate(''); setReservationStatus('all'); setReservationPage(1); }} className="min-h-11 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-200">{copy.reset}</button>}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{reservationTables.map((table) => { const activeReservations = reservations.filter((reservation) => Array.isArray(reservation.table_ids) && reservation.table_ids.includes(table.id) && reservation.status !== 'cancelled'); return <div key={table.id} className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/60"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-bold text-gray-900 dark:text-white"><Table2 className="h-4 w-4 text-amber-600" />{table.name}</div><span className="text-xs text-gray-500">{copy.capacity} {table.capacity}</span></div><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{table.zone} · {activeReservations.length ? `${activeReservations.length} ${copy.request}` : copy.free}</p></div>; })}</div>
                <div className="space-y-3">{reservations.map((reservation) => <div key={reservation.id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="font-black text-gray-900 dark:text-white">{reservation.id}</span><span className="text-sm text-gray-500">{new Date(reservation.start_at).toLocaleString(locale)}</span></div><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{reservation.guest_name} · {reservation.guest_phone} · {copy.guests}: {reservation.guests_count}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => void updateReservation(reservation.id, 'confirmed')} disabled={reservation.status === 'confirmed'} className="min-h-10 rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">{copy.confirm}</button><button type="button" onClick={() => void updateReservation(reservation.id, 'cancelled')} disabled={reservation.status === 'cancelled'} className="min-h-10 rounded-lg border border-red-200 px-3 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-40">{copy.cancel}</button></div></div>)}{reservations.length === 0 && <p className="rounded-xl bg-gray-50 p-8 text-center text-sm text-gray-500 dark:bg-gray-900/50">{copy.noReservations}</p>}</div>
                {reservationTotal > 0 && <PaginationControls page={reservationPage} pageCount={reservationPageCount} onPageChange={setReservationPage} copy={copy} />}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
                <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:sticky lg:top-8">
                  <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-gray-400">{ui.admin.settings}</p>
                  <nav className="space-y-1 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    <a href="#site-identity" className="block rounded-xl bg-amber-50 px-3 py-2.5 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">{ui.admin.siteName}</a>
                    <a href="#site-contact" className="block rounded-xl px-3 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-700">{ui.admin.contactEmail}</a>
                    <a href="#site-access" className="block rounded-xl px-3 py-2.5 transition hover:bg-gray-50 dark:hover:bg-gray-700">{ui.admin.maintenance}</a>
                  </nav>
                </aside>

                <div className="min-w-0 space-y-5">
                  <section id="site-identity" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-5"><h2 className="text-xl font-bold text-gray-900 dark:text-white">{ui.admin.siteName}</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{ui.admin.logoUrl}</p></div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{ui.admin.siteName}
                        <input type="text" value={siteSettings.siteName} onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                      </label>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{ui.admin.logoUrl}
                          <input type="text" value={siteSettings.logoUrl} onChange={(e) => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                        </label>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"><Image unoptimized width={56} height={56} src={siteSettings.logoData || siteSettings.logoUrl || '/cafeflow-logo.svg'} alt={siteSettings.siteName} className="h-full w-full object-cover" /></div>
                          <label className="inline-flex min-h-10 cursor-pointer items-center rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-700">{ui.admin.logoUpload}<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (!file || file.size > 1024 * 1024) { setError(ui.admin.logoSizeError); return; } const reader = new FileReader(); reader.onload = () => setSiteSettings((current) => ({ ...current, logoData: typeof reader.result === 'string' ? reader.result : '' })); reader.readAsDataURL(file); }} /></label>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section id="site-contact" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <div className="mb-5"><h2 className="text-xl font-bold text-gray-900 dark:text-white">{ui.admin.contactEmail}</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{ui.admin.address}</p></div>
                    <div className="grid gap-5 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{ui.admin.contactPhone}<input type="tel" value={siteSettings.contactPhone} onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></label>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">{ui.admin.contactEmail}<input type="email" value={siteSettings.contactEmail} onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></label>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 md:col-span-2">{ui.admin.address}<input type="text" value={siteSettings.addressText} onChange={(e) => setSiteSettings({ ...siteSettings, addressText: e.target.value })} className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 font-normal text-gray-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white" /></label>
                    </div>
                  </section>

                  <section id="site-access" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{ui.admin.maintenance}</h2>
                    <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-gray-50 p-4 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600">
                      <input type="checkbox" checked={siteSettings.maintenanceMode} onChange={(e) => setSiteSettings({ ...siteSettings, maintenanceMode: e.target.checked })} className="h-5 w-5 rounded text-amber-600 focus:ring-amber-500" />
                      <span><span className="block text-sm font-semibold text-gray-900 dark:text-white">{ui.admin.maintenance}</span><span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{ui.admin.maintenanceDescription}</span></span>
                    </label>
                  </section>
                </div>

                <button
                  type="button"
                  onClick={() => void saveTenantSettings()}
                  disabled={savingId === 'tenant'}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 py-3 font-semibold text-white shadow-lg transition-all hover:from-amber-700 hover:to-orange-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-5 w-5" />
                  {ui.admin.save}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
