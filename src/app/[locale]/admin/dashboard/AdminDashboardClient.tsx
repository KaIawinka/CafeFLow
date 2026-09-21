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
  CreditCard,
  Database,
  Filter,
  MoreHorizontal,
  Package,
  Receipt,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  Timer,
  Utensils,
  WalletCards,
  Users,
  UserRoundCog,
  Zap,
} from 'lucide-react';
import type { Locale } from '@/app/i18n/config';
import { getLocaleTranslations } from '@/app/i18n/catalog';

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
  analytics?: AnalyticsData | null;
};

type AnalyticsData = {
  periods: { today: { revenue: number; orders: number }; week: { revenue: number; orders: number }; month: { revenue: number; orders: number } };
  averageOrderValue: number;
  guests: number;
  occupancy: number;
  dailyRevenue: Array<{ date: string; revenue: number }>;
  paymentMix: Array<{ method: string; amount: number; count: number }>;
  refunds: { amount: number; count: number };
  cancelled: number;
  foodCost: number;
  topProducts: Array<{ name: string; quantity: number; revenue: number; category: string }>;
  categorySales: Array<{ name: string; revenue: number }>;
  outsiders: Array<{ name: string; quantity: number; revenue: number; category: string }>;
  trafficHeatmap: Array<{ day: number; hour: number; guests: number }>;
  averageServiceMinutes: number;
  averageTableMinutes: number;
  staff: Array<{ id: string; role: string }>;
  customerMix: { newCustomers: number; returningCustomers: number };
  loyalty: { issued: number; spent: number; members: number };
  reviews: { average: number; count: number };
  roleDistribution: Array<{ role: string; count: number }>;
};

const roleKeys = ['admin', 'manager', 'kitchen', 'employee', 'customer', 'guest'];
const roleColors = ['#f97316', '#fb923c', '#fdba74', '#ea580c', '#c2410c', '#fed7aa'];
const chartBars = [42, 58, 49, 72, 61, 84, 76, 91, 68, 79, 88, 74];
const heatmap = [2, 1, 3, 4, 2, 5, 6, 3, 1, 2, 5, 7, 4, 3, 5, 6, 8, 5, 4, 6, 7, 8, 6, 4, 2, 3, 5, 7, 8, 6, 4, 3, 2, 4, 6, 7, 8, 6, 5, 3, 2, 4, 6, 8, 7, 5, 4, 2, 1, 3, 5, 7, 8, 6, 4, 3, 2, 4, 6, 7, 5, 3, 2, 1, 3, 5, 6, 4, 2, 1, 2, 4, 5, 3, 2, 1, 3, 4, 2, 1, 2, 3];

function formatNumber(value: number | string, locale: Locale) {
  return new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : locale === 'kg' ? 'ky-KG' : 'en-US').format(Number(value) || 0);
}

function formatCurrency(value: number | string, locale: Locale, currency = 'сом') {
  return `${formatNumber(value, locale)} ${locale === 'en' ? currency || 'KGS' : currency || 'сом'}`;
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`min-w-0 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_12px_32px_rgba(21,26,30,0.06)] ${className}`}>{children}</section>;
}

function SectionHeading({ icon: Icon, title, subtitle, action }: { icon: typeof Activity; title: string; subtitle?: string; action?: React.ReactNode }) {
  return <div className="mb-5 flex items-start justify-between gap-3"><div className="flex items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--primary)]"><Icon className="h-4 w-4" /></div><div><h2 className="text-sm font-bold text-[var(--foreground)] sm:text-base">{title}</h2>{subtitle && <p className="mt-1 text-xs text-[var(--muted-foreground)]">{subtitle}</p>}</div></div>{action}</div>;
}

type DonutSegment = { value: number; color: string };

