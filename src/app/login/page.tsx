'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { RecaptchaProvider } from '@/components/RecaptchaProvider';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { getLocaleTranslations } from '@/app/i18n/catalog';
import type { Locale } from '@/app/i18n/config';

export default function LoginPage() {
  return (
    <RecaptchaProvider>
      <Suspense fallback={null}>
        <LoginContent />
      </Suspense>
    </RecaptchaProvider>
  );
}

function LoginContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  const { executeRecaptcha, isReady } = useRecaptcha();

  // Get current locale from pathname
  const getCurrentLocale = (): Locale => {
    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0] as Locale;
    return ['ru', 'en', 'kg'].includes(locale) ? locale : 'ru';
  };

  const currentLocale = getCurrentLocale();
  const { auth, common } = getLocaleTranslations(currentLocale);
  const googleError = searchParams.get('error');
  const google2FAEmail = searchParams.get('email') || '';
  const google2FASession = searchParams.get('tempSessionId') || '';
  const isGoogle2FA = googleError === 'google_2fa_required' && Boolean(google2FAEmail && google2FASession);
  const googleErrorMessage = googleError && auth.login.google.errors[googleError as keyof typeof auth.login.google.errors];

  const navigateAfterLogin = (target: string) => {
    const localizedTarget = target.startsWith(`/${currentLocale}`)
      ? target
      : target === '/'
        ? `/${currentLocale}`
        : `/${currentLocale}${target}`;
    window.location.assign(localizedTarget);
  };

  const [email, setEmail] = useState(google2FAEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code2FA, setCode2FA] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(googleErrorMessage || '');
  const [requires2FA, setRequires2FA] = useState(isGoogle2FA);
  const [tempSessionId, setTempSessionId] = useState(google2FASession);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Execute reCAPTCHA only if available (production)
      let recaptchaToken: string | null = null;
      if (isReady) {
        try {
          recaptchaToken = await executeRecaptcha('login');
        } catch (err) {
          console.warn('reCAPTCHA failed, continuing without it (dev mode)', err);
          // Continue without token in development
        }
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, recaptchaToken }),
      });

      const data = await response.json();

      if (data.requiresEmailVerification && data.userId && data.email) {
        router.push(
          `/${currentLocale}/verify-email?userId=${encodeURIComponent(data.userId)}&email=${encodeURIComponent(data.email)}`
        );
        return;
      }

      if (!response.ok) {
        setError(data.error || auth.login.errors.serverError);
        setIsLoading(false);
        return;
      }

      // Check if 2FA is required
      if (data.requires2FA) {
        setRequires2FA(true);
        setTempSessionId(data.tempSessionId);
        setIsLoading(false);
        return;
      }

      // The server sets httpOnly auth cookies; the client only handles navigation.
      if (data.success) {
        // Redirect based on role
        const user = data.user;
        if (user.requiresApproval) {
          navigateAfterLogin(`/${currentLocale}/profile?message=awaiting_approval`);
        } else if (user.role === 'admin' || user.role === 'manager') {
          navigateAfterLogin(`/${currentLocale}/admin`);
        } else if (user.role === 'kitchen') {
          navigateAfterLogin(`/${currentLocale}/kitchen`);
        } else {
          navigateAfterLogin(redirectTo);
        }
      }
    } catch {
      setError(auth.login.errors.serverError);
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          tempSessionId,
          code: code2FA,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || auth.login.errors.invalidCode);
        setIsLoading(false);
        return;
      }

      // The server sets httpOnly auth cookies; the client only handles navigation.
      if (data.success) {
        const user = data.user;
        if (user.role === 'admin' || user.role === 'manager') {
          navigateAfterLogin(`/${currentLocale}/admin`);
        } else if (user.role === 'kitchen') {
          navigateAfterLogin(`/${currentLocale}/kitchen`);
        } else {
          navigateAfterLogin(redirectTo);
        }
      }
    } catch {
      setError(auth.login.errors.serverError);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/cafeflow-logo.svg" alt={common.auth.brand} width={64} height={64} className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">{common.auth.brand}</h1>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            {requires2FA ? common.auth.twoFaConfirmation : common.auth.welcome}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          {!requires2FA ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{auth.login.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                  {auth.login.subtitle}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {auth.login.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={auth.login.emailPlaceholder}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {auth.login.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={auth.login.passwordPlaceholder}
                  />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? auth.passwordVisibility.hide : auth.passwordVisibility.show} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-white">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-2 text-right">
                  <Link href={`/${currentLocale}/forgot-password`} className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400">
                    {auth.login.forgotPassword}
                  </Link>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {auth.login.loggingIn}
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    {auth.login.loginButton}
                  </>
                )}
              </button>

              <div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
                <span>{auth.login.google.or}</span>
                <span className="h-px flex-1 bg-gray-200 dark:bg-gray-700" />
              </div>

              <Link
                href={`/api/auth/google?locale=${currentLocale}&redirect=${encodeURIComponent(redirectTo)}`}
                className="group relative flex min-h-12 w-full items-center justify-center overflow-hidden rounded-[4px] border border-[#dadce0] bg-white px-4 text-[15px] font-medium text-[#3c4043] shadow-[0_1px_2px_rgba(60,64,67,0.3)] transition-colors hover:border-[#4285f4] hover:bg-[#4285f4] hover:text-white hover:shadow-[0_1px_3px_rgba(66,133,244,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4285f4] focus-visible:ring-offset-2 dark:border-[#dadce0] dark:bg-white dark:text-[#3c4043] dark:hover:bg-[#4285f4] dark:hover:text-white"
              >
                <span aria-hidden="true" className="absolute left-0 top-0 flex h-full w-16 items-center justify-center bg-white transition-colors group-hover:bg-white">
                  <svg viewBox="0 0 48 48" className="h-6 w-6" role="img">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.72 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.61 0 6.51 5.38 2.56 13.22l7.98 6.2C12.43 13.25 17.69 9.5 24 9.5Z" />
                    <path fill="#4285F4" d="M46.5 24.55c0-1.64-.15-3.22-.43-4.74H24v9h12.63c-.54 2.88-2.16 5.32-4.61 6.96l7.19 5.58C43.4 37.27 46.5 31.55 46.5 24.55Z" />
                    <path fill="#FBBC05" d="M10.54 28.98A14.47 14.47 0 0 1 9.5 24c0-1.73.37-3.4 1.04-4.98l-7.98-6.2A24 24 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.98-5.8Z" />
                    <path fill="#34A853" d="M24 48c6.47 0 11.9-2.14 15.87-5.83l-7.19-5.58c-1.99 1.33-4.53 2.11-8.68 2.11-6.31 0-11.57-3.75-13.46-9.92l-7.98 5.8C6.51 42.62 14.61 48 24 48Z" />
                  </svg>
                </span>
                {auth.login.google.button}
              </Link>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {auth.login.noAccount}{' '}
                <Link href={`/${currentLocale}/register`} className="text-amber-600 hover:text-amber-700 font-medium">
                  {auth.login.register}
                </Link>
              </div>
            </form>
          ) : (
            // 2FA Form
            <form onSubmit={handleVerify2FA} className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {auth.login.twoFa.title}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {auth.login.twoFa.subtitle}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {auth.login.twoFa.codeLabel}
                </label>
                <input
                  id="code"
                  type="text"
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-center text-2xl font-mono tracking-widest"
                  placeholder={auth.login.twoFa.codePlaceholder}
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {auth.login.twoFa.codeHint}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {auth.login.twoFa.verifying}
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    {auth.login.twoFa.verifyButton}
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setRequires2FA(false);
                  setCode2FA('');
                  setError('');
                }}
                className="w-full text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                {auth.login.twoFa.back}
              </button>

              <Link
                href={`/${currentLocale}/forgot-password?recover2fa=1`}
                className="block text-center text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400"
              >
                {auth.login.twoFa.recoverAccess}
              </Link>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} {common.auth.brand}. {common.footer.rights}.</p>
        </div>
      </div>
    </div>
  );
}
