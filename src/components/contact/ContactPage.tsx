'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';

export function ContactPage({ locale }: { locale: Locale }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/public/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.error || 'Ошибка при отправке сообщения');
        return;
      }

      setMessage('Спасибо за ваше сообщение! Мы свяжемся с вами в ближайшее время.');
      setForm({ name: '', email: '', phone: '', company: '', message: '' });
    } catch (error) {
      setMessage('Ошибка при отправке сообщения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] text-[#151a1e] dark:bg-[#151a1e] dark:text-[#f6f2e9]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 px-4 py-16 text-white sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-4 text-sm font-bold uppercase tracking-[.2em] opacity-90">
            Контакты
          </p>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">
            Свяжитесь с нами
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-95">
            Мы всегда рады ответить на ваши вопросы и выслушать предложения
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
          {/* Контактная информация */}
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-2xl font-black">Контактная информация</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Телефон</p>
                    <a
                      href="tel:+996555123456"
                      className="text-orange-600 hover:underline dark:text-orange-400"
                    >
                      +996 555 123 456
                    </a>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Ежедневно с 8:00 до 22:00
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Email</p>
                    <a
                      href="mailto:info@cafeflow.kg"
                      className="text-orange-600 hover:underline dark:text-orange-400"
                    >
                      info@cafeflow.kg
                    </a>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Ответим в течение 24 часов
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Адрес главного офиса</p>
                    <p className="text-gray-700 dark:text-gray-300">
                      г. Бишкек, ул. Чуй 123
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      Бизнес-центр «Аврора», 3 этаж
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold">Режим работы</p>
                    <p className="text-gray-700 dark:text-gray-300">
                      Понедельник - Воскресенье
                    </p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                      8:00 - 22:00 (без выходных)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Социальные сети */}
            <div>
              <h3 className="mb-4 text-xl font-black">Мы в социальных сетях</h3>
              <div className="flex gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white transition hover:scale-110"
                  aria-label="Instagram"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white transition hover:scale-110"
                  aria-label="Facebook"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a
                  href="https://t.me/cafeflow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white transition hover:scale-110"
                  aria-label="Telegram"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Форма обратной связи */}
          <div className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-900">
            <h2 className="mb-6 text-2xl font-black">Отправить сообщение</h2>
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-bold">
                  Ваше имя *
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="h-12 w-full rounded-lg border px-4 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Иван Иванов"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-bold">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="h-12 w-full rounded-lg border px-4 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="ivan@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-bold">
                  Телефон
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="h-12 w-full rounded-lg border px-4 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="+996 555 123 456"
                />
              </div>

              <div>
                <label htmlFor="company" className="mb-2 block text-sm font-bold">
                  Компания
                </label>
                <input
                  id="company"
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="h-12 w-full rounded-lg border px-4 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="ООО «Ваша компания»"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-bold">
                  Сообщение *
                </label>
                <textarea
                  id="message"
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="min-h-32 w-full rounded-lg border px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="Расскажите, чем мы можем вам помочь..."
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Отправка...' : 'Отправить сообщение'}
              </button>

              {message && (
                <p className={`text-sm font-semibold ${message.includes('Спасибо') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </p>
              )}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
