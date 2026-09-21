'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, AlertCircle, Loader2, CheckCircle, Phone } from 'lucide-react';
import { RecaptchaProvider } from '@/components/RecaptchaProvider';
import { useRecaptcha } from '@/hooks/useRecaptcha';
import { getLocaleTranslations } from '@/app/i18n/catalog';
import type { Locale } from '@/app/i18n/config';

function RegisterForm() {
  const router = useRouter();
  const pathname = usePathname();
  const { executeRecaptcha, isReady } = useRecaptcha();

  // Get current locale from pathname
  const getCurrentLocale = (): Locale => {
    const segments = pathname.split('/').filter(Boolean);
    const locale = segments[0] as Locale;
    return ['ru', 'en', 'kg'].includes(locale) ? locale : 'ru';
  };

  const currentLocale = getCurrentLocale();
  const { auth, common } = getLocaleTranslations(currentLocale);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Check password strength
    if (name === 'password') {
      if (value.length < 8) {
        setPasswordStrength('weak');
      } else if (value.length < 12) {
        setPasswordStrength('medium');
      } else {
        setPasswordStrength('strong');
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError(auth.register.errors.passwordMismatch);
      return;
    }

    if (formData.password.length < 8) {
      setError(auth.register.errors.passwordTooShort);
      return;
    }

    setIsLoading(true);

    try {
      // Execute reCAPTCHA only if available (production)
      let recaptchaToken: string | null = null;
      if (isReady) {
        try {
          recaptchaToken = await executeRecaptcha('register');
        } catch (err) {
          console.warn('reCAPTCHA failed, continuing without it (dev mode)', err);
          // Continue without token in development
        }
      }

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName || undefined,
          phone: formData.phone || undefined,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || auth.register.errors.serverError);
        setIsLoading(false);
        return;
      }

      router.push(`/${currentLocale}/verify-email?userId=${data.user.id}&email=${encodeURIComponent(data.user.email)}`);
    } catch {
      setError(auth.register.errors.serverError);
      setIsLoading(false);
    }
  };

  const strengthConfig = {
    weak: { color: 'bg-red-500', text: auth.register.weak, width: 'w-1/3' },
    medium: { color: 'bg-yellow-500', text: auth.register.medium, width: 'w-2/3' },
    strong: { color: 'bg-green-500', text: auth.register.strong, width: 'w-full' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/cafeflow-logo.svg" alt={common.auth.brand} width={64} height={64} className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{common.auth.brand}</h1>
          <p className="text-gray-600 mt-2">{common.auth.createAccount}</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 ring-1 ring-black/5">
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{auth.register.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {auth.register.subtitle}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {auth.register.firstName} *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder={auth.register.firstNamePlaceholder}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {auth.register.lastName}
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={auth.register.lastNamePlaceholder}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {auth.register.email} *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={auth.register.emailPlaceholder}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {auth.register.phone}
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={auth.register.phonePlaceholder}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {auth.register.password} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={auth.register.passwordPlaceholder}
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? auth.passwordVisibility.hide : auth.passwordVisibility.show} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-white">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600 dark:text-gray-400">{auth.register.passwordStrength}</span>
                    <span className="text-xs font-medium text-gray-700">
                      {strengthConfig[passwordStrength].text}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strengthConfig[passwordStrength].color} transition-all duration-300 ${strengthConfig[passwordStrength].width}`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {auth.register.confirmPassword} *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder={auth.register.confirmPasswordPlaceholder}
                />
                <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? auth.passwordVisibility.hide : auth.passwordVisibility.show} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-white">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
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
                  {auth.register.registering}
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  {auth.register.registerButton}
                </>
              )}
            </button>

            <div className="text-center text-sm text-gray-600 dark:text-gray-400">
              {auth.register.haveAccount}{' '}
              <Link href={`/${currentLocale}/login`} className="text-amber-600 hover:text-amber-700 font-medium">
                {auth.register.login}
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} {common.auth.brand}. {common.footer.rights}.</p>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <RecaptchaProvider>
      <RegisterForm />
    </RecaptchaProvider>
  );
}
