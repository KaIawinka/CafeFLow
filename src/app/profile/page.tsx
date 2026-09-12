'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Clock,
  Globe,
  Shield,
  Bell,
  Eye,
  Palette,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Key,
  Calendar,
} from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
  role: string;
  status: string;
  language: string;
  timezone: string;
  email_verified_at?: string;
  phone_verified_at?: string;
  telegram_chat_id?: string;
  telegram_username?: string;
  telegram_activated_with_key?: string;
  two_fa_enabled: boolean;
  requires_approval: boolean;
  last_login_at?: string;
  last_seen_at?: string;
  created_at: string;
  user_settings?: {
    email_notifications: boolean;
    sms_notifications: boolean;
    push_notifications: boolean;
    telegram_notifications: boolean;
    show_online_status: boolean;
    show_phone: boolean;
    show_email: boolean;
    theme: string;
    compact_mode: boolean;
  };
}

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message');

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    bio: '',
    phone: '',
    language: 'ru',
    timezone: 'Asia/Bishkek',
  });

  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    telegramNotifications: true,
    showOnlineStatus: true,
    showPhone: false,
    showEmail: false,
    theme: 'light',
    compactMode: false,
  });

  // Load profile
  useEffect(() => {
    loadProfile();
  }, []);

  // Show welcome message
  useEffect(() => {
    if (message === 'welcome') {
      setSuccess('Добро пожаловать! Ваш аккаунт успешно создан.');
    } else if (message === 'awaiting_approval') {
      setError('Ваш аккаунт ожидает подтверждения администратором.');
    }
  }, [message]);

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (response.ok && data.user) {
        setProfile(data.user);
        setFormData({
          firstName: data.user.first_name || '',
          lastName: data.user.last_name || '',
          displayName: data.user.display_name || '',
          bio: data.user.bio || '',
          phone: data.user.phone || '',
          language: data.user.language || 'ru',
          timezone: data.user.timezone || 'Asia/Bishkek',
        });

        if (data.user.user_settings) {
          setSettings({
            emailNotifications: data.user.user_settings.email_notifications,
            smsNotifications: data.user.user_settings.sms_notifications,
            pushNotifications: data.user.user_settings.push_notifications,
            telegramNotifications: data.user.user_settings.telegram_notifications,
            showOnlineStatus: data.user.user_settings.show_online_status,
            showPhone: data.user.user_settings.show_phone,
            showEmail: data.user.user_settings.show_email,
            theme: data.user.user_settings.theme,
            compactMode: data.user.user_settings.compact_mode,
          });
        }
      }
    } catch (err) {
      setError('Ошибка загрузки профиля');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Профиль успешно обновлён');
        setProfile((prev) => (prev ? { ...prev, ...data.user } : null));
      } else {
        setError(data.error || 'Ошибка сохранения');
      }
    } catch (err) {
      setError('Произошла ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setError('');
    setSuccess('');
    setIsSaving(true);

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Настройки успешно обновлены');
      } else {
        setError(data.error || 'Ошибка сохранения');
      }
    } catch (err) {
      setError('Произошла ошибка');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300">Не удалось загрузить профиль</p>
        </div>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    admin: 'Администратор',
    manager: 'Менеджер',
    kitchen: 'Кухня',
    employee: 'Сотрудник',
    customer: 'Клиент',
    guest: 'Гость',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {profile.first_name[0]?.toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {profile.display_name || `${profile.first_name} ${profile.last_name || ''}`}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </span>
                  <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                    {roleLabels[profile.role]}
                  </span>
                </div>

                {profile.requires_approval && (
                  <div className="mt-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-300">
                      ⏳ Ваш аккаунт ожидает подтверждения администратором
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`flex-1 px-6 py-4 text-sm font-medium ${
                    activeTab === 'profile'
                      ? 'border-b-2 border-amber-600 text-amber-600'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <User className="w-4 h-4 inline mr-2" />
                  Профиль
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 px-6 py-4 text-sm font-medium ${
                    activeTab === 'settings'
                      ? 'border-b-2 border-amber-600 text-amber-600'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <Shield className="w-4 h-4 inline mr-2" />
                  Настройки
                </button>
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'profile' ? (
                <div className="space-y-6">
                  {/* Profile Form */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Имя
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Фамилия
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Отображаемое имя
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        О себе
                      </label>
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Расскажите о себе..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Телефон
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Язык
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={formData.language}
                          onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="ru">Русский</option>
                          <option value="en">English</option>
                          <option value="kg">Кыргызча</option>
                        </select>
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Часовой пояс
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                          value={formData.timezone}
                          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value="Asia/Bishkek">Asia/Bishkek (GMT+6)</option>
                          <option value="Europe/Moscow">Europe/Moscow (GMT+3)</option>
                          <option value="Europe/London">Europe/London (GMT+0)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Telegram Info */}
                  {profile.telegram_chat_id && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-1">
                            Telegram подключён
                          </h3>
                          <p className="text-sm text-blue-700 dark:text-blue-400">
                            @{profile.telegram_username || 'username'}
                          </p>
                          {profile.telegram_activated_with_key && (
                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                              Ключ: {profile.telegram_activated_with_key}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Account Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Регистрация:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                    </div>

                    {profile.last_login_at && (
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Последний вход:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {new Date(profile.last_login_at).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Сохранить профиль
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Notifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Уведомления
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'emailNotifications', label: 'Email уведомления', icon: Mail },
                        { key: 'smsNotifications', label: 'SMS уведомления', icon: Phone },
                        { key: 'pushNotifications', label: 'Push уведомления', icon: Bell },
                        { key: 'telegramNotifications', label: 'Telegram уведомления', icon: MessageSquare },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                          <span className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
                            <item.icon className="w-4 h-4" />
                            {item.label}
                          </span>
                          <input
                            type="checkbox"
                            checked={settings[item.key as keyof typeof settings] as boolean}
                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                            className="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Privacy */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Приватность
                    </h3>
                    <div className="space-y-3">
                      {[
                        { key: 'showOnlineStatus', label: 'Показывать статус онлайн' },
                        { key: 'showPhone', label: 'Показывать телефон' },
                        { key: 'showEmail', label: 'Показывать email' },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={settings[item.key as keyof typeof settings] as boolean}
                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                            className="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Appearance */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Внешний вид
                    </h3>
                    <div className="space-y-3">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Тема</label>
                        <select
                          value={settings.theme}
                          onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 dark:bg-gray-600 dark:text-white"
                        >
                          <option value="light">Светлая</option>
                          <option value="dark">Тёмная</option>
                          <option value="auto">Автоматически</option>
                        </select>
                      </div>

                      <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                        <span className="text-sm text-gray-700 dark:text-gray-300">Компактный режим</span>
                        <input
                          type="checkbox"
                          checked={settings.compactMode}
                          onChange={(e) => setSettings({ ...settings, compactMode: e.target.checked })}
                          className="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Сохранение...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Сохранить настройки
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
