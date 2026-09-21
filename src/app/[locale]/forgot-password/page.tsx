'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle, KeyRound, Loader2, Mail, ShieldAlert } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';
import { getLocaleTranslations } from '@/app/i18n/catalog';

export default function ForgotPasswordPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const [locale, setLocale] = useState<Locale>('ru');

  useEffect(() => {
    let active = true;
    void params.then(({ locale: nextLocale }) => {
      if (active) setLocale(nextLocale);
    });
    return () => {
      active = false;
    };
  }, [params]);

  return (
    <Suspense fallback={null}>
      <ForgotPasswordForm locale={locale} />
    </Suspense>
  );
}

function ForgotPasswordForm({ locale }: { locale: Locale }) {
  const t = getLocaleTranslations(locale).auth.forgotPassword;
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const recoveryMode = searchParams.get('recover2fa') === '1';
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestCode = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.invalid);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recover2fa: recoveryMode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.invalid);

      setMessage(data.devCode ? `${t.sent}: ${data.devCode}` : data.message || (recoveryMode ? t.recoverySent : t.generic));
      setStep('reset');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t.invalid);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirm) {
      setError(t.mismatch);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password, disableTwoFactor: recoveryMode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || t.invalid);

      setMessage(recoveryMode ? t.recoverySuccess : t.success);
      setStep('done');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : t.invalid);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-7 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
            {recoveryMode ? <ShieldAlert className="h-7 w-7" /> : <KeyRound className="h-7 w-7" />}
          </div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            {recoveryMode ? t.recoveryTitle : t.title}
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {recoveryMode ? t.recoverySubtitle : t.subtitle}
          </p>
        </div>

        {recoveryMode && step !== 'done' && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            {t.recoveryWarning}
          </div>
        )}

        {message && (
          <div className="mb-4 flex gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p>}

        {step === 'email' && (
          <form onSubmit={requestCode} className="space-y-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              {t.email}
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 outline-none focus:border-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </label>
            <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t.send}
            </button>
          </form>
        )}

        {step === 'reset' && (
          <form onSubmit={resetPassword} className="space-y-4">
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
              placeholder={t.code}
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 text-center text-xl tracking-[0.4em] outline-none focus:border-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t.password}
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none focus:border-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <input
              required
              minLength={8}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              placeholder={t.confirm}
              className="h-12 w-full rounded-xl border border-gray-300 bg-white px-4 outline-none focus:border-amber-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
            <button disabled={loading} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-amber-600 font-bold text-white hover:bg-amber-700 disabled:opacity-50">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t.reset}
            </button>
          </form>
        )}

        {step === 'done' && (
          <Link href={`/${locale}/login`} className="flex h-12 items-center justify-center rounded-xl bg-amber-600 font-bold text-white">
            {t.back}
          </Link>
        )}

        <Link href={`/${locale}/login`} className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-amber-700 hover:underline dark:text-amber-400">
          <ArrowLeft className="h-4 w-4" />
          {t.back}
        </Link>
      </section>
    </main>
  );
}