'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getLocaleTranslations } from '@/app/i18n/catalog';
import { locales, type Locale } from '@/app/i18n/config';
import {
  User,
  Shield,
  Bell,
  Eye,
  Globe,
  Palette,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lock,
  Mail,
  Phone,
  MessageSquare,
  Moon,
  Sun,
  Smartphone,
  Key,
} from 'lucide-react';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'privacy' | 'appearance';

interface UserSettings {
  // Profile
  language: string;
  timezone: string;
  
  // Security
  twoFAEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  
  // Notifications
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  telegramNotifications: boolean;
  
  // Privacy
  showOnlineStatus: boolean;
  showPhone: boolean;
  showEmail: boolean;
  
  // Appearance
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  language_ui: string;
}

export default function SettingsPage() {
  const pathname = usePathname();
  const router = useRouter();
  const locale = (locales.find((item) => pathname.split('/')[1] === item) || 'ru') as Locale;
  const copy = getLocaleTranslations(locale).ui.settings;
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [settings, setSettings] = useState<UserSettings>({
    language: 'ru',
    timezone: 'Asia/Bishkek',
    twoFAEnabled: false,
    emailVerified: false,
    phoneVerified: false,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    telegramNotifications: true,
    showOnlineStatus: true,
    showPhone: false,
    showEmail: false,
    theme: 'system',
    compactMode: false,
    language_ui: 'ru',
  });

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/user/settings');
        const data = await response.json();
        
        if (response.ok && data.settings) {
          setSettings((currentSettings) => ({
            ...currentSettings,
            ...data.settings,
          }));
        }
      } catch (error) {
        console.error('Failed to load settings', error);
      } finally {
        setIsLoading(false);
      }
    };

    void loadSettings();
  }, []);

  const handleSave = async () => {
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
        setSuccess(copy.messages.saved);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || copy.messages.saveError);
      }
    } catch {
      setError(copy.messages.saveGenericError);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsChangingPassword(true);

    try {
      const response = await fetch('/api/user/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwordData),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || copy.messages.passwordError);
        return;
      }

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      router.push(`/${locale}/login?message=password_changed`);
    } catch {
      setError(copy.messages.passwordGenericError);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const tabs = [
    { id: 'profile', label: copy.tabs.profile, icon: User },
    { id: 'security', label: copy.tabs.security, icon: Shield },
    { id: 'notifications', label: copy.tabs.notifications, icon: Bell },
    { id: 'privacy', label: copy.tabs.privacy, icon: Eye },
    { id: 'appearance', label: copy.tabs.appearance, icon: Palette },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {copy.title}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            {copy.description}
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Sidebar - horizontal on mobile, vertical on desktop */}
          <div className="lg:col-span-1">
            {/* Mobile: horizontal scrollable tabs */}
            <div className="lg:hidden bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 mb-4">
              <nav className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all touch-manipulation ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium whitespace-nowrap">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Desktop: vertical sidebar */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-2 sticky top-8">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 sm:p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 sm:w-6 sm:h-6" />
                      {copy.profile.title}
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Globe className="w-4 h-4 inline mr-2" />
                        {copy.profile.language}
                      </label>
                      <select
                        value={settings.language_ui}
                        onChange={(e) => setSettings({ ...settings, language_ui: e.target.value })}
                        className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-manipulation"
                      >
                        <option value="ru">{copy.languages.ru}</option>
                        <option value="en">{copy.languages.en}</option>
                        <option value="kg">{copy.languages.kg}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Globe className="w-4 h-4 inline mr-2" />
                        {copy.profile.timezone}
                      </label>
                      <select
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                        className="w-full px-4 py-2.5 sm:py-3 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-amber-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white touch-manipulation"
                      >
                        <option value="Asia/Bishkek">{copy.timezones.bishkek}</option>
                        <option value="Europe/Moscow">{copy.timezones.moscow}</option>
                        <option value="Europe/London">{copy.timezones.london}</option>
                        <option value="America/New_York">{copy.timezones.newYork}</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
                      {copy.security.title}
                    </h2>
                  </div>

                  {/* 2FA */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4 mb-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="bg-blue-500 p-2 sm:p-3 rounded-xl flex-shrink-0">
                          <Key className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                            {copy.security.twoFactor}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {copy.security.twoFactorDescription}
                          </p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={settings.twoFAEnabled}
                          onChange={(e) => setSettings({ ...settings, twoFAEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-amber-600"></div>
                      </label>
                    </div>
                  </div>

                  {/* Verification Status */}
                  <div className="space-y-3 sm:space-y-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">{copy.security.verificationStatus}</h3>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Mail className={`w-5 h-5 flex-shrink-0 ${settings.emailVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                        <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{copy.security.email}</span>
                      </div>
                      {settings.emailVerified ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                          {copy.security.verified}
                        </span>
                      ) : (
                        <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium min-h-[44px] transition-colors">
                          {copy.security.verify}
                        </button>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <div className="flex items-center gap-3">
                        <Phone className={`w-5 h-5 flex-shrink-0 ${settings.phoneVerified ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`} />
                        <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">{copy.security.phone}</span>
                      </div>
                      {settings.phoneVerified ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                          {copy.security.verified}
                        </span>
                      ) : (
                        <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium min-h-[44px] transition-colors">
                          {copy.security.verify}
                        </button>
                      )}
                    </div>
                  </div>

                  <form onSubmit={handlePasswordChange} className="space-y-4 border-t border-gray-200 pt-4 sm:pt-6 dark:border-gray-700">
                    <div>
                      <h3 className="flex items-center gap-2 text-base font-semibold text-gray-900 dark:text-white">
                        <Lock className="h-5 w-5" />
                        {copy.security.changePassword}
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{copy.security.changePasswordDescription}</p>
                    </div>
                    <input
                      type="password"
                      autoComplete="current-password"
                      value={passwordData.currentPassword}
                      onChange={(event) => setPasswordData({ ...passwordData, currentPassword: event.target.value })}
                      placeholder={copy.security.currentPassword}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={passwordData.newPassword}
                      onChange={(event) => setPasswordData({ ...passwordData, newPassword: event.target.value })}
                      placeholder={copy.security.newPassword}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={passwordData.confirmPassword}
                      onChange={(event) => setPasswordData({ ...passwordData, confirmPassword: event.target.value })}
                      placeholder={copy.security.confirmPassword}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                      {isChangingPassword ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                      {isChangingPassword ? copy.security.changingPassword : copy.security.changePasswordButton}
                    </button>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Bell className="w-6 h-6" />
                      {copy.notifications.title}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'emailNotifications', label: copy.notifications.email, icon: Mail, desc: copy.notifications.emailDescription },
                      { key: 'smsNotifications', label: copy.notifications.sms, icon: Phone, desc: copy.notifications.smsDescription },
                      { key: 'pushNotifications', label: copy.notifications.push, icon: Smartphone, desc: copy.notifications.pushDescription },
                      { key: 'telegramNotifications', label: copy.notifications.telegram, icon: MessageSquare, desc: copy.notifications.telegramDescription },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <label key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400 mt-1" />
                            <div>
                              <span className="block font-medium text-gray-900 dark:text-white">{item.label}</span>
                              <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</span>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings[item.key as keyof UserSettings] as boolean}
                            onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                            className="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Eye className="w-6 h-6" />
                      {copy.privacy.title}
                    </h2>
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'showOnlineStatus', label: copy.privacy.onlineStatus, desc: copy.privacy.onlineStatusDescription },
                      { key: 'showPhone', label: copy.privacy.phone, desc: copy.privacy.phoneDescription },
                      { key: 'showEmail', label: copy.privacy.email, desc: copy.privacy.emailDescription },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <div>
                          <span className="block font-medium text-gray-900 dark:text-white">{item.label}</span>
                          <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.desc}</span>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings[item.key as keyof UserSettings] as boolean}
                          onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                          className="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Palette className="w-6 h-6" />
                      {copy.appearance.title}
                    </h2>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                      {copy.appearance.theme}
                    </label>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { value: 'light', label: copy.appearance.themes.light, icon: Sun },
                        { value: 'dark', label: copy.appearance.themes.dark, icon: Moon },
                        { value: 'system', label: copy.appearance.themes.system, icon: Smartphone },
                      ].map((theme) => {
                        const Icon = theme.icon;
                        return (
                          <button
                            key={theme.value}
                            onClick={() => setSettings({ ...settings, theme: theme.value as UserSettings['theme'] })}
                            className={`p-6 rounded-xl border-2 transition-all ${
                              settings.theme === theme.value
                                ? 'border-amber-600 bg-amber-50 dark:bg-amber-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                            }`}
                          >
                            <Icon className={`w-8 h-8 mx-auto mb-2 ${
                              settings.theme === theme.value ? 'text-amber-600' : 'text-gray-400'
                            }`} />
                            <span className={`block text-sm font-medium ${
                              settings.theme === theme.value
                                ? 'text-amber-600'
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {theme.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                    <div>
                      <span className="block font-medium text-gray-900 dark:text-white">{copy.appearance.compactMode}</span>
                      <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {copy.appearance.compactModeDescription}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.compactMode}
                      onChange={(e) => setSettings({ ...settings, compactMode: e.target.checked })}
                      className="w-5 h-5 text-amber-600 focus:ring-amber-500 rounded"
                    />
                  </label>
                </div>
              )}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      {copy.buttons.saving}
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {copy.buttons.save}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
