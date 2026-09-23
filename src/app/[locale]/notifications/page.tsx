'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, Loader2 } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';

 type Notification = {
  id: string;
  subject: string;
  body: string;
  status: string;
  read_at: string | null;
  created_at: string;
};

const copy = {
  ru: { title: 'Уведомления', empty: 'Новых уведомлений нет', markAll: 'Отметить все прочитанными', read: 'Прочитано', error: 'Не удалось загрузить уведомления' },
  en: { title: 'Notifications', empty: 'No notifications yet', markAll: 'Mark all as read', read: 'Read', error: 'Could not load notifications' },
  kg: { title: 'Билдирүүлөр', empty: 'Билдирүүлөр жок', markAll: 'Баарын окулган деп белгилөө', read: 'Окулду', error: 'Билдирүүлөр жүктөлгөн жок' },
} as const;

export default function NotificationsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const [locale, setLocale] = useState<Locale>('ru');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    void params.then(({ locale: nextLocale }) => setLocale(nextLocale));
  }, [params]);

  useEffect(() => {
    fetch('/api/user/notifications', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('load')))
      .then((data) => setNotifications(data.notifications || []))
      .catch(() => setMessage(copy[locale].error))
      .finally(() => setLoading(false));
  }, [locale]);

  const markRead = async (id: string) => {
    const response = await fetch('/api/user/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    if (response.ok) setNotifications((current) => current.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString(), status: 'read' } : item));
  };

  const markAllRead = async () => {
    const response = await fetch('/api/user/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) });
    if (response.ok) setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString(), status: 'read' })));
  };

  const text = copy[locale];
  return <main className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] px-4 py-8 text-[#151a1e] dark:bg-[#151a1e] dark:text-[#f6f2e9] sm:px-6 sm:py-12"><div className="mx-auto max-w-3xl"><header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-3 text-[11px] font-bold uppercase tracking-[.2em] text-orange-600 dark:text-orange-300">CafeFlow</p><h1 className="text-3xl font-black sm:text-5xl">{text.title}</h1></div>{notifications.some((item) => !item.read_at) && <button type="button" onClick={() => void markAllRead()} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#d06b3c] px-3 text-sm font-semibold text-[#9e4a25]"><Check className="h-4 w-4" />{text.markAll}</button>}</header>{message && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{message}</p>}{loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-orange-600" /></div> : notifications.length === 0 ? <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-gray-900"><Bell className="mx-auto mb-4 h-12 w-12 text-gray-400" /><p className="text-gray-600 dark:text-gray-400">{text.empty}</p></div> : <div className="space-y-3">{notifications.map((item) => <article key={item.id} className={`rounded-2xl border bg-white p-5 shadow-sm dark:bg-gray-900 ${item.read_at ? 'border-transparent' : 'border-orange-300 dark:border-orange-700'}`}><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">{item.subject}</h2><p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-gray-300">{item.body}</p></div>{!item.read_at && <button type="button" onClick={() => void markRead(item.id)} className="shrink-0 rounded-lg p-2 text-orange-700 hover:bg-orange-50 dark:text-orange-300 dark:hover:bg-orange-900/20" aria-label={text.read} title={text.read}><Check className="h-4 w-4" /></button>}</div><time className="mt-3 block text-xs text-gray-500" dateTime={item.created_at}>{new Date(item.created_at).toLocaleString(locale === 'ru' ? 'ru-RU' : locale === 'kg' ? 'ky-KG' : 'en-US')}</time></article>)}</div>}</div></main>;
}
