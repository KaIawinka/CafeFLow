'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { CheckCircle2, Loader2, MapPin, Minus, Plus, ReceiptText, ShoppingBag, Table2, Ticket, Truck } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';

type CartItem = {
  product: { id: string; name: string; price: string | number; currency: string };
  quantity: number;
};

type Address = { id: string; label: string | null; address_text: string; is_default: boolean };
type DeliveryZone = { id: string; name: string; delivery_fee: string | number; min_order_amount: string | number; estimated_minutes: number | null };
type Table = { id: string; name: string; zone: string | null; capacity: number };

const copy: Record<Locale, Record<string, string>> = {
  ru: { title: 'Оформление заказа', contact: 'Контакты', name: 'Ваше имя', phone: 'Телефон', delivery: 'Доставка', pickup: 'Самовывоз', dineIn: 'В заведении', address: 'Адрес доставки', savedAddress: 'Сохранённый адрес', manualAddress: 'Другой адрес', zone: 'Зона доставки', table: 'Столик', selectZone: 'Выберите зону', selectTable: 'Выберите столик', promo: 'Промокод', comment: 'Комментарий к заказу', total: 'Итого', deliveryFee: 'Доставка', placeOrder: 'Оформить заказ', loading: 'Загружаем варианты доставки...', unavailable: 'Нет доступных зон доставки', success: 'Заказ создан', error: 'Не удалось оформить заказ', empty: 'Корзина пуста', saveAddress: 'Управлять адресами', estimated: 'Ориентировочно', minute: 'мин.' },
  en: { title: 'Checkout', contact: 'Contact details', name: 'Your name', phone: 'Phone', delivery: 'Delivery', pickup: 'Pickup', dineIn: 'Dine in', address: 'Delivery address', savedAddress: 'Saved address', manualAddress: 'Another address', zone: 'Delivery zone', table: 'Table', selectZone: 'Select a zone', selectTable: 'Select a table', promo: 'Promo code', comment: 'Order note', total: 'Total', deliveryFee: 'Delivery', placeOrder: 'Place order', loading: 'Loading delivery options...', unavailable: 'No delivery zones available', success: 'Order created', error: 'Unable to place order', empty: 'Your cart is empty', saveAddress: 'Manage addresses', estimated: 'Estimated', minute: 'min.' },
  kg: { title: 'Заказды тариздөө', contact: 'Байланыш маалыматтары', name: 'Атыңыз', phone: 'Телефон', delivery: 'Жеткирүү', pickup: 'Алып кетүү', dineIn: 'Кафеде', address: 'Жеткирүү дареги', savedAddress: 'Сакталган дарек', manualAddress: 'Башка дарек', zone: 'Жеткирүү аймагы', table: 'Стол', selectZone: 'Аймакты тандаңыз', selectTable: 'Столду тандаңыз', promo: 'Промокод', comment: 'Заказга комментарий', total: 'Жалпы', deliveryFee: 'Жеткирүү', placeOrder: 'Заказ берүү', loading: 'Жеткирүү варианттары жүктөлүүдө...', unavailable: 'Жеткирүү аймактары жок', success: 'Заказ түзүлдү', error: 'Заказды тариздөө мүмкүн болгон жок', empty: 'Себет бош', saveAddress: 'Даректерди башкаруу', estimated: 'Болжолдуу', minute: 'мүн.' },
};

function publicPath(path: string) {
  if (typeof window === 'undefined') return path;
  const branch = new URLSearchParams(window.location.search).get('branch');
  return branch ? `${path}${path.includes('?') ? '&' : '?'}branch=${encodeURIComponent(branch)}` : path;
}

function money(value: string | number, currency = 'KGS') {
  return `${Number(value).toLocaleString('ru-RU')} ${currency === 'KGS' ? 'сом' : currency}`;
}

