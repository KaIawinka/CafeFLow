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
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  Trash2,
  X,
} from 'lucide-react';
import { SettingsToggle } from '@/components/ui/SettingsToggle';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'privacy' | 'appearance';

interface UserSettings {
  // Profile
  language: string;
  
  // Security
  twoFAEnabled: boolean;
  telegramLinked: boolean;
  telegramUsername: string | null;
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
    code: '',
  });
  const [isRequestingPasswordCode, setIsRequestingPasswordCode] = useState(false);
  const [passwordCodeRequested, setPasswordCodeRequested] = useState(false);
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [telegramLinkUrl, setTelegramLinkUrl] = useState('');
  const [telegramLinkInstructions, setTelegramLinkInstructions] = useState<string[]>([]);
  const [isLinkingTelegram, setIsLinkingTelegram] = useState(false);
  const [isCheckingTelegram, setIsCheckingTelegram] = useState(false);
  const [isUpdatingTwoFA, setIsUpdatingTwoFA] = useState(false);
  const [isDeletionModalOpen, setIsDeletionModalOpen] = useState(false);
  const [deletionCode, setDeletionCode] = useState('');
  const [deletionCodeRequested, setDeletionCodeRequested] = useState(false);
  const [isRequestingDeletionCode, setIsRequestingDeletionCode] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [settings, setSettings] = useState<UserSettings>({
    language: 'ru',
    twoFAEnabled: false,
    telegramLinked: false,
    telegramUsername: null,
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

  const handleLinkTelegram = async () => {
    setError('');
    setSuccess('');
    setIsLinkingTelegram(true);

    try {
      const response = await fetch('/api/auth/telegram/link-code');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || copy.security.telegramNotConnected);
        return;
      }

      setTelegramLinkUrl(data.linkUrl || '');
      setTelegramLinkInstructions(Array.isArray(data.instructions) ? data.instructions : []);
      setSuccess(copy.security.telegramLinkReady);
    } catch {
      setError(copy.security.telegramNotConnected);
    } finally {
      setIsLinkingTelegram(false);
    }
  };

  const handleCheckTelegram = async () => {
    setError('');
    setSuccess('');
    setIsCheckingTelegram(true);

    try {
      const response = await fetch('/api/user/settings');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || copy.messages.saveGenericError);
        return;
      }

      if (data.settings) {
        setSettings((currentSettings) => ({ ...currentSettings, ...data.settings }));
        if (data.settings.telegramLinked) {
          setTelegramLinkUrl('');
          setTelegramLinkInstructions([]);
          setSuccess(copy.security.telegramConnected);
        } else {
          setError(copy.security.telegramNotConnected);
        }
      }
    } catch {
      setError(copy.messages.saveGenericError);
    } finally {
      setIsCheckingTelegram(false);
    }
  };

  const handleTwoFactorChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setIsUpdatingTwoFA(true);

    try {
      const enabled = !settings.twoFAEnabled;
      const response = await fetch('/api/auth/telegram/2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled, currentPassword: twoFactorPassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || copy.messages.saveError);
        return;
      }

      setSettings((currentSettings) => ({ ...currentSettings, twoFAEnabled: enabled }));
      setTwoFactorPassword('');
      setSuccess(data.message || (enabled ? copy.security.twoFactorEnabled : copy.security.twoFactorDisabled));
    } catch {
      setError(copy.messages.saveGenericError);
    } finally {
      setIsUpdatingTwoFA(false);
    }
  };

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

  const handleRequestPasswordCode = async () => {
    setError('');
    setSuccess('');
    setIsRequestingPasswordCode(true);

    try {
      const response = await fetch('/api/user/password/request-code', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || copy.messages.passwordError);
        return;
      }

      setPasswordCodeRequested(true);
      setSuccess(data.message || copy.security.passwordCodeSent);
    } catch {
      setError(copy.messages.passwordGenericError);
    } finally {
      setIsRequestingPasswordCode(false);
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

      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '', code: '' });
      setPasswordCodeRequested(false);
      router.push(`/${locale}/login?message=password_changed`);
    } catch {
      setError(copy.messages.passwordGenericError);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRequestDeletionCode = async () => {
    setError('');
    setSuccess('');
    setIsRequestingDeletionCode(true);

    try {
      const response = await fetch('/api/user/account/request-deletion-code', { method: 'POST' });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || copy.security.accountDeletionError);
        return;
      }

      setDeletionCodeRequested(true);
      setSuccess(data.message || copy.security.accountDeletionCodeSent);
    } catch {
      setError(copy.messages.saveGenericError);
    } finally {
      setIsRequestingDeletionCode(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletionCode.trim()) {
      setError(copy.security.accountDeletionCodeRequired);
      return;
    }

    setError('');
    setSuccess('');
    setIsDeletingAccount(true);

    try {
      const response = await fetch('/api/user/account/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: deletionCode }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || copy.security.accountDeletionError);
        return;
      }

      router.push(`/${locale}/login?message=account_deleted`);
    } catch {
      setError(copy.security.accountDeletionError);
    } finally {
      setIsDeletingAccount(false);
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
    <div className="min-h-screen bg-[var(--background)] py-8 text-[var(--foreground)]">
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] border-l-4 border-l-orange-500 bg-[var(--card)] p-6 shadow-[0_12px_32px_rgba(21,26,30,0.06)] sm:mb-8 sm:p-8">
          <h1 className="mb-2 text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-3xl">
            {copy.title}
          </h1>
          <p className="text-sm text-[var(--muted-foreground)] sm:text-base">
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
            <div className="mb-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-[0_12px_32px_rgba(21,26,30,0.06)] lg:hidden">
              <nav className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all touch-manipulation ${
                        activeTab === tab.id
                          ? 'bg-[var(--secondary)] text-[var(--primary)] shadow-sm'
                          : 'bg-[var(--muted)]/60 text-[var(--muted-foreground)]'
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
            <div className="sticky top-8 hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] p-2 shadow-[0_12px_32px_rgba(21,26,30,0.06)] lg:block">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        activeTab === tab.id
                          ? 'bg-[var(--secondary)] text-[var(--primary)] shadow-sm'
                          : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)]'
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
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-[0_12px_32px_rgba(21,26,30,0.06)] sm:p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 sm:w-6 sm:h-6" />
                      {copy.profile.title}
                    </h2>
                  </div>

                    <div className="grid grid-cols-1 gap-4 sm:gap-6">
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

                  {/* Telegram and 2FA */}
                  <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-800 dark:from-blue-900/20 dark:to-indigo-900/20 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-blue-500 p-2 sm:p-3">
                          <Key className="h-5 w-5 text-white sm:h-6 sm:w-6" />
                        </div>
                        <div>
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
                            {copy.security.twoFactor}
                          </h3>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                            {copy.security.twoFactorDescription}
                          </p>
                        </div>
                      </div>
                      <div className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1 text-xs font-semibold ${settings.twoFAEnabled ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                        {settings.twoFAEnabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                        {settings.twoFAEnabled ? copy.security.twoFactorEnabled : copy.security.twoFactorDisabled}
                      </div>
                    </div>

                    <div className="mt-5 rounded-lg bg-white/70 p-4 dark:bg-gray-900/30">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
                          <MessageSquare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          {settings.telegramLinked ? copy.security.telegramConnected : copy.security.telegramNotConnected}
                          {settings.telegramUsername && <span className="font-normal text-gray-500">@{settings.telegramUsername}</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!settings.telegramLinked && (
                            <button
                              type="button"
                              onClick={handleLinkTelegram}
                              disabled={isLinkingTelegram}
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isLinkingTelegram ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                              {copy.security.connectTelegram}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleCheckTelegram}
                            disabled={isCheckingTelegram}
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                          >
                            {isCheckingTelegram ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            {copy.security.checkTelegram}
                          </button>
                        </div>
                      </div>

                      {telegramLinkUrl && (
                        <div className="mt-4 border-t border-blue-100 pt-4 dark:border-blue-900">
                          <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{copy.security.telegramLinkReady}</p>
                          <a
                            href={telegramLinkUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {copy.security.openTelegram}
                          </a>
                          {telegramLinkInstructions.length > 0 && (
                            <ol className="mt-3 list-inside list-decimal space-y-1 text-xs text-gray-600 dark:text-gray-400">
                              {telegramLinkInstructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
                            </ol>
                          )}
                          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{copy.security.telegramLinkExpires}</p>
                        </div>
                      )}
                    </div>

                    {(settings.telegramLinked || settings.twoFAEnabled) && (
                      <form onSubmit={handleTwoFactorChange} className="mt-4 border-t border-blue-200 pt-4 dark:border-blue-800">
                        <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{copy.security.twoFactorActionDescription}</p>
                        <div className="flex flex-col gap-3 sm:flex-row">
                          <input
                            type="password"
                            autoComplete="current-password"
                            value={twoFactorPassword}
                            onChange={(event) => setTwoFactorPassword(event.target.value)}
                            placeholder={copy.security.twoFactorPassword}
                            required
                            className="min-h-11 flex-1 rounded-lg border border-gray-300 px-4 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          />
                          <button
                            type="submit"
                            disabled={isUpdatingTwoFA}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-gray-400"
                          >
                            {isUpdatingTwoFA ? <Loader2 className="h-5 w-5 animate-spin" /> : settings.twoFAEnabled ? <ShieldOff className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
                            {settings.twoFAEnabled ? copy.security.disableTwoFactor : copy.security.enableTwoFactor}
                          </button>
                        </div>
                      </form>
                    )}
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
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">{copy.security.notVerified}</span>
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
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">{copy.security.notVerified}</span>
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
                    <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[var(--foreground)]">{copy.security.passwordCode}</p>
                          <p className="mt-1 text-xs text-[var(--muted-foreground)]">{copy.security.passwordCodeDescription}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRequestPasswordCode()}
                          disabled={isRequestingPasswordCode}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-bold text-[var(--foreground)] transition hover:border-orange-400 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRequestingPasswordCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                          {copy.security.requestPasswordCode}
                        </button>
                      </div>
                      {passwordCodeRequested && <p className="mt-3 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{copy.security.passwordCodeSent}</p>}
                    </div>
                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={passwordData.code}
                      onChange={(event) => setPasswordData({ ...passwordData, code: event.target.value.replace(/\D/g, '') })}
                      placeholder={copy.security.passwordCodePlaceholder}
                      required
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 tracking-[0.3em] dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
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

                  <section className="rounded-2xl border border-red-200 bg-red-50/70 p-5 dark:border-red-900/70 dark:bg-red-950/20 sm:p-6">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300"><AlertTriangle className="h-5 w-5" /></div>
                      <div>
                        <h3 className="text-base font-black text-red-900 dark:text-red-200">{copy.security.accountDeletion}</h3>
                        <p className="mt-1 text-sm text-red-800/80 dark:text-red-300/80">{copy.security.accountDeletionDescription}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setDeletionCode(''); setDeletionCodeRequested(false); setIsDeletionModalOpen(true); }}
                      className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-5 text-sm font-bold text-red-700 transition hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {copy.security.deleteAccount}
                    </button>
                  </section>
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
                      return (
                        <SettingsToggle
                          key={item.key}
                          checked={settings[item.key as keyof UserSettings] as boolean}
                          label={item.label}
                          description={item.desc}
                          icon={item.icon}
                          onChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
                        />
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
                      <SettingsToggle
                        key={item.key}
                        checked={settings[item.key as keyof UserSettings] as boolean}
                        label={item.label}
                        description={item.desc}
                        onChange={(checked) => setSettings({ ...settings, [item.key]: checked })}
                      />
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

                  <SettingsToggle
                    checked={settings.compactMode}
                    label={copy.appearance.compactMode}
                    description={copy.appearance.compactModeDescription}
                    onChange={(checked) => setSettings({ ...settings, compactMode: checked })}
                  />
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

        {isDeletionModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="account-deletion-title">
            <div className="w-full max-w-lg rounded-2xl border border-red-200 bg-[var(--card)] p-5 shadow-2xl dark:border-red-900/70 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300"><AlertTriangle className="h-5 w-5" /></div>
                  <div>
                    <h2 id="account-deletion-title" className="text-lg font-black text-[var(--foreground)]">{copy.security.accountDeletionConfirmTitle}</h2>

                {error && <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
                    <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">{copy.security.accountDeletionConfirmDescription}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setIsDeletionModalOpen(false)} className="rounded-lg p-2 text-[var(--muted-foreground)] transition hover:bg-[var(--muted)] hover:text-[var(--foreground)]" aria-label={copy.security.cancelDeletion}>
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!deletionCodeRequested ? (
                <button
                  type="button"
                  onClick={() => void handleRequestDeletionCode()}
                  disabled={isRequestingDeletionCode}
                  className="mt-6 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-red-600 px-5 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isRequestingDeletionCode ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                  {copy.security.requestDeletionCode}
                </button>
              ) : (
                <div className="mt-6 space-y-4">
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">{copy.security.accountDeletionCodeSent}</p>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={deletionCode}
                    onChange={(event) => setDeletionCode(event.target.value.replace(/\D/g, ''))}
                    placeholder={copy.security.accountDeletionCodePlaceholder}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)] px-4 py-3 tracking-[0.3em] text-[var(--foreground)] outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  />
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={() => setIsDeletionModalOpen(false)} className="min-h-11 rounded-lg border border-[var(--border)] px-5 text-sm font-bold text-[var(--foreground)] transition hover:bg-[var(--muted)]">{copy.security.cancelDeletion}</button>
                    <button type="button" onClick={() => void handleDeleteAccount()} disabled={isDeletingAccount} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">
                      {isDeletingAccount ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      {isDeletingAccount ? copy.security.deletingAccount : copy.security.confirmDeleteAccount}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
