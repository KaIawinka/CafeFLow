'use client';

import { useEffect, useState } from 'react';
import { Loader2, MessageSquare, Star } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';

type Review = { id: string; rating: number; text: string | null; status: string; admin_reply: string | null; created_at: string; product: { name: string } | null };

const copy = {
  ru: { title: 'Мои отзывы', empty: 'Вы ещё не оставляли отзывов', error: 'Не удалось загрузить отзывы', pending: 'На модерации', published: 'Опубликован', rejected: 'Отклонён' },
  en: { title: 'My reviews', empty: 'You have not written any reviews yet', error: 'Could not load reviews', pending: 'Pending moderation', published: 'Published', rejected: 'Rejected' },
  kg: { title: 'Менин пикирлерим', empty: 'Сиз азырынча пикир калтырган жоксуз', error: 'Пикирлер жүктөлгөн жок', pending: 'Модерацияда', published: 'Жарыяланган', rejected: 'Четке кагылган' },
} as const;

export function CustomerReviews({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const dateLocale = locale === 'ru' ? 'ru-RU' : locale === 'kg' ? 'ky-KG' : 'en-US';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/user/reviews', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('load')))
      .then((data) => setReviews(data.reviews || []))
      .catch(() => setError(text.error))
      .finally(() => setLoading(false));
  }, [text.error]);

  const statusLabel = (status: string) => status === 'published' ? text.published : status === 'rejected' ? text.rejected : text.pending;
  return <section className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700"><div className="mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-orange-600" /><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{text.title}</h2></div>{loading ? <div className="flex min-h-20 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-orange-600" /></div> : error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p> : !reviews.length ? <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">{text.empty}</p> : <div className="space-y-3">{reviews.map((review) => <article key={review.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-1" aria-label={`${review.rating}/5`}><Star className="h-4 w-4 fill-orange-500 text-orange-500" /><span className="text-sm font-bold">{review.rating}/5</span>{review.product && <span className="ml-2 text-sm text-gray-500">{review.product.name}</span>}</div><span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">{statusLabel(review.status)}</span></div>{review.text && <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{review.text}</p>}{review.admin_reply && <p className="mt-2 border-l-2 border-orange-500 pl-3 text-sm text-gray-600 dark:text-gray-300">{review.admin_reply}</p>}<time className="mt-3 block text-xs text-gray-500" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString(dateLocale)}</time></article>)}</div>}</section>;
}