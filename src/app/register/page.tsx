'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { locales, type Locale } from '@/app/i18n/config';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { Eye, EyeOff, UserPlus, Mail, Lock, User, AlertCircle, Loader2, CheckCircle, Phone, ArrowLeft } from 'lucide-react';
import { RecaptchaProvider } from '@/components/RecaptchaProvider';
import { useRecaptcha } from '@/hooks/useRecaptcha';

function RegisterForm() {
  const router = useRouter();
  const pathname = usePathname();
  const localeFromPath = (pathname.split('/').filter(Boolean)[0] as Locale) || 'ru';
  const currentLocale = locales.includes(localeFromPath) ? localeFromPath : 'ru';
  const { executeRecaptcha, isReady } = useRecaptcha();

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
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 8) {
      setError('Пароль должен быть минимум 8 символов');
      return;
    }

    setIsLoading(true);

    try {
      // Execute reCAPTCHA
      let recaptchaToken: string | null = null;
      if (isReady) {
        recaptchaToken = await executeRecaptcha('register');
        if (!recaptchaToken) {
          setError('Ошибка проверки безопасности. Попробуйте позже.');
          setIsLoading(false);
          return;
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
        setError(data.error || 'Ошибка регистрации');
        setIsLoading(false);
        return;
      }

      // Success - set tokens and redirect to email verification
      if (data.accessToken) {
        document.cookie = `accessToken=${data.accessToken}; path=/; max-age=900`;
        document.cookie = `refreshToken=${data.refreshToken}; path=/; max-age=604800`;
        
        // Redirect to email verification page
        router.push(`/verify-email?userId=${data.user.id}&email=${encodeURIComponent(data.user.email)}`);
      }
    } catch {
      setError('Произошла ошибка. Попробуйте позже.');
      setIsLoading(false);
    }
  };

  const strengthConfig = {
    weak: { color: 'bg-red-500', text: 'Слабый', width: 'w-1/3' },
    medium: { color: 'bg-yellow-500', text: 'Средний', width: 'w-2/3' },
    strong: { color: 'bg-green-500', text: 'Сильный', width: 'w-full' },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4 flex items-center justify-between gap-4">
          <Link href="/ru" className="inline-flex items-center gap-2 font-medium text-gray-800 hover:text-amber-700">
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
          <LanguageSwitcher currentLocale={currentLocale} />
        </div>
        {/* Logo */}
        <div className="text-center mb-8">
          <Image src="/Logo-CafeFlow.png" alt="CafeFlow" width={64} height={64} className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg" />
          <h1 className="text-3xl font-bold text-gray-900">CaféFlow</h1>
          <p className="text-gray-600 mt-2">Создайте аккаунт</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white text-gray-900 rounded-2xl shadow-xl p-8 ring-1 ring-black/5">
          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Регистрация</h2>
              <p className="text-sm text-gray-600">
                Заполните данные для создания аккаунта
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
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  Имя *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                    placeholder="Иван"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Фамилия
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="Иванов"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="your@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Телефон
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="+996 XXX XXX XXX"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Пароль *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="Минимум 8 символов"
                />
                <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && passwordStrength && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-600">Надёжность пароля</span>
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
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Подтвердите пароль *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="w-full pl-11 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all"
                  placeholder="Повторите пароль"
                />
                <button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Скрыть пароль' : 'Показать пароль'} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900">
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
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Создание аккаунта...
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  Зарегистрироваться
                </>
              )}
            </button>

            <div className="text-center text-sm text-gray-600">
              Уже есть аккаунт?{' '}
              <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                Войти
              </Link>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2024 CaféFlow. Все права защищены.</p>
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
