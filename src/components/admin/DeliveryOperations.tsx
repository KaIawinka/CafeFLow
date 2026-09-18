'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Loader2, MapPin, RefreshCw, UserRound } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';

type DeliveryStatus = 'pending' | 'assigned' | 'delivering' | 'delivered' | 'failed';
type Courier = { id: string; first_name: string; last_name: string | null; phone: string | null };
type Delivery = {
  id: string;
  order_id: string;
  status: DeliveryStatus;
  courier_user_id: string | null;
  courier_name: string | null;
  courier_phone: string | null;
  tracking_code: string | null;
  promised_at: string | null;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  retry_count: number;
  address_snapshot: unknown;
  order: { id: string; order_number: string; customer_name: string; customer_phone: string; status: string; total: string | number; currency: string };
  courier: Courier | null;
  zone: { id: string; name: string; estimated_minutes: number | null } | null;
  events: Array<{ from_status: DeliveryStatus | null; to_status: DeliveryStatus; reason: string | null; created_at: string }>;
};

const labels: Record<Locale, Record<string, string>> = {
  ru: { title: 'Доставка', subtitle: 'Очередь курьеров и проблемные доставки', all: 'Все статусы', refresh: 'Обновить', empty: 'Доставок не найдено', courier: 'Курьер', selectCourier: 'Назначить курьера', promisedAt: 'Обещанное время', tracking: 'Трек-номер', reason: 'Причина проблемы', save: 'Сохранить', retry: 'Повторить доставку', address: 'Адрес', order: 'Заказ', customer: 'Клиент', attempts: 'Попытки', loading: 'Загрузка доставок...', error: 'Не удалось обновить доставку', status: 'Статус' },
  en: { title: 'Deliveries', subtitle: 'Courier queue and delivery issues', all: 'All statuses', refresh: 'Refresh', empty: 'No deliveries found', courier: 'Courier', selectCourier: 'Assign courier', promisedAt: 'Promised time', tracking: 'Tracking code', reason: 'Issue reason', save: 'Save', retry: 'Retry delivery', address: 'Address', order: 'Order', customer: 'Customer', attempts: 'Attempts', loading: 'Loading deliveries...', error: 'Unable to update delivery', status: 'Status' },
  kg: { title: 'Жеткирүүлөр', subtitle: 'Курьерлердин кезеги жана көйгөйлүү жеткирүүлөр', all: 'Бардык статустар', refresh: 'Жаңылоо', empty: 'Жеткирүүлөр табылган жок', courier: 'Курьер', selectCourier: 'Курьерди дайындоо', promisedAt: 'Убада кылынган убакыт', tracking: 'Трек номери', reason: 'Маселенин себеби', save: 'Сактоо', retry: 'Кайра жеткирүү', address: 'Дарек', order: 'Заказ', customer: 'Кардар', attempts: 'Аракеттер', loading: 'Жеткирүүлөр жүктөлүүдө...', error: 'Жеткирүүнү жаңыртуу мүмкүн болгон жок', status: 'Статус' },
};

const statusLabels: Record<Locale, Record<DeliveryStatus, string>> = {
  ru: { pending: 'Ожидает', assigned: 'Назначена', delivering: 'В пути', delivered: 'Доставлена', failed: 'Проблема' },
  en: { pending: 'Pending', assigned: 'Assigned', delivering: 'In transit', delivered: 'Delivered', failed: 'Issue' },
  kg: { pending: 'Күтүүдө', assigned: 'Дайындалды', delivering: 'Жолдо', delivered: 'Жеткирилди', failed: 'Көйгөй' },
};
const transitions: Record<DeliveryStatus, DeliveryStatus[]> = { pending: ['pending', 'assigned', 'failed'], assigned: ['assigned', 'delivering', 'failed'], delivering: ['delivering', 'delivered', 'failed'], delivered: ['delivered'], failed: ['failed', 'assigned'] };

function addressText(snapshot: unknown) {
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) return '—';
  const address = snapshot as { addressText?: unknown; tableName?: unknown };
  return typeof address.addressText === 'string' ? address.addressText : typeof address.tableName === 'string' ? address.tableName : '—';
}

function toLocalInput(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16) : '';
}