function DonutChart({ segments, centerValue, centerLabel, size = 'h-28 w-28' }: { segments: DonutSegment[]; centerValue: string; centerLabel: string; size?: string }) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0);
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const chartSegments = segments.filter((segment) => segment.value > 0).reduce<Array<{ segment: DonutSegment; length: number; offset: number }>>((result, segment) => {
    const length = (segment.value / total) * circumference;
    const previous = result[result.length - 1];
    const offset = previous ? previous.offset + previous.length : 0;
    return [...result, { segment, length, offset }];
  }, []);

  return <div className={`relative shrink-0 rounded-full ${size}`} role="img" aria-label={`${centerValue} ${centerLabel}`}><svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="12" className="text-[var(--muted)]" />{chartSegments.map(({ segment, length, offset }, index) => { const gap = length > 8 ? 2.5 : 0; const visibleLength = Math.max(0, length - gap); return <circle key={`${segment.color}-${index}`} cx="50" cy="50" r={radius} fill="none" stroke={segment.color} strokeWidth="12" strokeLinecap="butt" strokeDasharray={`${visibleLength} ${circumference - visibleLength}`} strokeDashoffset={-offset} />; })}</svg><div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[var(--card)] text-center shadow-[0_1px_3px_rgba(21,26,30,0.08)]"><span className="text-xl font-black leading-none">{centerValue}</span><span className="mt-1 max-w-[70px] text-[10px] leading-tight text-[var(--muted-foreground)]">{centerLabel}</span></div></div>;
}

function MetricBar({ value, max, color = 'bg-orange-500' }: { value: number; max: number; color?: string }) {
  const width = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]"><div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} /></div>;
}

function percentage(value: number, total: number) {
  return total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
}

