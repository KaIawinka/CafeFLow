'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Users,
  Settings as SettingsIcon,
  BarChart3,
  Loader2,
  Search,
  Filter,
  Crown,
  CheckCircle,
  Save,
  RefreshCw,
  ShoppingCart,
  Package,
} from 'lucide-react';
import { locales, type Locale } from '@/app/i18n/config';
import { getUiTranslations } from '@/lib/ui-translations';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name?: string;
  role: string;
  status: string;
  created_at: string;
  last_login_at?: string;
  requires_approval: boolean;
  two_fa_enabled: boolean;
  language: string;
}

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  primaryColor: string;
  maintenanceMode: boolean;
  timezone: string;
  contactPhone: string;
  contactEmail: string;
  addressText: string;
}

interface Metrics {
  users: number;
  activeUsers: number;
  admins: number;
  orders: number;
  revenue: string | number;
  products: number;
  activeProducts: number;
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

interface Product {
  id: string;
  name: string;
  price: string | number;
  currency: string;
  is_available: boolean;
  is_featured: boolean;
  category?: { name: string } | null;
}

export default function AdminPage() {
  const pathname = usePathname();
  const locale = (locales.find((item) => pathname.split('/')[1] === item) || 'ru') as Locale;
  const ui = getUiTranslations(locale);
  const errorLoad = ui.admin.errorLoad;
  const [activeTab, setActiveTab] = useState<'users' | 'orders' | 'products' | 'settings' | 'stats'>('users');
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [metrics, setMetrics] = useState<Metrics>({ users: 0, activeUsers: 0, admins: 0, orders: 0, revenue: 0, products: 0, activeProducts: 0 });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  
  // Site settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'CaféFlow',
    siteDescription: ui.admin.description,
    logoUrl: '/Logo-CafeFlow.png',
    primaryColor: '#f59e0b',
    maintenanceMode: false,
    timezone: 'Asia/Bishkek',
    contactPhone: '',
    contactEmail: '',
    addressText: '',
  });

  const loadDashboard = useEffectEvent(async () => {
    setIsLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (searchQuery.trim()) query.set('search', searchQuery.trim());
      if (filterRole !== 'all') query.set('role', filterRole);
      const response = await fetch(`/api/admin/dashboard?${query.toString()}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || errorLoad);
      setUsers(data.users || []);
      setMetrics(data.metrics || { users: 0, activeUsers: 0, admins: 0, orders: 0, revenue: 0, products: 0, activeProducts: 0 });
      setRecentOrders(data.recentOrders || []);
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
          maintenanceMode: data.tenant.settings?.maintenanceMode === true,
        }));
      }
    } catch {
      setError(errorLoad);
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadDashboard(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [filterRole, refreshKey, searchQuery]);

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
        body: JSON.stringify({ resource: 'tenant', name: siteSettings.siteName, timezone: siteSettings.timezone, primaryColor: siteSettings.primaryColor, contactPhone: siteSettings.contactPhone || null, contactEmail: siteSettings.contactEmail || null, addressText: siteSettings.addressText || null, siteDescription: siteSettings.siteDescription, logoUrl: siteSettings.logoUrl, maintenanceMode: siteSettings.maintenanceMode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || ui.admin.errorSave);
      setSiteSettings((current) => ({ ...current, siteName: data.tenant.name, timezone: data.tenant.timezone, primaryColor: data.tenant.primary_color || current.primaryColor, contactPhone: data.tenant.contact_phone || '', contactEmail: data.tenant.contact_email || '', addressText: data.tenant.address_text || '', siteDescription: data.tenant.settings?.siteDescription || current.siteDescription, logoUrl: data.tenant.settings?.logoUrl || current.logoUrl, maintenanceMode: data.tenant.settings?.maintenanceMode === true }));
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

  const roleColors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    kitchen: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    employee: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    customer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {ui.admin.title}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {ui.admin.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRefreshKey((current) => current + 1)}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              disabled={isLoading}
            >
              <RefreshCw className={isLoading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              {ui.admin.refresh}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="font-semibold hover:underline">{ui.admin.close}</button>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            <nav className="flex min-w-max sm:min-w-0">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation ${
                  activeTab === 'users'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">{ui.admin.users}</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation ${
                  activeTab === 'settings'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <SettingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">{ui.admin.settings}</span>
              </button>
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">{ui.admin.ordersTab}</span>
              </button>
              <button
                onClick={() => setActiveTab('products')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation ${
                  activeTab === 'products'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <Package className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">{ui.admin.productsTab}</span>
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`flex-1 px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium flex items-center justify-center gap-1.5 sm:gap-2 transition-colors whitespace-nowrap touch-manipulation ${
                  activeTab === 'stats'
                    ? 'border-b-2 border-amber-600 text-amber-600 bg-amber-50 dark:bg-amber-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden xs:inline">{ui.admin.stats}</span>
              </button>
            </nav>
          </div>

          <div className="p-4 sm:p-6">
            {/* Users Tab */}
            {activeTab === 'users' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Search and Filter */}
                <div className="flex flex-col gap-3 sm:gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder={ui.admin.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-manipulation"
                    />
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="pl-10 pr-10 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer min-w-[200px]"
                    >
                      <option value="all">{ui.admin.allRoles}</option>
                      <option value="admin">{ui.admin.administrators}</option>
                      <option value="manager">{ui.admin.managers}</option>
                      <option value="kitchen">{ui.admin.roleKitchen}</option>
                      <option value="employee">{ui.admin.employees}</option>
                      <option value="customer">{ui.admin.customers}</option>
                    </select>
                  </div>
                </div>

                {/* Users Table/Cards */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {ui.admin.user}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            {ui.admin.email}
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
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold">
                                  {user.first_name[0]?.toUpperCase()}
                                </div>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {user.first_name} {user.last_name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {user.email}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                                {ui.profile.roleLabels[user.role] || user.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                user.status === 'active'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                              }`}>
                                {user.status === 'active' ? ui.admin.active : ui.admin.blocked}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {new Date(user.created_at).toLocaleDateString(locale)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
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
                  <div className="md:hidden divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <div key={user.id} className="p-4 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {user.first_name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                              {user.first_name} {user.last_name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                              {user.email}
                            </p>
                          </div>
                          <select
                            aria-label={`${ui.admin.status}: ${user.email}`}
                            value={user.status}
                            disabled={savingId === user.id}
                            onChange={(event) => void updateUser(user.id, { status: event.target.value })}
                            className="min-h-10 rounded-lg border border-gray-200 bg-white px-2 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                          >
                            <option value="active">{ui.admin.active}</option>
                            <option value="pending">{ui.admin.pending}</option>
                            <option value="blocked">{ui.admin.blocked}</option>
                          </select>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${roleColors[user.role]}`}>
                            {ui.profile.roleLabels[user.role] || user.role}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            user.status === 'active'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                          }`}>
                              {user.status === 'active' ? ui.admin.active : ui.admin.blocked}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(user.created_at).toLocaleDateString(locale)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {ui.admin.notFound}
                    </p>
                  </div>
                )}
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
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                      <tr><th className="px-4 py-3">№</th><th className="px-4 py-3">{ui.admin.clients}</th><th className="px-4 py-3">{ui.admin.revenue}</th><th className="px-4 py-3">{ui.admin.payment}</th><th className="px-4 py-3">{ui.admin.status}</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="bg-white dark:bg-gray-800">
                          <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">#{order.order_number}</td>
                          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{order.customer_name}</td>
                          <td className="px-4 py-3 font-semibold text-amber-600 dark:text-amber-400">{order.total} {order.currency}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{order.payment_status}</td>
                          <td className="px-4 py-3">
                            <select value={order.status} disabled={savingId === order.id} onChange={(event) => void updateOrder(order.id, event.target.value)} className="min-h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                              {['new', 'confirmed', 'cooking', 'ready', 'delivering', 'completed', 'cancelled'].map((status) => <option key={status} value={status}>{status}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {recentOrders.length === 0 && <p className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">{ui.admin.noOrders}</p>}
                </div>
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

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {ui.admin.siteName}
                    </label>
                    <input
                      type="text"
                      value={siteSettings.siteName}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteName: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {ui.admin.logoUrl}
                    </label>
                    <input
                      type="text"
                      value={siteSettings.logoUrl}
                      onChange={(e) => setSiteSettings({ ...siteSettings, logoUrl: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {ui.admin.siteDescription}
                    </label>
                    <textarea
                      value={siteSettings.siteDescription}
                      onChange={(e) => setSiteSettings({ ...siteSettings, siteDescription: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {ui.admin.primaryColor}
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="color"
                        value={siteSettings.primaryColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                        className="w-20 h-12 rounded-xl cursor-pointer"
                      />
                      <input
                        type="text"
                        value={siteSettings.primaryColor}
                        onChange={(e) => setSiteSettings({ ...siteSettings, primaryColor: e.target.value })}
                        className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ui.admin.timezone}</label>
                    <input
                      type="text"
                      value={siteSettings.timezone}
                      onChange={(e) => setSiteSettings({ ...siteSettings, timezone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ui.admin.contactPhone}</label>
                    <input
                      type="tel"
                      value={siteSettings.contactPhone}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contactPhone: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ui.admin.contactEmail}</label>
                    <input
                      type="email"
                      value={siteSettings.contactEmail}
                      onChange={(e) => setSiteSettings({ ...siteSettings, contactEmail: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{ui.admin.address}</label>
                    <input
                      type="text"
                      value={siteSettings.addressText}
                      onChange={(e) => setSiteSettings({ ...siteSettings, addressText: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                      <input
                        type="checkbox"
                        checked={siteSettings.maintenanceMode}
                        onChange={(e) => setSiteSettings({ ...siteSettings, maintenanceMode: e.target.checked })}
                        className="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded"
                      />
                      <div>
                        <span className="block text-sm font-medium text-gray-900 dark:text-white">
                          {ui.admin.maintenance}
                        </span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">
                          {ui.admin.maintenanceDescription}
                        </span>
                      </div>
                    </label>
                  </div>
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

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                    <Users className="w-8 h-8 mb-3 opacity-80" />
                    <h3 className="text-3xl font-bold mb-1">{metrics.users}</h3>
                    <p className="text-blue-100">{ui.admin.totalUsers}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <CheckCircle className="w-8 h-8 mb-3 opacity-80" />
                    <h3 className="text-3xl font-bold mb-1">
                      {metrics.activeUsers}
                    </h3>
                    <p className="text-green-100">{ui.admin.activeUsers}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <Crown className="w-8 h-8 mb-3 opacity-80" />
                    <h3 className="text-3xl font-bold mb-1">
                      {metrics.admins}
                    </h3>
                    <p className="text-purple-100">{ui.admin.adminCount}</p>
                  </div>
                </div>

                <div className="rounded-xl bg-gray-50 p-5 dark:bg-gray-900/50">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{ui.admin.ordersToday}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{metrics.orders} · {metrics.revenue} {ui.admin.currency}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-amber-500" />
                  </div>
                  <div className="space-y-2">
                    {recentOrders.length === 0 ? (
                      <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">{ui.admin.detailedStats}</p>
                    ) : recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between gap-4 rounded-lg bg-white px-4 py-3 text-sm dark:bg-gray-800">
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white">#{order.order_number} · {order.customer_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(order.created_at).toLocaleString(locale)}</p>
                        </div>
                        <span className="shrink-0 font-semibold text-amber-600 dark:text-amber-400">{order.total} {order.currency}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
