'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';
import { getLocaleTranslations } from '@/app/i18n/catalog';
import { locales, type Locale } from '@/app/i18n/config';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentLocale = (locales.find((item) => pathname.split('/')[1] === item) || 'ru') as Locale;
  const { auth, common } = getLocaleTranslations(currentLocale);
  const userId = searchParams.get('userId');
  const email = searchParams.get('email');

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (value && index === 5 && newCode.every((digit) => digit !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = pasteData.split('').concat(Array(6 - pasteData.length).fill(''));
    setCode(newCode);
    
    if (pasteData.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerify(pasteData);
    } else {
      inputRefs.current[Math.min(pasteData.length, 5)]?.focus();
    }
  };

  const handleVerify = async (verificationCode: string) => {
    if (!userId) {
      setError(auth.verify.missingUserId);
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || auth.verify.verificationFailed);
        setIsVerifying(false);
        // Clear code on error
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      // Success
      setSuccess(true);
      setTimeout(() => {
        router.push('/profile?verified=true');
      }, 2000);
    } catch {
      setError(auth.verify.errors.serverError);
      setIsVerifying(false);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !userId) return;

    setError('');
    
    try {
      const response = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          setResendCooldown(data.waitSeconds || 60);
          setError(data.error);
        } else {
          setError(data.error || auth.verify.resendFailed);
        }
        return;
      }

      // Success - start cooldown
      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setError(auth.verify.resendFailed);
    }
  };

  if (!userId || !email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700">
          <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{auth.verify.errorTitle}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {auth.verify.errors.missingParams}
          </p>
          <Link
            href={`/${currentLocale}/login`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors min-h-[44px]"
          >
            {auth.verify.errors.goToLogin}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link href={`/${currentLocale}/profile`} className="inline-flex items-center gap-2 font-medium text-gray-800 dark:text-gray-200 hover:text-amber-700 dark:hover:text-amber-400 transition-colors min-h-[44px]">
            <ArrowLeft className="h-4 w-4" />
            {auth.verify.backToProfile}
          </Link>
        </div>

        <div className="text-center mb-8">
          <Image src="/cafeflow-logo.svg" alt={common.auth.brand} width={64} height={64} className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{common.auth.brand}</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-gray-700">
          {success ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{auth.verify.verified}</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {auth.verify.verifiedMessage}
              </p>
              <Loader2 className="w-8 h-8 text-amber-600 dark:text-amber-400 animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{auth.verify.title}</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  {auth.verify.subtitle}
                </p>
                <p className="text-amber-600 dark:text-amber-400 font-medium">{email}</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 text-center">
                  {auth.verify.enterCode}
                </label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { inputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      disabled={isVerifying}
                      className="w-11 sm:w-12 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:border-amber-500 dark:focus:border-amber-400 focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-800 outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400"
                    />
                  ))}
                </div>
              </div>

              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 mb-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">{auth.verify.verifying}</span>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="inline-flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium disabled:text-gray-400 dark:disabled:text-gray-600 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                >
                  <RefreshCw className="w-4 h-4" />
                  {resendCooldown > 0 
                    ? auth.verify.resendCodeIn.replace('{seconds}', String(resendCooldown))
                    : auth.verify.resendCode
                  }
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
                <p>{auth.verify.codeExpires}</p>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© {new Date().getFullYear()} {common.auth.brand}. {common.footer.rights}.</p>
        </div>
      </div>
    </div>
  );
}
