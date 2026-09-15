'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import {
  Users,
  Settings as SettingsIcon,
  BarChart3,
  Loader2,
  Search,
  Filter,
  MoreVertical,
  Crown,
  CheckCircle,
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
}

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  primaryColor: string;
  maintenanceMode: boolean;
}

export default function AdminPage() {
  const pathname = usePathname();
  const locale = (locales.find((item) => pathname.split('/')[1] === item) || 'ru') as Locale;
  const ui = getUiTranslations(locale);
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'stats'>('users');
  const [isLoading] = useState(false);
  const [users] = useState<User[]>([
    {
      id: '1',
      email: 'admin@cafeflow.com',
      first_name: ui.admin.demoAdminName,
      role: 'admin',
      status: 'active',
      created_at: new Date().toISOString(),
    },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  
  // Site settings
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'CaféFlow',
    siteDescription: ui.admin.description,
    logoUrl: '/Logo-CafeFlow.png',
    primaryColor: '#f59e0b',
    maintenanceMode: false,
  });

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.first_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {ui.admin.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {ui.admin.description}
          </p>
        </div>

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
                              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center ml-auto">
                                <MoreVertical className="w-5 h-5" />
                              </button>
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
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-h-[44px] min-w-[44px] flex items-center justify-center">
                            <MoreVertical className="w-5 h-5" />
                          </button>
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
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all shadow-lg hover:shadow-xl"
                >
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
                    <h3 className="text-3xl font-bold mb-1">{users.length}</h3>
                    <p className="text-blue-100">{ui.admin.totalUsers}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                    <CheckCircle className="w-8 h-8 mb-3 opacity-80" />
                    <h3 className="text-3xl font-bold mb-1">
                      {users.filter((u) => u.status === 'active').length}
                    </h3>
                    <p className="text-green-100">{ui.admin.activeUsers}</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                    <Crown className="w-8 h-8 mb-3 opacity-80" />
                    <h3 className="text-3xl font-bold mb-1">
                      {users.filter((u) => u.role === 'admin').length}
                    </h3>
                    <p className="text-purple-100">{ui.admin.adminCount}</p>
                  </div>
                </div>

                <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    {ui.admin.detailedStats}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