function DeliveryCard({ delivery, couriers, locale, onUpdated }: { delivery: Delivery; couriers: Courier[]; locale: Locale; onUpdated: (delivery: Delivery) => void }) {
  const t = labels[locale];
  const [status, setStatus] = useState<DeliveryStatus>(delivery.status);
  const [courierUserId, setCourierUserId] = useState(delivery.courier_user_id || '');
  const [promisedAt, setPromisedAt] = useState(toLocalInput(delivery.promised_at));
  const [trackingCode, setTrackingCode] = useState(delivery.tracking_code || '');
  const [reason, setReason] = useState(delivery.failure_reason || '');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState('');

  const save = async (nextStatus = status) => {
    setFeedback('');
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/deliveries/${delivery.order_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, courierUserId: courierUserId || null, promisedAt: promisedAt ? new Date(promisedAt).toISOString() : null, trackingCode: trackingCode || null, reason: reason || undefined }),
      });
      const data = await response.json() as { delivery?: Delivery; error?: string };
      if (!response.ok || !data.delivery) throw new Error(data.error || t.error);
      setStatus(data.delivery.status);
      setReason(data.delivery.failure_reason || '');
      onUpdated({ ...delivery, ...data.delivery });
      setFeedback('OK');
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : t.error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2"><span className="font-black text-gray-900 dark:text-white">{delivery.order.order_number}</span><span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{statusLabels[locale][delivery.status]}</span>{delivery.retry_count > 0 && <span className="text-xs text-amber-700 dark:text-amber-300">{t.attempts}: {delivery.retry_count + 1}</span>}</div>
          <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><UserRound className="h-4 w-4" />{t.customer}: {delivery.order.customer_name} · {delivery.order.customer_phone}</p>
          <p className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{t.address}: {addressText(delivery.address_snapshot)}</p>
          {delivery.events[0] && <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(delivery.events[0].created_at).toLocaleString(locale)} · {statusLabels[locale][delivery.events[0].to_status]}{delivery.events[0].reason ? `: ${delivery.events[0].reason}` : ''}</p>}
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-xl">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.status}<select value={status} onChange={(event) => setStatus(event.target.value as DeliveryStatus)} disabled={isSaving} className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-900 dark:text-white">{transitions[delivery.status].map((value) => <option key={value} value={value}>{statusLabels[locale][value]}</option>)}</select></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.courier}<select value={courierUserId} onChange={(event) => setCourierUserId(event.target.value)} disabled={isSaving || delivery.status === 'delivered'} className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-900 dark:text-white"><option value="">{t.selectCourier}</option>{couriers.map((courier) => <option key={courier.id} value={courier.id}>{[courier.first_name, courier.last_name].filter(Boolean).join(' ')}{courier.phone ? ` · ${courier.phone}` : ''}</option>)}</select></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.promisedAt}<input type="datetime-local" value={promisedAt} onChange={(event) => setPromisedAt(event.target.value)} disabled={isSaving || delivery.status === 'delivered'} className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-900 dark:text-white" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.tracking}<input value={trackingCode} onChange={(event) => setTrackingCode(event.target.value)} disabled={isSaving || delivery.status === 'delivered'} className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 dark:border-gray-600 dark:bg-gray-900 dark:text-white" /></label>
          {status === 'failed' && <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t.reason}<input required value={reason} onChange={(event) => setReason(event.target.value)} disabled={isSaving} className="mt-1 min-h-10 w-full rounded-lg border border-red-200 bg-white px-3 dark:border-red-900 dark:bg-gray-900 dark:text-white" /></label>}
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2"><button type="button" onClick={() => void save()} disabled={isSaving || delivery.status === 'delivered'} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[#17332f] px-4 text-sm font-bold text-white disabled:opacity-50 dark:bg-amber-500 dark:text-gray-950">{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}{t.save}</button>{delivery.status === 'failed' && <button type="button" onClick={() => void save('assigned')} disabled={isSaving || !courierUserId} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-amber-300 px-4 text-sm font-bold text-amber-800 disabled:opacity-50 dark:border-amber-700 dark:text-amber-300"><RefreshCw className="h-4 w-4" />{t.retry}</button>}{feedback && <span role="status" className={`text-sm ${feedback === 'OK' ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-700 dark:text-red-300'}`}>{feedback}</span>}</div>
        </div>
      </div>
    </article>
  );
}

export function DeliveryOperations({ locale }: { locale: Locale }) {
  const t = labels[locale];
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [status, setStatus] = useState<DeliveryStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setError('');
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      const response = await fetch(`/api/admin/deliveries?${params.toString()}`, { cache: 'no-store' });
      const data = await response.json() as { deliveries?: Delivery[]; couriers?: Courier[]; error?: string };
      if (!response.ok) throw new Error(data.error || t.error);
      setDeliveries(data.deliveries || []);
      setCouriers(data.couriers || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.error);
    } finally {
      setIsLoading(false);
    }
  }, [status, t.error]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [load]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-6 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-semibold text-amber-700 dark:text-amber-400">CafeFlow / {locale === 'en' ? 'operations' : locale === 'kg' ? 'иш процесстери' : 'операции'}</p><h1 className="mt-1 text-3xl font-black text-gray-900 dark:text-white">{t.title}</h1><p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{t.subtitle}</p></div><div className="flex gap-2"><select value={status} onChange={(event) => { setIsLoading(true); setStatus(event.target.value as DeliveryStatus | 'all'); }} className="min-h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"><option value="all">{t.all}</option>{(['pending', 'assigned', 'delivering', 'delivered', 'failed'] as DeliveryStatus[]).map((item) => <option key={item} value={item}>{statusLabels[locale][item]}</option>)}</select><button type="button" onClick={() => { setIsLoading(true); void load(); }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200" aria-label={t.refresh} title={t.refresh}><RefreshCw className="h-4 w-4" /></button></div></header>
        {error && <p role="alert" className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300"><AlertCircle className="h-4 w-4" />{error}</p>}
        {isLoading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-amber-600" /></div> : <div className="space-y-3">{deliveries.map((delivery) => <DeliveryCard key={delivery.id} delivery={delivery} couriers={couriers} locale={locale} onUpdated={(updated) => setDeliveries((current) => current.map((item) => item.id === updated.id ? updated : item))} />)}{!deliveries.length && <p className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">{t.empty}</p>}</div>}
      </div>
    </main>
  );
}