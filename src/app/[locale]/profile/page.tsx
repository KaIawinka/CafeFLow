'use client';

import { Suspense, useCallback, useState, useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import {
  Mail,
  Phone,
  Clock,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Calendar,
  ShieldCheck,
  Camera,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import { locales, type Locale } from '@/app/i18n/config';
import { getLocaleTranslations } from '@/app/i18n/catalog';
import { CustomerAddresses } from '@/components/profile/CustomerAddresses';
import { CustomerReservations } from '@/components/profile/CustomerReservations';
import { CafeFlowLoader } from '@/components/ui/CafeFlowLoader';

interface UserProfile {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name?: string;
  display_name?: string;
  role: string;
  status: string;
  language: string;
  email_verified_at?: string;
  phone_verified_at?: string;
  telegram_chat_id?: string;
  telegram_username?: string;
  telegram_activated_with_key?: string;
  requires_approval: boolean;
  last_login_at?: string;
  last_seen_at?: string;
  created_at: string;
  avatar_file_id?: string;
  avatar_file?: {
    storage_key: string;
    mime_type: string;
  };
}

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileContent />
    </Suspense>
  );
}

function ProfileContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = (locales.find((item) => pathname.split('/')[1] === item) || 'ru') as Locale;
  const translations = getLocaleTranslations(locale).ui;
  const copy = translations.profile;
  const securityCopy = translations.settings.security;
  const roleLabels = copy.roles as Record<string, string>;
  const welcomeMessage = `${copy.welcome} ${copy.welcomeMessage}`;
  const message = searchParams.get('message');
  const dateLocale = locale === 'ru' ? 'ru-RU' : locale === 'kg' ? 'ky-KG' : 'en-US';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(
    message === 'awaiting_approval' ? copy.awaitingApproval : ''
  );
  const [success, setSuccess] = useState(
    message === 'welcome' ? welcomeMessage : ''
  );
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    phone: '',
  });

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch('/api/user/profile');
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || copy.loadingError);
      if (data.user) {
        setProfile(data.user);
        setFormData({
          firstName: data.user.first_name || '',
          lastName: data.user.last_name || '',
          displayName: data.user.display_name || '',
          phone: data.user.phone || '',
        });

      }
    } catch {
      setError(copy.loadingError);
    } finally {
      setIsLoading(false);
    }
  }, [copy]);

  // Load profile after mounting so the page can show its initial status message immediately.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadProfile();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadProfile]);

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
        setSuccess(copy.messages.profileUpdated);
        setProfile((prev) => (prev ? { ...prev, ...data.user } : null));
      } else {
        setError(data.error || copy.messages.saveError);
      }
    } catch {
      setError(copy.messages.genericError);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <CafeFlowLoader />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-700 dark:text-gray-300">{copy.loadingError}</p>
        </div>
      </div>
    );
  }

  const securityChecks = [
    Boolean(profile.email_verified_at),
    Boolean(profile.telegram_chat_id),
  ].filter(Boolean).length;
  const profileName = profile.display_name || `${profile.first_name} ${profile.last_name || ''}`.trim();
  const formatDate = (value?: string) => value ? new Date(value).toLocaleDateString(dateLocale) : '—';
  const accountStatus = profile.status === 'active' ? copy.summary.active : copy.summary.pending;

  return (
    <div className="min-h-screen bg-[var(--background)] py-8 text-[var(--foreground)]">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6 overflow-hidden rounded-2xl border border-[var(--border)] border-l-4 border-l-orange-500 bg-[var(--card)] p-6 shadow-[0_12px_32px_rgba(21,26,30,0.06)] sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)] lg:items-center">
              {/* Avatar */}
              <div className="relative w-fit shrink-0">
                {profile.avatar_file?.storage_key ? (
                  <Image src={profile.avatar_file.storage_key} alt={copy.title} width={96} height={96} className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover shadow-lg" />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-lg">
                    {profile.first_name[0]?.toUpperCase()}
                  </div>
                )}
                <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gray-900 text-white shadow-lg transition hover:bg-orange-500" title={copy.updatePhoto} aria-label={copy.updatePhoto}>
                  {isUploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    disabled={isUploadingAvatar}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      setIsUploadingAvatar(true);
                      setError('');
                      const uploadData = new FormData();
                      uploadData.append('avatar', file);
                      try {
                        const response = await fetch('/api/user/avatar', { method: 'POST', body: uploadData });
                        const data = await response.json();
                        if (!response.ok) {
                          setError(data.error || copy.messages.avatarError);
                        } else {
                          setProfile((current) => current ? {
                            ...current,
                            avatar_file: { storage_key: data.avatarUrl, mime_type: file.type },
                          } : current);
                          setSuccess(copy.messages.avatarUpdated);
                        }
                      } catch {
                        setError(copy.messages.avatarError);
                      } finally {
                        setIsUploadingAvatar(false);
                        event.target.value = '';
                      }
                    }}
                  />
                </label>
              </div>

              {/* Info */}
              <div className="flex-1">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-orange-600 dark:text-orange-300">{copy.summary.overview}</p>
                <h1 className="mb-2 text-2xl font-black tracking-tight text-[var(--foreground)] sm:text-4xl">
                  {profileName}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--muted-foreground)]">
                  <span className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {profile.email}
                  </span>
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700 dark:bg-orange-950/40 dark:text-orange-300">
                    {roleLabels[profile.role] || profile.role}
                  </span>
                </div>

                {profile.requires_approval && (
                  <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      {copy.awaitingApproval}
                    </p>
                  </div>
                )}

              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[var(--muted)]/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">{copy.summary.accountStatus}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold"><span className={`h-2.5 w-2.5 rounded-full ${profile.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />{accountStatus}</p>
                </div>
                <div className="rounded-xl bg-[var(--muted)]/60 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--muted-foreground)]">{copy.summary.security}</p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-emerald-500" />{securityChecks}/2</p>
                </div>
                <div className="col-span-2 flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-3 text-sm">
                  <span className="flex items-center gap-2 text-[var(--muted-foreground)]"><MessageSquare className="h-4 w-4 text-orange-500" />{profile.telegram_chat_id ? securityCopy.telegramConnected : securityCopy.telegramNotConnected}</span>
                  <ArrowUpRight className="h-4 w-4 text-[var(--muted-foreground)]" />
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: copy.summary.accountStatus, value: accountStatus, detail: profile.role, icon: Activity, tone: 'orange' },
              { label: copy.summary.memberSince, value: formatDate(profile.created_at), detail: copy.fields.createdAt, icon: Calendar, tone: 'orange' },
              { label: copy.summary.lastActivity, value: formatDate(profile.last_login_at), detail: copy.fields.lastLogin, icon: Clock, tone: 'orange' },
              { label: copy.summary.security, value: `${securityChecks}/2`, detail: securityChecks === 2 ? copy.summary.protected : copy.summary.needsAttention, icon: ShieldCheck, tone: 'emerald' },
            ].map(({ label, value, detail, icon: Icon, tone }) => (
              <div key={label} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_12px_32px_rgba(21,26,30,0.05)]">
                <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--muted-foreground)]">{label}</p><p className="mt-3 text-xl font-black tracking-tight">{value}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone === 'emerald' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-300'}`}><Icon className="h-5 w-5" /></div></div>
                <p className="mt-3 text-xs text-[var(--muted-foreground)]">{detail}</p>
              </div>
            ))}
          </div>

          {/* Messages */}
          {error && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-300 bg-red-50 p-4 dark:border-red-900/60 dark:bg-red-950/30">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">{success}</p>
            </div>
          )}

          {/* Profile form */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_12px_32px_rgba(21,26,30,0.06)]">
            <div className="p-5 sm:p-7">
              <div className="space-y-4 sm:space-y-6">
                  {/* Profile Form */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {copy.fields.firstName}
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {copy.fields.lastName}
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {copy.fields.displayName}
                      </label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-[var(--foreground)] outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {copy.fields.phone}
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] py-3 pl-10 pr-4 text-[var(--foreground)] outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                    </div>

                  </div>

                  {/* Account Info */}
                  <div className="grid grid-cols-1 gap-3 border-t border-[var(--border)] pt-4 sm:grid-cols-2 sm:gap-4 sm:pt-6">
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">{copy.fields.createdAt}:</span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {formatDate(profile.created_at)}
                        </span>
                      </div>
                    </div>

                    {profile.last_login_at && (
                      <div className="flex items-center gap-3 text-sm">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">{copy.fields.lastLogin}:</span>
                          <span className="ml-2 text-gray-900 dark:text-white">
                            {formatDate(profile.last_login_at)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 font-bold text-white transition-colors hover:bg-orange-600 disabled:bg-gray-400"
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

                  {profile.role === 'customer' && <>
                    <CustomerReservations locale={locale} />
                    <CustomerAddresses locale={locale} />
                  </>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
