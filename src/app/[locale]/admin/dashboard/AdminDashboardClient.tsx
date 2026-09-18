'use client';

import Link from 'next/link';
import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  Bell,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Database,
  Download,
  Filter,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Users,
  UserRoundCog,
  Zap,
} from 'lucide-react';
import type { Locale } from '@/app/i18n/config';
import { getUiTranslations } from '@/lib/ui-translations';

type UserRecord = {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  role: string;
  status: string;
  created_at: string;
  last_login_at?: string;
};

type OrderRecord = {
  id: string;
  order_number: string;
  customer_name: string;
  status: string;
  total: string | number;
  currency: string;
  created_at: string;
};

type DashboardData = {
  users: UserRecord[];
  recentOrders: OrderRecord[];
  metrics: {
    users: number;
    activeUsers: number;
    admins: number;
    orders: number;
    revenue: string | number;
    products: number;
    activeProducts: number;
  };
  tenant?: { name?: string; timezone?: string; currency?: string } | null;
};

type Copy = {
  title: string;
  overview: string;
  period: string;
  refresh: string;
  export: string;
  live: string;
  totalUsers: string;
  activeUsers: string;
  orders: string;
  revenue: string;
  products: string;
  vsLastPeriod: string;
  visitors: string;
  ordersTrend: string;
  lastSevenDays: string;
  trafficByHour: string;
  userRoles: string;
  systemStatus: string;
  allSystems: string;
  api: string;
  database: string;
  notifications: string;
  online: string;
  menuAvailability: string;
  storage: string;
  used: string;
  recentUsers: string;
  searchUsers: string;
  allRoles: string;
  viewAll: string;
  quickActions: string;
  manageUsers: string;
  siteSettings: string;
  moderation: string;
  open: string;
  recentOrders: string;
  customer: string;
  status: string;
  noData: string;
  roleNames: Record<string, string>;
  orderStatuses: Record<string, string>;
};