export default function AdminDashboardClient({ locale, embedded = false }: { locale: Locale; embedded?: boolean }) {
  const translations = getLocaleTranslations(locale);
  const admin = translations.admin.panel;
  const ui = { admin };
  const dashboardTranslations = translations.dashboard;
  const text = {
    ...dashboardTranslations.copy,
    roleNames: dashboardTranslations.copy.roleNames as Record<string, string>,
    orderStatuses: dashboardTranslations.copy.orderStatuses as Record<string, string>,
  };
  const labels = dashboardTranslations.analytics;
  const finance = dashboardTranslations.finance;
  const dashboardTitle = text.title;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const load = useEffectEvent(async () => {
    try {
      const response = await fetch('/api/admin/dashboard?view=dashboard&usersPage=1&ordersPage=1', { cache: 'no-store' });
      const payload = await response.json() as DashboardData & { error?: string };
      if (!response.ok) throw new Error(payload.error || admin.errorLoad);
      setData(payload);
      setError('');
    } catch {
      setError(admin.errorLoad);
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const filteredUsers = useMemo(() => {
    if (!data) return [];
    const normalizedQuery = query.trim().toLowerCase();
    return data.users.filter((user) => {
      const matchesQuery = !normalizedQuery || `${user.first_name} ${user.last_name || ''} ${user.email}`.toLowerCase().includes(normalizedQuery);
      return matchesQuery && (roleFilter === 'all' || user.role === roleFilter);
    }).slice(0, 6);
  }, [data, query, roleFilter]);

  const currency = data?.tenant?.currency || admin.currency;
  const metrics = data?.metrics || { users: 0, activeUsers: 0, admins: 0, orders: 0, revenue: 0, products: 0, activeProducts: 0 };
  const utilization = metrics.products ? Math.round((metrics.activeProducts / metrics.products) * 100) : 0;
  const orderStatuses = Object.entries(text.orderStatuses).map(([status, label]) => ({ status, label, count: data?.recentOrders.filter((order) => order.status === status).length || 0 }));
  const maxOrderCount = Math.max(1, ...orderStatuses.map((item) => item.count));
  const analytics = data?.analytics;
  const roleDistribution = analytics?.roleDistribution || [];
  const roleTotal = roleDistribution.reduce((sum, item) => sum + item.count, 0);
  const paymentTotal = analytics?.paymentMix.reduce((sum, payment) => sum + payment.amount, 0) || 0;
  const categoryTotal = analytics?.categorySales.reduce((sum, category) => sum + category.revenue, 0) || 0;
  const customerTotal = (analytics?.customerMix.newCustomers || 0) + (analytics?.customerMix.returningCustomers || 0);
  const returningCustomerPercent = percentage(analytics?.customerMix.returningCustomers || 0, customerTotal);
  const loyaltyIssued = analytics?.loyalty.issued || 0;
  const loyaltySpent = analytics?.loyalty.spent || 0;
  const redemptionPercent = percentage(loyaltySpent, loyaltyIssued);
  const reviewPercent = Math.min(100, Math.max(0, Math.round(((analytics?.reviews.average || 0) / 5) * 100)));
  const staffRoleDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const member of analytics?.staff || []) counts.set(member.role, (counts.get(member.role) || 0) + 1);
    return Array.from(counts, ([role, count]) => ({ role, count }));
  }, [analytics]);

  const kpis = [
    { label: labels.revenueToday, value: formatCurrency(data?.analytics?.periods.today.revenue || 0, locale, currency), delta: `${data?.analytics?.periods.today.orders || 0} ${labels.orders}`, icon: CircleDollarSign, tone: 'orange' },
    { label: labels.revenueWeek, value: formatCurrency(data?.analytics?.periods.week.revenue || 0, locale, currency), delta: `${data?.analytics?.periods.week.orders || 0} ${labels.orders}`, icon: BarChart3, tone: 'orange' },
    { label: labels.averageOrder, value: formatCurrency(data?.analytics?.averageOrderValue || 0, locale, currency), delta: `${data?.analytics?.periods.month.orders || 0} ${labels.orders}`, icon: Receipt, tone: 'orange' },
    { label: labels.guestsOccupancy, value: `${data?.analytics?.guests || 0} · ${data?.analytics?.occupancy || 0}%`, delta: `${metrics.users} ${labels.registered}`, icon: Users, tone: 'orange' },
  ];

  return (
    <div className={`${embedded ? '' : 'min-h-screen bg-[var(--background)] '}text-[var(--foreground)]`}>
      <main className={`${embedded ? '' : 'mx-auto max-w-[1600px] '}px-0 py-0 text-[var(--foreground)] sm:px-0 sm:py-0 lg:px-0 lg:py-0`}>
        <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{dashboardTitle}</h1>
          </div>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">{error}</div>}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map(({ label, value, delta, icon: Icon }) => <Card key={label} className="p-5"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted-foreground)]">{label}</p><p className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">{loading ? '—' : value}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300"><Icon className="h-5 w-5" /></div></div><div className="mt-4 flex items-center gap-2 text-xs"><span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400"><ArrowUpRight className="h-3.5 w-3.5" /> {delta}</span><span className="text-[var(--muted-foreground)]">{text.vsLastPeriod}</span></div></Card>)}
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <Card className="p-5 sm:p-6">
            <SectionHeading icon={WalletCards} title={finance.title} subtitle={finance.subtitle} />
            <div className="grid gap-4 sm:grid-cols-3">
              {(['today', 'week', 'month'] as const).map((period) => <div key={period} className="rounded-xl bg-[var(--muted)]/60 p-4"><p className="text-xs font-semibold uppercase text-[var(--muted-foreground)]">{labels[period]}</p><p className="mt-2 text-xl font-black">{formatCurrency(analytics?.periods[period].revenue || 0, locale, currency)}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{analytics?.periods[period].orders || 0} {labels.orders}</p></div>)}
            </div>
            <div className="mt-5 flex h-32 items-end gap-2 border-b border-[var(--border)] pb-2">{(analytics?.dailyRevenue || []).map((item) => <div key={item.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="w-full rounded-t-md bg-orange-500/80" style={{ height: `${Math.max(8, Math.min(100, (item.revenue / Math.max(1, ...((analytics?.dailyRevenue || []).map((entry) => entry.revenue)))) * 100))}%` }} /><span className="text-[10px] text-[var(--muted-foreground)]">{item.date.slice(8)}</span></div>)}</div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3"><div><p className="text-xs text-[var(--muted-foreground)]">{finance.foodCost}</p><p className="mt-1 font-bold">{formatCurrency(analytics?.foodCost || 0, locale, currency)} <span className="text-xs text-amber-500">{finance.foodCostEstimate}</span></p></div><div><p className="text-xs text-[var(--muted-foreground)]">{finance.margin}</p><p className="mt-1 font-bold text-emerald-500">{formatCurrency((analytics?.periods.month.revenue || 0) - (analytics?.foodCost || 0), locale, currency)}</p></div><div><p className="text-xs text-[var(--muted-foreground)]">{finance.refunds}</p><p className="mt-1 font-bold">{formatCurrency(analytics?.refunds.amount || 0, locale, currency)} · {analytics?.cancelled || 0}</p></div></div>
          </Card>
          <Card className="p-5 sm:p-6"><SectionHeading icon={CreditCard} title={labels.paymentMethods} /><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><DonutChart segments={(analytics?.paymentMix || []).map((payment, index) => ({ value: payment.amount, color: roleColors[index % roleColors.length] }))} centerValue={`${percentage(paymentTotal, paymentTotal)}%`} centerLabel={labels.share} /><div className="min-w-0 flex-1 space-y-3">{(analytics?.paymentMix || []).map((payment, index) => { const share = percentage(payment.amount, paymentTotal); return <div key={payment.method} className="rounded-xl bg-[var(--muted)]/60 px-3 py-2.5"><div className="flex items-center justify-between gap-3 text-sm font-semibold"><span className="flex min-w-0 items-center gap-2 truncate"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: roleColors[index % roleColors.length] }} />{payment.method}</span><strong>{share}%</strong></div><MetricBar value={payment.amount} max={paymentTotal} /><p className="mt-1 text-right text-xs text-[var(--muted-foreground)]">{formatCurrency(payment.amount, locale, currency)} · {payment.count} {labels.operations}</p></div>; })}{!analytics?.paymentMix.length && <div className="rounded-xl bg-[var(--muted)]/60 px-3 py-4"><p className="text-sm text-[var(--muted-foreground)]">{labels.noPayments}</p><p className="mt-1 text-xs font-bold">0% {labels.share}</p></div>}</div></div></Card>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
          <Card className="p-5 sm:p-6"><SectionHeading icon={Utensils} title={labels.menuAnalytics} subtitle={labels.menuSubtitle} /><div className="space-y-3">{(analytics?.topProducts || []).map((product, index) => <div key={product.name} className="flex items-center gap-3"><span className="w-5 text-xs font-black text-[var(--muted-foreground)]">{index + 1}</span><div className="min-w-0 flex-1"><div className="flex justify-between gap-3 text-sm"><span className="truncate font-semibold">{product.name}</span><strong>{formatCurrency(product.revenue, locale, currency)}</strong></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max(8, (product.revenue / Math.max(1, analytics?.topProducts[0]?.revenue || 1)) * 100)}%` }} /></div></div><span className="text-xs text-[var(--muted-foreground)]">{product.quantity} {labels.units}</span></div>)}{!analytics?.topProducts.length && <div className="flex items-center gap-4 py-5"><DonutChart segments={[]} centerValue="0%" centerLabel={labels.share} size="h-20 w-20" /><p className="text-sm text-[var(--muted-foreground)]">{labels.noSales}</p></div>}</div></Card>
          <Card className="p-5 sm:p-6"><SectionHeading icon={Package} title={labels.categorySales} /><div className="space-y-3">{(analytics?.categorySales || []).map((category, index) => { const share = percentage(category.revenue, categoryTotal); return <div key={category.name} className="rounded-xl bg-[var(--muted)]/60 px-3 py-2.5"><div className="flex items-center justify-between gap-3 text-sm"><span className="flex min-w-0 items-center gap-2 truncate"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: roleColors[index % roleColors.length] }} />{category.name}</span><strong>{share}%</strong></div><MetricBar value={category.revenue} max={categoryTotal} color="bg-emerald-500" /><p className="mt-1 text-right text-xs text-[var(--muted-foreground)]">{formatCurrency(category.revenue, locale, currency)}</p></div>; })}{!analytics?.categorySales.length && <div className="flex items-center gap-4 rounded-xl bg-[var(--muted)]/60 px-3 py-4"><DonutChart segments={[]} centerValue="0%" centerLabel={labels.share} size="h-20 w-20" /><p className="text-sm text-[var(--muted-foreground)]">{labels.noSales}</p></div>}<div className="mt-5 border-t border-[var(--border)] pt-4"><p className="text-xs font-semibold text-[var(--muted-foreground)]">{labels.menuOutsiders}</p>{(analytics?.outsiders || []).slice(0, 3).map((product) => <p key={product.name} className="mt-2 flex justify-between text-xs"><span>{product.name}</span><span>{product.quantity} {labels.units}</span></p>)}</div></div></Card>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <Card className="p-5 sm:p-6 lg:col-span-2"><SectionHeading icon={Activity} title={labels.trafficPeak} subtitle={labels.trafficSubtitle} /><div className="grid grid-cols-7 gap-1">{Array.from({ length: 7 }, (_, day) => <div key={day} className="space-y-1">{Array.from({ length: 12 }, (_, offset) => { const hour = offset + 10; const value = analytics?.trafficHeatmap.filter((point) => point.day === day && point.hour === hour).reduce((sum, point) => sum + point.guests, 0) || 0; return <div key={hour} title={`${hour}:00 · ${value} ${labels.guests}`} className={`h-5 rounded-sm ${value > 4 ? 'bg-orange-500' : value > 0 ? 'bg-orange-500/50' : 'bg-[var(--muted)]'}`} />; })}</div>)}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-[var(--muted)]/60 p-3"><Timer className="h-4 w-4 text-[var(--primary)]" /><p className="mt-2 text-xs text-[var(--muted-foreground)]">{labels.serviceAverage}</p><strong>{analytics?.averageServiceMinutes || 0} {dashboardTranslations.minutes}</strong></div><div className="rounded-xl bg-[var(--muted)]/60 p-3"><Timer className="h-4 w-4 text-[var(--primary)]" /><p className="mt-2 text-xs text-[var(--muted-foreground)]">{labels.tableTurnover}</p><strong>{analytics?.averageTableMinutes || 0} {dashboardTranslations.minutes}</strong></div></div></Card>
          <Card className="p-5 sm:p-6"><SectionHeading icon={Users} title={labels.staffPerformance} /><p className="mb-4 text-xs text-[var(--muted-foreground)]">{labels.staffSubtitle}</p><div className="flex items-start gap-4"><DonutChart segments={staffRoleDistribution.map((member, index) => ({ value: member.count, color: roleColors[index % roleColors.length] }))} centerValue={formatNumber(analytics?.staff.length || 0, locale)} centerLabel={labels.onTeam} size="h-24 w-24" /><div className="min-w-0 flex-1 space-y-2">{staffRoleDistribution.map((member, index) => { const share = percentage(member.count, analytics?.staff.length || 0); return <div key={member.role} className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-2 truncate"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: roleColors[index % roleColors.length] }} />{text.roleNames[member.role] || member.role}</span><strong>{share}%</strong></div>; })}{!staffRoleDistribution.length && <p className="text-sm text-[var(--muted-foreground)]">{labels.noStaff}</p>}</div></div>{!staffRoleDistribution.length && <p className="mt-4 text-xs text-[var(--muted-foreground)]">{labels.noTeamData}</p>}</Card>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <Card className="p-5 sm:p-6"><SectionHeading icon={Users} title={labels.customerAnalytics} /><div className="flex items-start gap-4"><DonutChart segments={[{ value: analytics?.customerMix.newCustomers || 0, color: '#f97316' }, { value: analytics?.customerMix.returningCustomers || 0, color: '#fb923c' }]} centerValue={`${returningCustomerPercent}%`} centerLabel={labels.returningCustomers} size="h-24 w-24" /><div className="min-w-0 flex-1 space-y-4"><div><div className="mb-1 flex items-center justify-between gap-2 text-xs"><span className="flex items-center gap-2 font-semibold"><span className="h-2 w-2 shrink-0 rounded-full bg-orange-500" />{labels.newCustomers}</span><strong>{percentage(analytics?.customerMix.newCustomers || 0, customerTotal)}%</strong></div><MetricBar value={analytics?.customerMix.newCustomers || 0} max={customerTotal} color="bg-orange-500" /><p className="mt-1 text-right text-xs text-[var(--muted-foreground)]">{analytics?.customerMix.newCustomers || 0}</p></div><div><div className="mb-1 flex items-center justify-between gap-2 text-xs"><span className="flex items-center gap-2 font-semibold"><span className="h-2 w-2 shrink-0 rounded-full bg-orange-400" />{labels.returningCustomers}</span><strong>{returningCustomerPercent}%</strong></div><MetricBar value={analytics?.customerMix.returningCustomers || 0} max={customerTotal} color="bg-orange-400" /><p className="mt-1 text-right text-xs text-[var(--muted-foreground)]">{analytics?.customerMix.returningCustomers || 0}</p></div></div></div></Card>
          <Card className="p-5 sm:p-6"><SectionHeading icon={Sparkles} title={labels.loyalty} /><div className="flex items-start gap-4"><DonutChart segments={[{ value: loyaltySpent, color: '#ea580c' }, { value: Math.max(0, loyaltyIssued - loyaltySpent), color: '#fed7aa' }]} centerValue={`${redemptionPercent}%`} centerLabel={labels.redemption} size="h-24 w-24" /><div className="min-w-0 flex-1 space-y-3 text-sm"><div className="flex justify-between gap-3"><span>{labels.members}</span><strong>{analytics?.loyalty.members || 0}</strong></div><div className="flex justify-between gap-3"><span>{labels.issued}</span><strong>{formatNumber(loyaltyIssued, locale)}</strong></div><div className="flex justify-between gap-3"><span>{labels.spent}</span><strong>{formatNumber(loyaltySpent, locale)}</strong></div><MetricBar value={Math.min(loyaltySpent, loyaltyIssued)} max={loyaltyIssued} color="bg-orange-600" /></div></div></Card>
          <Card className="p-5 sm:p-6"><SectionHeading icon={Star} title={labels.reviews} /><div className="flex items-center gap-4"><DonutChart segments={[{ value: analytics?.reviews.average || 0, color: '#fbbf24' }, { value: Math.max(0, 5 - (analytics?.reviews.average || 0)), color: '#fef3c7' }]} centerValue={`${reviewPercent}%`} centerLabel={labels.rating} size="h-24 w-24" /><div className="min-w-0"><div className="flex items-center gap-2"><Star className="h-7 w-7 fill-amber-400 text-amber-400" /><p className="text-3xl font-black">{(analytics?.reviews.average || 0).toFixed(1)}</p><span className="text-xs text-[var(--muted-foreground)]">/ 5</span></div><p className="mt-1 text-xs text-[var(--muted-foreground)]">{analytics?.reviews.count || 0} {labels.publishedReviews}</p></div></div></Card>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.8fr)]">
          <Card className="p-5 sm:p-6">
            <SectionHeading icon={BarChart3} title={text.visitors} subtitle={text.lastSevenDays} action={<button type="button" className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)]"><MoreHorizontal className="h-5 w-5" /></button>} />
            <div className="flex items-end justify-between gap-3 border-b border-[var(--border)] pb-2 pt-5 sm:gap-5"><div className="text-3xl font-black">{formatNumber(metrics.activeUsers * 14 + metrics.orders * 3, locale)}<span className="ml-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">+18.4%</span></div><div className="hidden text-right text-xs text-[var(--muted-foreground)] sm:block">{text.ordersTrend}<br /><span className="font-bold text-[var(--foreground)]">{formatNumber(metrics.orders, locale)} {dashboardTranslations.total}</span></div></div>
            <div className="mt-6 grid h-48 grid-cols-12 items-end gap-1.5 sm:gap-3">{chartBars.map((height, index) => <div key={`${height}-${index}`} className="group flex h-full flex-col items-center justify-end gap-2"><div className="relative h-full w-full max-w-8 rounded-t-md bg-orange-500/20 transition group-hover:bg-orange-500/35 dark:bg-orange-400/15"><div className="absolute bottom-0 w-full rounded-t-md bg-gradient-to-t from-orange-600 to-orange-400 transition-all group-hover:from-orange-500" style={{ height: `${height}%` }} /></div><span className="text-[10px] text-[var(--muted-foreground)]">{dashboardTranslations.weekdays[index]}</span></div>)}</div>
          </Card>

          <Card className="p-5 sm:p-6">
            <SectionHeading icon={Activity} title={text.systemStatus} subtitle={text.allSystems} />
            <div className="mb-6 flex items-center gap-4"><div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#10b981 0deg 356deg, var(--muted) 356deg 360deg)' }}><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--card)] text-xl font-black">99<span className="text-xs">%</span></div></div><div><p className="text-2xl font-black">{labels.healthy}</p><p className="mt-1 text-xs text-[var(--muted-foreground)]">{text.online} · 99.98% {labels.uptime}</p></div></div>
            <div className="space-y-3">{[{ label: text.api, value: '42 ms', icon: Zap }, { label: text.database, value: '18 ms', icon: Database }, { label: text.notifications, value: `0 ${dashboardTranslations.queued}`, icon: Bell }].map(({ label, value, icon: Icon }) => <div key={label} className="flex items-center justify-between rounded-xl bg-[var(--muted)]/60 px-3 py-2.5"><span className="flex items-center gap-2 text-sm font-semibold"><Icon className="h-4 w-4 text-[var(--primary)]" />{label}</span><span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{value}</span></div>)}</div>
          </Card>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <Card className="p-5 sm:p-6 lg:col-span-2"><SectionHeading icon={Activity} title={text.trafficByHour} subtitle={text.visitors} /><div className="grid grid-cols-12 items-end gap-2 border-b border-[var(--border)] pb-4 pt-5">{[38, 45, 52, 44, 62, 78, 89, 72, 64, 56, 41, 34].map((height, index) => <div key={index} className="group flex flex-col items-center gap-2"><div className="w-full rounded-t-md bg-[var(--secondary)]" style={{ height: `${height * 1.45}px` }}><div className="h-full w-full rounded-t-md bg-[var(--primary)] opacity-80 transition group-hover:opacity-100" style={{ clipPath: `polygon(0 100%, 0 28%, 40% ${index % 2 ? 18 : 35}%, 72% ${index % 3 ? 10 : 25}%, 100% 0, 100% 100%)` }} /></div><span className="text-[10px] text-[var(--muted-foreground)]">{index + 8}:00</span></div>)}</div></Card>
            <Card className="p-5 sm:p-6"><SectionHeading icon={Users} title={text.userRoles} /><div className="flex items-center gap-5"><DonutChart segments={roleDistribution.map(({ count }, index) => ({ value: count, color: roleColors[index % roleColors.length] }))} centerValue={formatNumber(roleTotal, locale)} centerLabel={labels.users} size="h-32 w-32" /><div className="min-w-0 flex-1 space-y-2">{roleDistribution.slice(0, 5).map(({ role, count }, index) => <div key={role} className="flex items-center justify-between gap-2 text-xs"><span className="flex min-w-0 items-center gap-2 truncate"><span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: roleColors[index % roleColors.length] }} />{text.roleNames[role] || role}</span><strong>{percentage(count, roleTotal)}%</strong></div>)}</div></div></Card>
        </div>

        <div className="mb-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
          <Card className="p-5 sm:p-6"><SectionHeading icon={Users} title={text.recentUsers} action={<Link href={`/${locale}/admin`} className="text-xs font-bold text-[var(--primary)] hover:underline">{text.viewAll}</Link>} /><div className="mb-4 flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={text.searchUsers} className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-3 text-sm text-[var(--foreground)] outline-none transition focus:border-[var(--primary)]" /></div><div className="relative"><Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-foreground)]" /><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="h-10 w-full appearance-none rounded-xl border border-[var(--border)] bg-[var(--background)] pl-9 pr-8 text-sm text-[var(--foreground)] outline-none focus:border-[var(--primary)]"><option value="all">{text.allRoles}</option>{roleKeys.map((role) => <option key={role} value={role}>{text.roleNames[role]}</option>)}</select></div></div><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-[0.12em] text-[var(--muted-foreground)]"><th className="pb-3 font-semibold">{ui.admin.user}</th><th className="pb-3 font-semibold">{ui.admin.role}</th><th className="pb-3 font-semibold">{ui.admin.status}</th><th className="pb-3 text-right font-semibold">{ui.admin.registered}</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{filteredUsers.map((user) => <tr key={user.id} className="group"><td className="py-3"><div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-xs font-bold text-white">{user.first_name?.[0]?.toUpperCase()}</div><div><p className="font-semibold">{user.first_name} {user.last_name}</p><p className="text-xs text-[var(--muted-foreground)]">{user.email}</p></div></div></td><td className="py-3"><span className="rounded-full bg-[var(--secondary)] px-2 py-1 text-xs font-semibold text-[var(--secondary-foreground)]">{text.roleNames[user.role] || user.role}</span></td><td className="py-3"><span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{user.status === 'active' ? ui.admin.active : ui.admin.blocked}</span></td><td className="py-3 text-right text-xs text-[var(--muted-foreground)]">{new Date(user.created_at).toLocaleDateString(locale)}</td></tr>)}</tbody></table>{!loading && filteredUsers.length === 0 && <p className="py-8 text-center text-sm text-[var(--muted-foreground)]">{text.noData}</p>}</div></Card>
          <div className="space-y-6"><Card className="p-5 sm:p-6"><SectionHeading icon={SlidersHorizontal} title={text.quickActions} /><div className="space-y-2">{[{ href: `/${locale}/admin`, icon: UserRoundCog, label: text.manageUsers }, { href: `/${locale}/admin?tab=settings`, icon: Settings, label: text.siteSettings }, { href: `/${locale}/admin`, icon: ShieldCheck, label: text.moderation }].map(({ href, icon: Icon, label }) => <Link key={label} href={href} className="group flex items-center justify-between rounded-xl border border-[var(--border)] px-3 py-3 transition hover:border-[var(--primary)] hover:bg-[var(--secondary)]"><span className="flex items-center gap-3 text-sm font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--primary)]"><Icon className="h-4 w-4" /></span>{label}</span><ChevronRight className="h-4 w-4 text-[var(--muted-foreground)] transition group-hover:translate-x-1" /></Link>)}</div></Card><Card className="p-5 sm:p-6"><SectionHeading icon={Package} title={text.menuAvailability} /><div className="mb-3 flex items-end justify-between"><span className="text-3xl font-black">{utilization}%</span><span className="text-xs text-[var(--muted-foreground)]">{metrics.activeProducts}/{metrics.products} {text.online.toLowerCase()}</span></div><div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${utilization}%` }} /></div><div className="mt-5 flex items-center justify-between text-xs"><span className="flex items-center gap-2 text-[var(--muted-foreground)]"><Database className="h-4 w-4" />{text.storage}</span><strong>{Math.max(12, utilization - 7)}% {text.used}</strong></div></Card></div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <Card className="p-5 sm:p-6"><SectionHeading icon={ShoppingBag} title={text.recentOrders} /><div className="space-y-3">{data?.recentOrders.slice(0, 5).map((order) => <div key={order.id} className="flex items-center justify-between gap-3 rounded-xl bg-[var(--muted)]/50 px-3 py-3"><div className="flex min-w-0 items-center gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300"><ShoppingBag className="h-4 w-4" /></div><div className="min-w-0"><p className="truncate text-sm font-bold">#{order.order_number}</p><p className="truncate text-xs text-[var(--muted-foreground)]">{order.customer_name}</p></div></div><div className="text-right"><p className="text-sm font-bold">{formatCurrency(order.total, locale, order.currency)}</p><p className="mt-1 text-[10px] font-semibold text-[var(--primary)]">{text.orderStatuses[order.status] || order.status}</p></div></div>)}{!data?.recentOrders.length && <p className="py-6 text-center text-sm text-[var(--muted-foreground)]">{text.noData}</p>}</div></Card>
          <Card className="p-5 sm:p-6"><SectionHeading icon={Sparkles} title={text.ordersTrend} subtitle={text.lastSevenDays} /><div className="space-y-2">{orderStatuses.filter((item) => item.count > 0 || item.status !== 'cancelled').map((item) => <div key={item.status} className="flex items-center gap-3 text-xs"><span className="w-24 truncate text-[var(--muted-foreground)]">{item.label}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--muted)]"><div className="h-full rounded-full bg-orange-500" style={{ width: `${Math.max(4, (item.count / maxOrderCount) * 100)}%` }} /></div><strong className="w-6 text-right">{item.count}</strong></div>)}</div><div className="mt-6 border-t border-[var(--border)] pt-5"><div className="mb-3 flex items-center justify-between text-xs"><span className="font-semibold text-[var(--muted-foreground)]">{text.trafficByHour}</span><span className="font-bold text-emerald-600 dark:text-emerald-400">+24%</span></div><div className="grid grid-cols-24 h-12 grid-flow-col items-end gap-1">{heatmap.slice(0, 24).map((value, index) => <div key={index} className="rounded-sm bg-orange-500" style={{ height: `${Math.max(18, value * 10)}%`, opacity: `${0.25 + value / 12}` }} />)}</div></div></Card>
        </div>
      </main>
    </div>
  );
}
