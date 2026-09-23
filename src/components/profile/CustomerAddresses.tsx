'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import { Check, Loader2, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';
import { getLocaleTranslations } from '@/app/i18n/catalog';

type Address = {
  id: string;
  label: string | null;
  address_text: string;
  entrance: string | null;
  floor: string | null;
  apartment: string | null;
  comment: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  is_default: boolean;
};

type AddressForm = {
  label: string;
  addressText: string;
  entrance: string;
  floor: string;
  apartment: string;
  comment: string;
  latitude: string;
  longitude: string;
  isDefault: boolean;
};

const emptyForm: AddressForm = {
  label: '',
  addressText: '',
  entrance: '',
  floor: '',
  apartment: '',
  comment: '',
  latitude: '',
  longitude: '',
  isDefault: false,
};

function toForm(address: Address): AddressForm {
  return {
    label: address.label || '',
    addressText: address.address_text,
    entrance: address.entrance || '',
    floor: address.floor || '',
    apartment: address.apartment || '',
    comment: address.comment || '',
    latitude: address.latitude?.toString() || '',
    longitude: address.longitude?.toString() || '',
    isDefault: address.is_default,
  };
}

export function CustomerAddresses({ locale }: { locale: Locale }) {
  const t = getLocaleTranslations(locale).ui.profile.addresses;
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useEffectEvent(async () => {
    try {
      const response = await fetch('/api/user/addresses', { cache: 'no-store' });
      const data = await response.json() as { addresses?: Address[]; error?: string };
      if (!response.ok) throw new Error(data.error || t.loadError);
      setAddresses(data.addresses || []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.loadError);
    } finally {
      setIsLoading(false);
    }
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  const closeForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(false);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      const response = await fetch(editingId ? `/api/user/addresses/${editingId}` : '/api/user/addresses', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json() as { address?: Address; error?: string };
      if (!response.ok || !data.address) throw new Error(data.error || t.saveError);
      setAddresses((current) => {
        const next = editingId ? current.map((address) => address.id === editingId ? data.address! : address) : [data.address!, ...current];
        return next.sort((first, second) => Number(second.is_default) - Number(first.is_default));
      });
      closeForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : t.saveError);
    } finally {
      setIsSaving(false);
    }
  };

  const makeDefault = async (address: Address) => {
    if (address.is_default) return;
    setError('');
    const response = await fetch(`/api/user/addresses/${address.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isDefault: true }),
    });
    const data = await response.json() as { address?: Address; error?: string };
    if (!response.ok || !data.address) {
      setError(data.error || t.saveError);
      return;
    }
    setAddresses((current) => current.map((item) => ({ ...item, is_default: item.id === address.id })));
  };

  const remove = async (address: Address) => {
    if (!window.confirm(`${t.delete}: ${address.address_text}?`)) return;
    setError('');
    const response = await fetch(`/api/user/addresses/${address.id}`, { method: 'DELETE' });
    if (!response.ok) {
      const data = await response.json() as { error?: string };
      setError(data.error || t.deleteError);
      return;
    }
    setAddresses((current) => current.filter((item) => item.id !== address.id));
  };

  return (
    <section className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t.title}</h2>
        </div>
        <button type="button" onClick={() => { setError(''); setIsFormOpen(true); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-600 px-3 text-sm font-semibold text-white hover:bg-amber-700">
          <Plus className="h-4 w-4" />
          {t.add}
        </button>
      </div>

      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {isLoading ? <div className="flex min-h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-amber-600" /></div> : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <article key={address.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900 dark:text-white">{address.label || t.address}</p>
                    {address.is_default && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><Check className="h-3.5 w-3.5" />{t.default}</span>}
                  </div>
                  <p className="mt-1 break-words text-sm text-gray-700 dark:text-gray-300">{address.address_text}</p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{[address.entrance, address.floor, address.apartment].filter(Boolean).join(' · ')}</p>
                  {address.latitude !== null && address.longitude !== null && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{address.latitude}, {address.longitude}</p>}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button type="button" onClick={() => { setEditingId(address.id); setForm(toForm(address)); setError(''); setIsFormOpen(true); }} className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700" aria-label={t.edit} title={t.edit}><Pencil className="h-4 w-4" /></button>
                  <button type="button" onClick={() => void remove(address)} className="flex h-10 w-10 items-center justify-center rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" aria-label={t.delete} title={t.delete}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              {!address.is_default && <button type="button" onClick={() => void makeDefault(address)} className="mt-3 text-sm font-semibold text-amber-700 hover:text-amber-800 dark:text-amber-400">{t.makeDefault}</button>}
            </article>
          ))}
          {!addresses.length && <p className="rounded-lg bg-gray-50 p-4 text-sm text-gray-500 dark:bg-gray-700/50 dark:text-gray-400">{t.noAddresses}</p>}
        </div>
      )}

      {isFormOpen && (
        <form onSubmit={submit} className="mt-4 grid gap-3 rounded-lg border border-amber-200 bg-amber-50/60 p-4 dark:border-amber-900/50 dark:bg-amber-950/20 sm:grid-cols-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.label}<input value={form.label} onChange={(event) => setForm({ ...form, label: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.address}<input required value={form.addressText} onChange={(event) => setForm({ ...form, addressText: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.entrance}<input value={form.entrance} onChange={(event) => setForm({ ...form, entrance: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.floor}<input value={form.floor} onChange={(event) => setForm({ ...form, floor: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.apartment}<input value={form.apartment} onChange={(event) => setForm({ ...form, apartment: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800" /></label>
          <label className="flex items-center gap-2 pt-6 text-sm font-medium text-gray-700 dark:text-gray-300"><input type="checkbox" checked={form.isDefault} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} />{t.default}</label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Latitude<input type="number" min="-90" max="90" step="any" value={form.latitude} onChange={(event) => setForm({ ...form, latitude: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800" /></label>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Longitude<input type="number" min="-180" max="180" step="any" value={form.longitude} onChange={(event) => setForm({ ...form, longitude: event.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800" /></label>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <a href={`https://2gis.kg/search/${encodeURIComponent(form.addressText || 'Бишкек')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-amber-700 underline underline-offset-4 dark:text-amber-400">Открыть адрес в 2ГИС</a>
            <span className="text-xs text-gray-500 dark:text-gray-400">Скопируйте координаты выбранного здания в поля выше.</span>
          </div>
          <label className="sm:col-span-2 text-sm font-medium text-gray-700 dark:text-gray-300">{t.comment}<textarea value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} rows={2} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-600 dark:bg-gray-800" /></label>
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={isSaving} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-600 px-4 text-sm font-semibold text-white disabled:opacity-60"><Check className="h-4 w-4" />{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : t.save}</button>
            <button type="button" onClick={closeForm} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-700 dark:border-gray-600 dark:text-gray-200"><X className="h-4 w-4" />{t.cancel}</button>
          </div>
        </form>
      )}
    </section>
  );
}