export function CustomerCheckout({ items, locale, onQuantityChange, onComplete }: {
  items: CartItem[];
  locale: Locale;
  onQuantityChange: (productId: string, quantity: number) => void;
  onComplete: () => void;
}) {
  const t = copy[locale];
  const [form, setForm] = useState({ name: '', phone: '', fulfillmentType: 'pickup', paymentMethod: 'cash', tableId: '', addressId: '', addressText: '', zoneId: '', promoCode: '', comment: '' });
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadOptions = useEffectEvent(async () => {
    try {
      const [addressResponse, zoneResponse, tableResponse] = await Promise.all([
        fetch('/api/user/addresses', { cache: 'no-store' }),
        fetch(publicPath('/api/public/delivery-zones'), { cache: 'no-store' }),
        fetch(publicPath('/api/public/tables'), { cache: 'no-store' }),
      ]);
      const addressData = addressResponse.ok ? await addressResponse.json() as { addresses?: Address[] } : { addresses: [] };
      const zoneData = zoneResponse.ok ? await zoneResponse.json() as { zones?: DeliveryZone[] } : { zones: [] };
      const tableData = tableResponse.ok ? await tableResponse.json() as { tables?: Table[] } : { tables: [] };
      const nextAddresses = addressData.addresses || [];
      setAddresses(nextAddresses);
      setZones(zoneData.zones || []);
      setTables(tableData.tables || []);
      const defaultAddress = nextAddresses.find((address) => address.is_default);
      if (defaultAddress) setForm((current) => current.addressId ? current : { ...current, addressId: defaultAddress.id });
    } catch {
      setMessage(t.error);
    } finally {
      setIsLoadingOptions(false);
    }
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadOptions(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const selectedZone = zones.find((zone) => zone.id === form.zoneId);
  const subtotal = items.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const estimatedTotal = subtotal + (selectedZone ? Number(selectedZone.delivery_fee) : 0);

  const submit = async () => {
    if (!items.length || isSubmitting) return;
    setMessage('');
    setIsSubmitting(true);
    try {
      const response = await fetch(publicPath('/api/public/orders'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          customerPhone: form.phone,
          fulfillmentType: form.fulfillmentType,
          paymentMethod: form.paymentMethod,
          tableId: form.tableId || undefined,
          addressId: form.addressId || undefined,
          deliveryAddress: form.addressId ? undefined : form.addressText ? { addressText: form.addressText } : undefined,
          zoneId: form.zoneId || undefined,
          promoCode: form.promoCode || undefined,
          comment: form.comment || undefined,
        }),
      });
      const data = await response.json() as { order?: { order_number: string }; error?: string };
      if (!response.ok || !data.order) throw new Error(data.error || t.error);
      onComplete();
      setMessage(`${t.success}: ${data.order.order_number}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(340px,.8fr)]">
      <section className="space-y-3">
        {items.map((item) => (
          <article key={item.product.id} className="flex items-center gap-3 rounded-lg border border-[#dde4dc] bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="min-w-0 flex-1"><h2 className="font-semibold">{item.product.name}</h2><p className="mt-1 text-sm text-[#60706b]">{money(item.product.price, item.product.currency)}</p></div>
            <button type="button" onClick={() => onQuantityChange(item.product.id, item.quantity - 1)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800" aria-label="Remove item"><Minus className="h-4 w-4" /></button>
            <span className="w-6 text-center font-bold">{item.quantity}</span>
            <button type="button" onClick={() => onQuantityChange(item.product.id, item.quantity + 1)} className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800" aria-label="Add item"><Plus className="h-4 w-4" /></button>
          </article>
        ))}
        {!items.length && <p className="rounded-lg border border-dashed border-[#d9dfd8] p-6 text-center text-sm text-[#60706b] dark:border-gray-700">{t.empty}</p>}
      </section>

      <section className="h-fit space-y-4 rounded-lg border border-[#dde4dc] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-2"><ReceiptText className="h-5 w-5 text-[#d06b3c]" /><h2 className="text-xl font-black">{t.title}</h2></div>
        <fieldset className="grid grid-cols-3 gap-2"><legend className="sr-only">Fulfillment</legend>{[
          ['pickup', t.pickup, ShoppingBag], ['delivery', t.delivery, Truck], ['dine_in', t.dineIn, Table2],
        ].map(([value, label, Icon]) => <button key={value as string} type="button" onClick={() => setForm({ ...form, fulfillmentType: value as string, tableId: '', zoneId: '' })} className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-lg border text-xs font-semibold ${form.fulfillmentType === value ? 'border-[#d06b3c] bg-[#fff1e9] text-[#9e4a25] dark:border-amber-500 dark:bg-amber-900/20 dark:text-amber-300' : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'}`}><Icon className="h-4 w-4" />{label as string}</button>)}</fieldset>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">{t.name}<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" /></label>
          <label className="text-sm font-medium">{t.phone}<input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" /></label>
        </div>
        {isLoadingOptions && <p className="flex items-center gap-2 text-sm text-[#60706b]"><Loader2 className="h-4 w-4 animate-spin" />{t.loading}</p>}
        {form.fulfillmentType === 'delivery' && <div className="space-y-3 rounded-lg bg-[#f8f7f2] p-3 dark:bg-gray-800/60">
          <label className="block text-sm font-medium"><span className="flex items-center gap-2"><MapPin className="h-4 w-4" />{t.savedAddress}</span><select value={form.addressId} onChange={(event) => setForm({ ...form, addressId: event.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"><option value="">{t.manualAddress}</option>{addresses.map((address) => <option key={address.id} value={address.id}>{address.label || t.address}: {address.address_text}</option>)}</select></label>
          {!form.addressId && <label className="block text-sm font-medium">{t.address}<input required value={form.addressText} onChange={(event) => setForm({ ...form, addressText: event.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900" /></label>}
          <a href={`/${locale}/profile`} className="text-sm font-semibold text-[#9e4a25] underline underline-offset-4 dark:text-amber-300">{t.saveAddress}</a>
          <label className="block text-sm font-medium">{t.zone}<select required value={form.zoneId} onChange={(event) => setForm({ ...form, zoneId: event.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"><option value="">{t.selectZone}</option>{zones.map((zone) => <option key={zone.id} value={zone.id}>{zone.name} · {money(zone.delivery_fee)}</option>)}</select></label>
          {!zones.length && !isLoadingOptions && <p className="text-sm text-red-700 dark:text-red-300">{t.unavailable}</p>}
          {selectedZone?.estimated_minutes && <p className="text-xs text-[#60706b]">{t.estimated}: {selectedZone.estimated_minutes} {t.minute}</p>}
        </div>}
        {form.fulfillmentType === 'dine_in' && <label className="block text-sm font-medium">{t.table}<select required value={form.tableId} onChange={(event) => setForm({ ...form, tableId: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800"><option value="">{t.selectTable}</option>{tables.map((table) => <option key={table.id} value={table.id}>{table.name}{table.zone ? ` · ${table.zone}` : ''}</option>)}</select></label>}
        <label className="block text-sm font-medium"><span className="flex items-center gap-2"><Ticket className="h-4 w-4" />{t.promo}</span><input value={form.promoCode} onChange={(event) => setForm({ ...form, promoCode: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" /></label>
        <label className="block text-sm font-medium">{t.comment}<textarea value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-gray-700 dark:bg-gray-800" /></label>
        <div className="space-y-1 border-t border-gray-200 pt-3 text-sm dark:border-gray-700"><div className="flex justify-between"><span>{t.deliveryFee}</span><span>{selectedZone ? money(selectedZone.delivery_fee) : money(0)}</span></div><div className="flex justify-between text-lg font-black"><span>{t.total}</span><span>{money(estimatedTotal, items[0]?.product.currency)}</span></div></div>
        <button type="button" disabled={isSubmitting || !items.length} onClick={() => void submit()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#17332f] px-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-amber-500 dark:text-gray-950">{isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}{t.placeOrder}</button>
        {message && <p role="status" className="rounded-lg bg-[#fff1e9] p-3 text-sm text-[#9e4a25] dark:bg-amber-900/20 dark:text-amber-200">{message}</p>}
      </section>
    </div>
  );
}