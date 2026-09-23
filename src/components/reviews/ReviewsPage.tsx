'use client';

import { useEffect, useState } from 'react';
import { Star, MessageSquare, Clock } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';
import { getLocaleTranslations } from '@/app/i18n/catalog';

type Review = {
  id: string;
  rating: number;
  text: string | null;
  admin_reply: string | null;
  created_at: string;
  user: {
    first_name: string;
    last_name: string | null;
  } | null;
  product: {
    id: string;
    name: string;
  } | null;
};

type Stats = {
  average: number;
  total: number;
  distribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
};

function publicPath(path: string) {
  if (typeof window === 'undefined') return path;
  const branch = new URLSearchParams(window.location.search).get('branch');
  return branch ? `${path}${path.includes('?') ? '&' : '?'}branch=${encodeURIComponent(branch)}` : path;
}

export function ReviewsPage({ locale }: { locale: Locale }) {
  const t = getLocaleTranslations(locale);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rating: 5, text: '', productId: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(publicPath('/api/public/reviews'))
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setStats(data.stats || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const submitReview = async () => {
    if (!form.rating || form.rating < 1 || form.rating > 5) {
      setMessage('Выберите оценку от 1 до 5');
      return;
    }

    const response = await fetch(publicPath('/api/public/reviews'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });

    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || 'Ошибка при отправке отзыва');
      return;
    }

    setMessage('Спасибо за отзыв! Он будет опубликован после модерации.');
    setForm({ rating: 5, text: '', productId: '' });
    setShowForm(false);
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] px-4 py-8 text-[#151a1e] dark:bg-[#151a1e] dark:text-[#f6f2e9]">
        <div className="mx-auto max-w-4xl">
          <p className="text-center">Загрузка...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] px-4 py-8 pb-28 text-[#151a1e] dark:bg-[#151a1e] dark:text-[#f6f2e9] sm:px-6 sm:py-12 sm:pb-10">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[.2em] text-orange-600 dark:text-orange-300">
            Отзывы
          </p>
          <h1 className="text-3xl font-black sm:text-5xl">Отзывы наших гостей</h1>
          <p className="mt-3 text-sm text-[#687078] dark:text-[#a7b0b4]">
            Мы ценим ваше мнение и стараемся становиться лучше
          </p>
        </header>

        {stats && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="flex items-center gap-6">
              <div>
                <div className="text-5xl font-black text-orange-600">{stats.average}</div>
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= Math.round(stats.average) ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {stats.total} {stats.total === 1 ? 'отзыв' : stats.total < 5 ? 'отзыва' : 'отзывов'}
                </p>
              </div>
              <div className="flex-1 space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = stats.distribution[rating as keyof typeof stats.distribution];
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3 text-sm">
                      <span className="w-3">{rating}</span>
                      <Star className="h-4 w-4 fill-orange-500 text-orange-500" />
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                          className="h-full bg-orange-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-gray-600 dark:text-gray-400">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 flex justify-end">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="inline-flex min-h-11 items-center gap-2 rounded-md bg-orange-500 px-5 font-bold text-white transition hover:bg-orange-600"
          >
            <MessageSquare className="h-4 w-4" />
            {showForm ? 'Отменить' : 'Оставить отзыв'}
          </button>
        </div>

        {showForm && (
          <div className="mb-8 rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900">
            <h2 className="mb-4 text-xl font-black">Новый отзыв</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-bold">Оценка</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setForm({ ...form, rating })}
                      className="transition hover:scale-110"
                    >
                      <Star
                        className={`h-8 w-8 ${rating <= form.rating ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="review-text" className="mb-2 block text-sm font-bold">
                  Ваш отзыв
                </label>
                <textarea
                  id="review-text"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  placeholder="Поделитесь впечатлениями..."
                  className="min-h-32 w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                  maxLength={1000}
                />
              </div>
              <button
                type="button"
                onClick={() => void submitReview()}
                className="min-h-11 w-full rounded-xl bg-orange-500 font-bold text-white hover:bg-orange-600"
              >
                Отправить отзыв
              </button>
              {message && (
                <p className="text-sm font-semibold text-orange-600">{message}</p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-gray-900">
              <MessageSquare className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">
                Пока нет отзывов. Будьте первым!
              </p>
            </div>
          ) : (
            reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${star <= review.rating ? 'fill-orange-500 text-orange-500' : 'text-gray-300'}`}
                          />
                        ))}
                      </div>
                      {review.user && (
                        <span className="font-bold">
                          {review.user.first_name}{' '}
                          {review.user.last_name ? review.user.last_name[0] + '.' : ''}
                        </span>
                      )}
                    </div>
                    {review.product && (
                      <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                        {review.product.name}
                      </p>
                    )}
                    {review.text && (
                      <p className="mb-3 leading-relaxed text-gray-700 dark:text-gray-300">
                        {review.text}
                      </p>
                    )}
                    {review.admin_reply && (
                      <div className="mt-4 rounded-lg border-l-4 border-orange-500 bg-orange-50 p-4 dark:bg-gray-800">
                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-orange-600">
                          Ответ администрации
                        </p>
                        <p className="text-sm leading-relaxed">{review.admin_reply}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(review.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
