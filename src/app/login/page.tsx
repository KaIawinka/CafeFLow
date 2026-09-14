'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, LogIn, Mail, Lock, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { RecaptchaProvider } from '@/components/RecaptchaProvider';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { getTranslation, type Locale } from '@/lib/translations';

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
  const t = getTranslation(currentLocale);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code2FA, setCode2FA] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [requires2FA, setRequires2FA] = useState(false);
  const [tempSessionId, setTempSessionId] = useState('');

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

      if (!response.ok) {
        setError(data.error || t.login.errors.serverError);
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

      // Success - set tokens and redirect
      if (data.accessToken) {
        document.cookie = `accessToken=${data.accessToken}; path=/; max-age=900`; // 15 min
        document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=604800`; // 7 days
        
        // Redirect based on role
        const user = data.user;
        if (user.requiresApproval) {
          router.push('/profile?message=awaiting_approval');
        } else if (user.role === 'admin' || user.role === 'manager') {
          router.push('/admin');
        } else if (user.role === 'kitchen') {
          router.push('/kitchen');
        } else {
          router.push(redirectTo);
        }
      }
    } catch {
      setError(t.login.errors.serverError);
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
          tempSessionId,
          code: code2FA,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || t.login.errors.invalidCode);
        setIsLoading(false);
        return;
      }

      // Success - set tokens and redirect
      if (data.accessToken) {
        document.cookie = `accessToken=${data.accessToken}; path=/; max-age=900`;
        document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=604800`;
        
        const user = data.user;
        if (user.role === 'admin' || user.role === 'manager') {
          router.push('/admin');
        } else if (user.role === 'kitchen') {
          router.push('/kitchen');
        } else {
          router.push(redirectTo);
        }
      }
    } catch {
      setError(t.login.errors.serverError);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/Logo-CafeFlow.png" alt="CafeFlow" width={64} height={64} className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg" />
          <h1 className="text-3xl font-bold text-gray-900">{t.common.cafeflow}</h1>
          <p className="text-gray-600 mt-2">
            {requires2FA ? t.common.twoFaConfirmation : t.common.welcome}
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white text-gray-900 rounded-2xl shadow-xl p-8 ring-1 ring-black/5">
          {!requires2FA ? (
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.login.title}</h2>
                <p className="text-sm text-gray-600">
                  {t.login.subtitle}
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.login.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    placeholder={t.login.emailPlaceholder}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  {t.login.password}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    placeholder={t.login.passwordPlaceholder}
                  />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t.login.loggingIn}
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    {t.login.loginButton}
                  </>
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                {t.login.noAccount}{' '}
                <Link href="/register" className="text-amber-600 hover:text-amber-700 font-medium">
                  {t.login.register}
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
                  Подтверждение входа
                </h2>
                <p className="text-sm text-gray-600">
                  Код отправлен в ваш Telegram бот
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
                  Код подтверждения
                </label>
                <input
                  id="code"
                  type="text"
                  value={code2FA}
                  onChange={(e) => setCode2FA(e.target.value)}
                  required
                  maxLength={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all text-center text-2xl font-mono tracking-widest"
                  placeholder="000000"
                  autoComplete="off"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Код действителен 5 минут
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5" />
                    Подтвердить
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
                ← Назад к входу
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2024 CaféFlow. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}
