'use client';

import { useEffect, useState } from 'react';
import { CalendarClock, Loader2 } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';

type Reservation = {
  id: string;
  guest_name: string;
  guests_count: number;
  start_at: string;
  end_at: string;
  status: string;
  comment: string | null;
};

const copy = {
  ru: { title: 'Мои бронирования', empty: 'Бронирований пока нет', loading: 'Загрузка бронирований…', error: 'Не удалось загрузить бронирования', upcoming: 'Предстоящие', past: 'Прошедшие', cancelled: 'Отменённые', guests: 'гостей' },
  en: { title: 'My reservations', empty: 'No reservations yet', loading: 'Loading reservations…', error: 'Could not load reservations', upcoming: 'Upcoming', past: 'Past', cancelled: 'Cancelled', guests: 'guests' },
  kg: { title: 'Менин брондорум', empty: 'Брондор азырынча жок', loading: 'Брондор жүктөлүүдө…', error: 'Брондорду жүктөө мүмкүн болгон жок', upcoming: 'Алдыдагы', past: 'Өткөн', cancelled: 'Жокко чыгарылган', guests: 'конок' },
} as const;

export function CustomerReservations({ locale }: { locale: Locale }) {
  const text = copy[locale];
  const dateLocale = locale === 'ru' ? 'ru-RU' : locale === 'kg' ? 'ky-KG' : 'en-US';
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    fetch('/api/user/reservations', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('load')))
      .then((data) => setReservations(data.reservations || []))
      .catch(() => setError(text.error))
      .finally(() => setLoading(false));
  }, [text.error]);

  const cancelled = reservations.filter((reservation) => ['cancelled', 'no_show'].includes(reservation.status));
  const upcoming = reservations.filter((reservation) => !cancelled.includes(reservation) && new Date(reservation.start_at).getTime() >= now);
  const past = reservations.filter((reservation) => !cancelled.includes(reservation) && new Date(reservation.start_at).getTime() < now);
  const groups = [[text.upcoming, upcoming], [text.past, past], [text.cancelled, cancelled]] as const;

  return <section className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700"><div className="mb-4 flex items-center gap-2"><CalendarClock className="h-5 w-5 text-orange-600" /><h2 className="text-lg font-semibold text-gray-900 dark:text-white">{text.title}</h2></div>{loading ? <div className="flex min-h-20 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-orange-600" /></div> : error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p> : !reservations.length ? <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">{text.empty}</p> : <div className="space-y-5">{groups.map(([label, items]) => items.length ? <div key={label}><h3 className="mb-2 text-sm font-semibold text-gray-600 dark:text-gray-300">{label}</h3><div className="space-y-2">{items.map((reservation) => <article key={reservation.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-semibold text-gray-900 dark:text-white">{new Date(reservation.start_at).toLocaleString(dateLocale, { dateStyle: 'medium', timeStyle: 'short' })}</p><span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">{reservation.status}</span></div><p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{reservation.guests_count} {text.guests} · {reservation.guest_name}</p>{reservation.comment && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{reservation.comment}</p>}</article>)}</div></div> : null)}</div>}</section>;
}
