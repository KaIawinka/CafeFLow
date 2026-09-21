'use client';

/**
 * Admin Login Form Component
 * Two-step authentication: Email/Password → 2FA Code
 */

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { locales, type Locale } from '@/app/i18n/config';
import { getLocaleTranslations } from '@/app/i18n/catalog';

type Step = 'credentials' | '2fa';

export default function AdminLoginForm() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = (locales.find((item) => pathname.split('/')[1] === item) || 'ru') as Locale;
  const translations = getLocaleTranslations(locale).admin;
  const copy = {
    email: translations.login.email,
    emailPlaceholder: translations.login.emailPlaceholder,
    signIn: translations.login.loginButton,
    verify: translations.twoFa.verifyButton,
    password: translations.login.password,
    passwordPlaceholder: translations.login.passwordPlaceholder,
    loginSubtitle: translations.login.subtitle,
    verifySubtitle: translations.twoFa.title,
    codeSent: translations.twoFa.subtitle,
    codeLabel: translations.twoFa.code,
    codeHint: translations.twoFa.codeHint,
    codePlaceholder: translations.twoFa.codePlaceholder,
    back: translations.twoFa.backButton,
    loading: translations.login.loggingIn,
    checking: translations.twoFa.verifying,
    invalidCode: translations.twoFa.errors.invalid,
    loginError: translations.login.errors.login,
    connectionError: translations.login.errors.serverError,
  };
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Login with email/password
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || copy.loginError);
        setLoading(false);
        return;
      }

      // If 2FA required, move to step 2
      if (data.requires2FA) {
        setStep('2fa');
      } else {
        // No 2FA - redirect to dashboard
        router.push('/admin/dashboard');
        router.refresh();
      }
    } catch {
      setError(copy.connectionError);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify 2FA code
  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || copy.invalidCode);
        setLoading(false);
        return;
      }

      // Success - redirect to dashboard
      router.push('/admin/dashboard');
      router.refresh();
    } catch {
      setError(copy.connectionError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 rounded-2xl p-8 shadow-2xl">
      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">CaféFlow Admin</h1>
        <p className="text-zinc-400">
          {step === 'credentials' ? copy.loginSubtitle : copy.verifySubtitle}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Step 1: Email/Password */}
      {step === 'credentials' && (
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              {copy.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={copy.emailPlaceholder}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
              {copy.password}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={copy.passwordPlaceholder}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? copy.loading : copy.signIn}
          </button>
        </form>
      )}

      {/* Step 2: 2FA Code */}
      {step === '2fa' && (
        <form onSubmit={handleVerify2FA} className="space-y-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mb-4">
              <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-zinc-400 text-sm">
              {copy.codeSent}
            </p>
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-zinc-300 mb-2">
              {copy.codeLabel}
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
              maxLength={6}
              className="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-white text-center text-2xl tracking-widest placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder={copy.codePlaceholder}
              disabled={loading}
              autoComplete="off"
            />
            <p className="text-zinc-500 text-xs mt-2">{copy.codeHint}</p>
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? copy.checking : copy.verify}
          </button>

          <button
            type="button"
            onClick={() => {
              setStep('credentials');
              setCode('');
              setError('');
            }}
            className="w-full py-2 text-zinc-400 hover:text-white text-sm transition-colors"
          >
            {copy.back}
          </button>
        </form>
      )}
    </div>
  );
}
