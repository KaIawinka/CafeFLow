'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, CheckCircle, AlertCircle, Loader2, ArrowLeft, RefreshCw } from 'lucide-react';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      setError('User ID не найден. Пожалуйста, войдите снова.');
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
        setError(data.error || 'Ошибка верификации');
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
      setError('Произошла ошибка. Попробуйте позже.');
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
          setError(data.error || 'Не удалось отправить код');
        }
        return;
      }

      // Success - start cooldown
      setResendCooldown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch {
      setError('Произошла ошибка при отправке кода');
    }
  };

  if (!userId || !email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ошибка</h2>
          <p className="text-gray-600 mb-6">
            Отсутствуют необходимые параметры. Пожалуйста, войдите в систему заново.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
          >
            Перейти к входу
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-100 via-orange-50 to-red-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-4">
          <Link href="/profile" className="inline-flex items-center gap-2 font-medium text-gray-800 hover:text-amber-700">
            <ArrowLeft className="h-4 w-4" />
            К профилю
          </Link>
        </div>

        <div className="text-center mb-8">
          <Image src="/Logo-CafeFlow.png" alt="CafeFlow" width={64} height={64} className="mx-auto mb-4 h-16 w-16 rounded-2xl object-cover shadow-lg" />
          <h1 className="text-3xl font-bold text-gray-900">CaféFlow</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {success ? (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Email подтверждён!</h2>
              <p className="text-gray-600 mb-6">
                Ваш email успешно подтверждён. Перенаправление...
              </p>
              <Loader2 className="w-8 h-8 text-amber-600 animate-spin mx-auto" />
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Подтвердите email</h2>
                <p className="text-gray-600">
                  Мы отправили код подтверждения на
                </p>
                <p className="text-amber-600 font-medium">{email}</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-700">{error}</div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4 text-center">
                  Введите 6-значный код
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
                      className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none transition-all disabled:bg-gray-100"
                    />
                  ))}
                </div>
              </div>

              {isVerifying && (
                <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Проверка кода...</span>
                </div>
              )}

              <div className="text-center">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0}
                  className="inline-flex items-center gap-2 text-sm text-amber-600 hover:text-amber-700 font-medium disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  {resendCooldown > 0 
                    ? `Отправить повторно через ${resendCooldown}с`
                    : 'Отправить код повторно'
                  }
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
                <p>Код действует 10 минут</p>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-8 text-sm text-gray-600">
          <p>© 2024 CaféFlow. Все права защищены.</p>
        </div>
      </div>
    </div>
  );
}