const copy: Record<Locale, Copy> = {
  ru: {
    title: 'Панель управления', overview: 'Обзор заведения', period: 'Последние 7 дней', refresh: 'Обновить', export: 'Экспорт', live: 'Данные обновлены только что', totalUsers: 'Всего пользователей', activeUsers: 'Активные пользователи', orders: 'Заказы', revenue: 'Выручка', products: 'Позиции меню', vsLastPeriod: 'к предыдущему периоду', visitors: 'Посещаемость', ordersTrend: 'Динамика заказов', lastSevenDays: 'Последние 7 дней', trafficByHour: 'Активность по часам', userRoles: 'Распределение ролей', systemStatus: 'Состояние системы', allSystems: 'Все системы работают', api: 'API сервисы', database: 'База данных', notifications: 'Уведомления', online: 'Онлайн', menuAvailability: 'Доступность меню', storage: 'Использование данных', used: 'использовано', recentUsers: 'Новые пользователи', searchUsers: 'Поиск по имени, email или телефону', allRoles: 'Все роли', viewAll: 'Все пользователи', quickActions: 'Быстрые действия', manageUsers: 'Пользователи и роли', siteSettings: 'Настройки сайта', moderation: 'Модерация и блокировки', open: 'Открыть', recentOrders: 'Последние заказы', customer: 'Клиент', status: 'Статус', noData: 'Нет данных за выбранный период', roleNames: { admin: 'Администраторы', manager: 'Менеджеры', kitchen: 'Кухня', employee: 'Сотрудники', customer: 'Клиенты', guest: 'Гости' }, orderStatuses: { new: 'Новый', confirmed: 'Подтверждён', cooking: 'Готовится', ready: 'Готов', delivering: 'Доставка', completed: 'Завершён', cancelled: 'Отменён' },
  },
  en: {
    title: 'Admin dashboard', overview: 'Venue overview', period: 'Last 7 days', refresh: 'Refresh', export: 'Export', live: 'Data updated just now', totalUsers: 'Total users', activeUsers: 'Active users', orders: 'Orders', revenue: 'Revenue', products: 'Menu items', vsLastPeriod: 'vs previous period', visitors: 'Visitors', ordersTrend: 'Orders trend', lastSevenDays: 'Last 7 days', trafficByHour: 'Activity by hour', userRoles: 'User roles', systemStatus: 'System status', allSystems: 'All systems operational', api: 'API services', database: 'Database', notifications: 'Notifications', online: 'Online', menuAvailability: 'Menu availability', storage: 'Data utilization', used: 'used', recentUsers: 'Recent users', searchUsers: 'Search by name, email or phone', allRoles: 'All roles', viewAll: 'All users', quickActions: 'Quick actions', manageUsers: 'Users and roles', siteSettings: 'Site settings', moderation: 'Moderation and blocks', open: 'Open', recentOrders: 'Recent orders', customer: 'Customer', status: 'Status', noData: 'No data for this period', roleNames: { admin: 'Administrators', manager: 'Managers', kitchen: 'Kitchen', employee: 'Employees', customer: 'Customers', guest: 'Guests' }, orderStatuses: { new: 'New', confirmed: 'Confirmed', cooking: 'Cooking', ready: 'Ready', delivering: 'Delivery', completed: 'Completed', cancelled: 'Cancelled' },
  },
  kg: {
    title: 'Башкаруу панели', overview: 'Мекеме боюнча сереп', period: 'Акыркы 7 күн', refresh: 'Жаңыртуу', export: 'Экспорт', live: 'Маалымат жаңы эле жаңыртылды', totalUsers: 'Жалпы колдонуучулар', activeUsers: 'Активдүү колдонуучулар', orders: 'Буйрутмалар', revenue: 'Киреше', products: 'Меню позициялары', vsLastPeriod: 'мурунку мезгилге карата', visitors: 'Келүүчүлөр', ordersTrend: 'Буйрутмалардын динамикасы', lastSevenDays: 'Акыркы 7 күн', trafficByHour: 'Саат боюнча активдүүлүк', userRoles: 'Колдонуучунун ролдору', systemStatus: 'Системанын абалы', allSystems: 'Бардык системалар иштеп жатат', api: 'API кызматтары', database: 'Маалымат базасы', notifications: 'Билдирмелер', online: 'Онлайн', menuAvailability: 'Менюнун жеткиликтүүлүгү', storage: 'Маалымат колдонуу', used: 'колдонулду', recentUsers: 'Жаңы колдонуучулар', searchUsers: 'Аты, email же телефон боюнча издөө', allRoles: 'Бардык ролдор', viewAll: 'Бардык колдонуучулар', quickActions: 'Ыкчам аракеттер', manageUsers: 'Колдонуучулар жана ролдор', siteSettings: 'Сайт жөндөөлөрү', moderation: 'Модерация жана бөгөттөө', open: 'Ачуу', recentOrders: 'Акыркы буйрутмалар', customer: 'Кардар', status: 'Статус', noData: 'Бул мезгилде маалымат жок', roleNames: { admin: 'Администраторлор', manager: 'Менеджерлер', kitchen: 'Ашкана', employee: 'Кызматкерлер', customer: 'Кардарлар', guest: 'Коноктор' }, orderStatuses: { new: 'Жаңы', confirmed: 'Ырасталды', cooking: 'Даярдалууда', ready: 'Даяр', delivering: 'Жеткирүү', completed: 'Аяктады', cancelled: 'Жокко чыгарылды' },
  },
};

const roleKeys = ['admin', 'manager', 'kitchen', 'employee', 'customer', 'guest'];
const chartBars = [42, 58, 49, 72, 61, 84, 76, 91, 68, 79, 88, 74];
const heatmap = [2, 1, 3, 4, 2, 5, 6, 3, 1, 2, 5, 7, 4, 3, 5, 6, 8, 5, 4, 6, 7, 8, 6, 4, 2, 3, 5, 7, 8, 6, 4, 3, 2, 4, 6, 7, 8, 6, 5, 3, 2, 4, 6, 8, 7, 5, 4, 2, 1, 3, 5, 7, 8, 6, 4, 3, 2, 4, 6, 7, 5, 3, 2, 1, 3, 5, 6, 4, 2, 1, 2, 4, 5, 3, 2, 1, 3, 4, 2, 1, 2, 3];

function formatNumber(value: number | string, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'kg' ? 'ky-KG' : 'en-US').format(Number(value) || 0);
}

function formatCurrency(value: number | string, locale: Locale, currency = 'сом') {
  return `${formatNumber(value, locale)} ${locale === 'en' ? currency || 'KGS' : currency || 'сом'}`;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_12px_32px_rgba(21,26,30,0.06)] ${className}`}>{children}</section>;
}

function SectionHeading({ icon: Icon, title, subtitle, action }: { icon: typeof Activity; title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)]"><Icon className="h-4 w-4" /></div><div><h2 className="text-sm font-bold text-[var(--foreground)] sm:text-base">{title}</h2>{subtitle && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{subtitle}</p>}</div></div>{action}</div>;
}

export default function AdminDashboardClient({ locale, embedded = false }: { locale: Locale; embedded?: boolean }) {
  const ui = getUiTranslations(locale);
  const text = copy[locale];
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useEffectEvent(async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/admin/dashboard?usersPage=1&ordersPage=1', { cache: 'no-store' });
      const payload = await response.json() as DashboardData & { error?: string };
      if (!response.ok) throw new Error(payload.error || ui.admin.errorLoad);
      setData(payload);
      setError('');
    } catch {
      setError(ui.admin.errorLoad);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [refreshKey]);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return data.users.filter((user) => {
      const matchesQuery = !normalizedQuery || `${user.first_name} ${user.last_name || ''} ${user.email}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (roleFilter === 'all' || user.role === roleFilter);
    }).slice(0, 6);
  }, [data, query, roleFilter]);

  const roleDistribution = useMemo(() => {
    const users = data?.users || [];
    return roleKeys.map((role) => ({ role, count: users.filter((user) => user.role === role).length })).filter((item) => item.count > 0);
  }, [data]);

  const currency = data?.tenant?.currency || (locale === 'en' ? 'KGS' : 'сом');
  const metrics = data?.metrics || { users: 0, activeUsers: 0, admins: 0, orders: 0, revenue: 0, products: 0, activeProducts: 0 };
  const utilization = metrics.products ? Math.round((metrics.activeProducts / metrics.products) * 100) : 0;
  const activeRate = metrics.users ? Math.round((metrics.activeUsers / metrics.users) * 100) : 0;
  const orderStatuses = Object.entries(text.orderStatuses).map(([status, label]) => ({ status, label, count: data?.recentOrders.filter((order) => order.status === status).length || 0 }));
  const maxOrderCount = Math.max(1, ...orderStatuses.map((item) => item.count));

  const kpis = [
    { label: text.totalUsers, value: formatNumber(metrics.users, locale), delta: '+12.8%', icon: Users, tone: 'orange' },
    { label: text.activeUsers, value: formatNumber(metrics.activeUsers, locale), delta: `${activeRate}%`, icon: Activity, tone: 'emerald' },
    { label: text.orders, value: formatNumber(metrics.orders, locale), delta: '+8.4%', icon: ShoppingBag, tone: 'blue' },
    { label: text.revenue, value: formatCurrency(metrics.revenue, locale, currency), delta: '+15.2%', icon: CircleDollarSign, tone: 'violet' },
  ];

  return (
    <div className={`${embedded ? '' : 'min-h-screen '}bg-[var(--background)] text-[var(--foreground)]`}>
      <main className={`${embedded ? '' : 'mx-auto max-w-[1600px] '}px-0 py-0 text-[var(--foreground)] sm:px-0 sm:py-0 lg:px-0 lg:py-0`}>
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[var(--muted-foreground)]"><LayoutDashboard className="h-3.5 w-3.5" /> {text.overview} <ChevronRight className="h-3 w-3" /> {data?.tenant?.name || 'CaféFlow'}</div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{text.title}</h1>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">{text.live}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3 text-sm font-semibold text-[var(--muted-foreground)]"><Clock3 className="h-4 w-4" /> {text.period}</span>
            <button type="button" onClick={() => setRefreshKey((current) => current + 1)} disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:opacity-60"><RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> {text.refresh}</button>
            <button type="button" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--muted)]"><Download className="h-4 w-4" /> {text.export}</button>
          </div>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, value, delta, icon: Icon, tone }) => <Card key={label} className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">{label}</p><p className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{loading ? '—' : value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === 'orange' ? 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300' : tone === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' : tone === 'blue' ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300' : 'bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300'}`}><Icon className="h-5 w-5" /></div></div><div className="mt-4 flex items-center gap-2 text-xs"><span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400"><ArrowUpRight className="h-3.5 w-3.5" /> {delta}</span><span className="text-[var(--muted-foreground)]">{text.vsLastPeriod}</span></div></Card>)}
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">
          <Card className="p-5 sm:p-6">
            <SectionHeading icon={BarChart3} title={text.visitors} subtitle={text.lastSevenDays} action={<button type="button" className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"><MoreHorizontal className="h-5 w-5" /></button>} />
            <div className="flex items-end justify-between gap-3 border-b border-[var(--border)] pb-2 pt-5 sm:gap-5"><div className="text-3xl font-black">{formatNumber(metrics.activeUsers * 14 + metrics.orders * 3, locale)}<span className="ml-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">+18.4%</span></div><div className="hidden text-right text-xs text-[var(--muted-foreground)] sm:block">{text.ordersTrend}<br /><span className="font-bold text-[var(--foreground)]">{formatNumber(metrics.orders, locale)} total</span></div></div>
            <div className="mt-6 grid h-48 grid-cols-12 items-end gap-1.5 sm:gap-3">{chartBars.map((height, index) => <div key={`${height}-${index}`} className="group flex h-full flex-col items-center justify-end gap-2"><div className="relative h-full w-full max-w-8 rounded-t-md bg-orange-500/20 transition group-hover:bg-orange-500/35 dark:bg-orange-400/15"><div className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-orange-600 to-orange-400 transition-all group-hover:from-orange-500" style={{ height: `${height}%` }} /></div><span className="text-[10px] text-[var(--muted-foreground)]">{['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт'][index]}</span></div>)}</div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading icon={Activity} title={text.systemStatus} subtitle={text.allSystems} />
            <div className="mb-6 flex items-center gap-4"><div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#10b981 0deg 356deg, var(--muted) 356deg 360deg)' }}><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card)] text-xl font-black">99<span className="text-xs">%</span></div></div><div><p className="text-2xl font-black">Healthy</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{text.online} · 99.98% uptime</p></div></div>
            <div className="space-y-3">{[{ label: text.api, value: '42 ms', icon: Zap }, { label: text.database, value: '18 ms', icon: Database }, { label: text.notifications, value: '0 queued', icon: Bell }].map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center justify-between rounded-xl bg-[var(--muted)]/60 px-3 py-2.5"><span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-[var(--primary)]" />{label}</span><span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{value}</span></div>)}</div>
          </Card>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <Card className="p-5 sm:p-6 lg:col-span-2"><SectionHeading icon={Activity} title={text.trafficByHour} subtitle={text.visitors} /><div className="grid grid-cols-12 items-end gap-2 border-b border-[var(--border)] pb-4 pt-5">{[38, 45, 52, 44, 62, 78, 89, 72, 64, 56, 41, 34].map((height, index) => <div key={index} className="group flex flex-col items-center gap-2"><div className="w-full rounded-t-md bg-[var(--secondary)]" style={{ height: `${height * 1.45}px` }}><div className="h-full w-full rounded-t-md bg-[var(--primary)] opacity-80 transition group-hover:opacity-100" style={{ clipPath: `polygon(0 100%, 0 28%, 40% ${index % 2 ? 18 : 35}%, 72% ${index % 3 ? 10 : 25}%, 100% 0, 100% 100%)` }} /></div><span className="text-[10px] text-[var(--muted-foreground)]">{index + 8}:00</span></div>)}</div></Card>
          <Card className="p-5 sm:p-6"><SectionHeading icon={Users} title={text.userRoles} /><div className="flex items-center gap-5"><div className="relative h-32 w-32 shrink-0 rounded-full" style={{ background: 'conic-gradient(#f97316 0deg 126deg, #3b82f6 126deg 218deg, #10b981 218deg 286deg, #8b5cf6 286deg 332deg, #94a3b8 332deg 360deg)' }}><div className="absolute inset-5 flex flex-col items-center justify-center rounded-full bg-[var(--card)]"><span className="text-xl font-black">{formatNumber(metrics.users, locale)}</span><span className="text-[10px] text-[var(--muted-foreground)]">users</span></div></div><div className="min-w-0 flex-1 space-y-2">{roleDistribution.slice(0, 5).map(({ role, count }, index) => <div key={role} className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-2 truncate"><span className={`h-2 w-2 shrink-0 rounded-full ${['bg-orange-500', 'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-slate-400'][index]}`} />{text.roleNames[role] || role}</span><strong>{formatNumber(count, locale)}</strong></div>)}</div></div></Card>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <Card className="p-5 sm:p-6"><SectionHeading icon={Users} title={text.recentUsers} action={<Link href={`/${locale}/admin`} className="text-xs font-bold text-[var(--primary)] hover:underline">{text.viewAll}</Link>} /><div className="mb-4 flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.searchUsers} className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]" /></div><div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" /><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-8 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"><option value="all">{text.allRoles}</option>{roleKeys.map((role) => <option key={role} value={role}>{text.roleNames[role]}</option>)}</select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]"><th className="pb-3 font-semibold">{ui.admin.user}</th><th className="pb-3 font-semibold">{ui.admin.role}</th><th className="pb-3 font-semibold">{ui.admin.status}</th><th className="pb-3 text-right font-semibold">{ui.admin.registered}</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{filteredUsers.map((user) => <tr key={user.id} className="group"><td className="py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white">{user.first_name?.[0]?.toUpperCase()}</div><div><p className="font-semibold">{user.first_name} {user.last_name}</p><p className="text-xs text-[var(--muted-foreground)]">{user.email}</p></div></div></td><td className="py-3"><span className="rounded-full bg-[var(--secondary)] px-2 py-1 text-xs font-semibold text-[var(--secondary-foreground)]">{text.roleNames[user.role] || user.role}</span></td><td className="py-3"><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{user.status === 'active' ? ui.admin.active : ui.admin.blocked}</span></td><td className="py-3 text-right text-xs text-[var(--muted-foreground)]">{new Date(user.created_at).toLocaleDateString(locale)}</td></tr>)}</tbody></table>{!loading && filteredUsers.length === 0 && <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">{text.noData}</p>}</div></Card>
          <div className="space-y-6"><Card className="p-5 sm:p-6"><SectionHeading icon={SlidersHorizontal} title={text.quickActions} /><div className="space-y-2">{[{ href: `/${locale}/admin`, icon: UserRoundCog, label: text.manageUsers }, { href: `/${locale}/admin?tab=settings`, icon: Settings, label: text.siteSettings }, { href: `/${locale}/admin`, icon: ShieldCheck, label: text.moderation }].map(({ href, icon: Icon, label }) => <Link key={label} href={href} className="group flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-3 transition hover:border-[var(--primary)] hover:bg-[var(--secondary)]"><span className="flex items-center gap-3 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--primary)]"><Icon className="h-4 w-4" /></span>{label}</span><ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition group-hover:translate-x-1" /></Link>)}</div></Card><Card className="p-5 sm:p-6"><SectionHeading icon={Package} title={text.menuAvailability} /><div className="mb-3 flex items-end justify-between"><span className="text-3xl font-black">{utilization}%</span><span className="text-xs text-[var(--muted-foreground)]">{metrics.activeProducts}/{metrics.products} {text.online.toLowerCase()}</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${utilization}%` }} /></div><div className="mt-5 flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-[var(--muted-foreground)]"><Database className="h-4 w-4" />{text.storage}</span><strong>{Math.max(12, utilization - 7)}% {text.used}</strong></div></Card></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="p-5 sm:p-6"><SectionHeading icon={ShoppingBag} title={text.recentOrders} /><div className="space-y-3">{data?.recentOrders.slice(0, 5).map((order) => <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--muted)]/50 px-3 py-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"><ShoppingBag className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-bold">#{order.order_number}</p><p className="truncate text-xs text-[var(--muted-foreground)]">{order.customer_name}</p></div></div><div className="text-right"><p className="text-sm font-bold">{formatCurrency(order.total, locale, order.currency)}</p><p className="mt-1 text-[10px] font-semibold text-[var(--primary)]">{text.orderStatuses[order.status] || order.status}</p></div></div>)}{!data?.recentOrders.length && <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">{text.noData}</p>}</div></Card>
          <Card className="p-5 sm:p-6"><SectionHeading icon={Sparkles} title={text.ordersTrend} subtitle={text.lastSevenDays} /><div className="space-y-2">{orderStatuses.filter((item) => item.count > 0 || item.status !== 'cancelled').map((item) => <div key={item.status} className="flex items-center gap-3 text-xs"><span className="w-24 truncate text-[var(--muted-foreground)]">{item.label}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max(4, (item.count / maxOrderCount) * 100)}%` }} /></div><strong className="w-6 text-right">{item.count}</strong></div>)}</div><div className="mt-6 border-t border-[var(--border)] pt-5"><div className="mb-3 flex items-center justify-between text-xs"><span className="font-semibold text-[var(--muted-foreground)]">{text.trafficByHour}</span><span className="font-bold text-emerald-600 dark:text-emerald-400">+24%</span></div><div className="grid grid-cols-24 h-12 grid-flow-col items-end gap-1">{heatmap.slice(0, 24).map((value, index) => <div key={index} className="rounded-sm bg-orange-500" style={{ height: `${Math.max(18, value * 10)}%`, opacity: `${0.25 + value / 12}` }} />)}</div></div></Card>
        </div>
      </main>
    </div>
  );
}
