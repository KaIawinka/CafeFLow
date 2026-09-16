'use client';

import { useEffect, useEffectEvent, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Archive, Plus, Save } from 'lucide-react';
import { useParams } from 'next/navigation';

type Category = { id: string; name: string; slug: string; is_active: boolean };
type Product = { id: string; name: string; slug: string; price: string | number; currency: string; is_available: boolean; category?: { id: string; name: string } | null };

const copy = {
  ru: { back: 'Админ-панель', title: 'Меню и категории', subtitle: 'Управление каталогом tenant', newCategory: 'Новая категория', name: 'Название', create: 'Создать', categoryCreated: 'Категория создана', newProduct: 'Новое блюдо', productName: 'Название блюда', price: 'Цена', noCategory: 'Без категории', save: 'Сохранить', productCreated: 'Блюдо создано', products: 'Блюда', archive: 'Архивировать', archived: 'Блюдо архивировано', loadError: 'Не удалось загрузить меню', categoryError: 'Не удалось создать категорию', productError: 'Не удалось создать блюдо' },
  en: { back: 'Admin panel', title: 'Menu and categories', subtitle: 'Manage the tenant catalog', newCategory: 'New category', name: 'Name', create: 'Create', categoryCreated: 'Category created', newProduct: 'New dish', productName: 'Dish name', price: 'Price', noCategory: 'No category', save: 'Save', productCreated: 'Dish created', products: 'Dishes', archive: 'Archive', archived: 'Dish archived', loadError: 'Could not load menu', categoryError: 'Could not create category', productError: 'Could not create dish' },
  kg: { back: 'Админ панели', title: 'Меню жана категориялар', subtitle: 'Tenant каталогун башкаруу', newCategory: 'Жаңы категория', name: 'Аталышы', create: 'Түзүү', categoryCreated: 'Категория түзүлдү', newProduct: 'Жаңы тамак', productName: 'Тамактын аталышы', price: 'Баасы', noCategory: 'Категориясыз', save: 'Сактоо', productCreated: 'Тамак түзүлдү', products: 'Тамактар', archive: 'Архивдөө', archived: 'Тамак архивделди', loadError: 'Меню жүктөлгөн жок', categoryError: 'Категория түзүлгөн жок', productError: 'Тамак түзүлгөн жок' },
} as const;

export default function AdminMenuPage() {
  const params = useParams<{ locale: string }>();
  const locale = params.locale || 'ru';
  const t = copy[locale as keyof typeof copy] || copy.ru;
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [product, setProduct] = useState({ name: '', price: '', categoryId: '' });
  const [message, setMessage] = useState('');

  const load = async () => {
    const [categoryResponse, productResponse] = await Promise.all([fetch('/api/admin/menu/categories'), fetch('/api/admin/menu/products')]);
    if (!categoryResponse.ok || !productResponse.ok) { setMessage(t.loadError); return; }
    const categoryData = await categoryResponse.json();
    const productData = await productResponse.json();
    setCategories(categoryData.categories || []);
    setProducts(productData.products || []);
  };

  const loadMenu = useEffectEvent(load);
  useEffect(() => { const timeoutId = window.setTimeout(() => void loadMenu(), 0); return () => window.clearTimeout(timeoutId); }, []);

  const createCategory = async () => {
    const response = await fetch('/api/admin/menu/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: categoryName }) });
    if (!response.ok) { setMessage(t.categoryError); return; }
    setCategoryName(''); setMessage(t.categoryCreated); void load();
  };

  const createProduct = async () => {
    const response = await fetch('/api/admin/menu/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: product.name, price: product.price, categoryId: product.categoryId || undefined }) });
    if (!response.ok) { setMessage(t.productError); return; }
    setProduct({ name: '', price: '', categoryId: '' }); setMessage(t.productCreated); void load();
  };

  const archiveProduct = async (id: string) => {
    const response = await fetch(`/api/admin/menu/products/${id}`, { method: 'DELETE' });
    if (response.ok) { setMessage(t.archived); void load(); }
  };

  return <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 dark:bg-gray-950 dark:text-white"><div className="mx-auto max-w-6xl space-y-6"><Link href={`/${locale}/admin`} className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700"><ArrowLeft className="h-4 w-4" /> {t.back}</Link><header><h1 className="text-3xl font-black">{t.title}</h1><p className="mt-2 text-sm text-gray-500">{t.subtitle}</p></header>{message && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{message}</p>}<div className="grid gap-6 lg:grid-cols-2"><section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900"><h2 className="text-xl font-bold">{t.newCategory}</h2><div className="mt-4 flex gap-2"><input value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder={t.name} className="min-h-11 flex-1 rounded-lg border px-3 dark:border-gray-700 dark:bg-gray-800" /><button type="button" onClick={() => void createCategory()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-amber-600 px-4 font-bold text-white"><Plus className="h-4 w-4" />{t.create}</button></div><div className="mt-5 space-y-2">{categories.map((item) => <div key={item.id} className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800">{item.name}</div>)}</div></section><section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900"><h2 className="text-xl font-bold">{t.newProduct}</h2><div className="mt-4 space-y-3"><input value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} placeholder={t.productName} className="min-h-11 w-full rounded-lg border px-3 dark:border-gray-700 dark:bg-gray-800" /><input value={product.price} onChange={(event) => setProduct({ ...product, price: event.target.value })} inputMode="decimal" placeholder={t.price} className="min-h-11 w-full rounded-lg border px-3 dark:border-gray-700 dark:bg-gray-800" /><select value={product.categoryId} onChange={(event) => setProduct({ ...product, categoryId: event.target.value })} className="min-h-11 w-full rounded-lg border px-3 dark:border-gray-700 dark:bg-gray-800"><option value="">{t.noCategory}</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button type="button" onClick={() => void createProduct()} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#17332f] px-4 font-bold text-white"><Save className="h-4 w-4" />{t.save}</button></div></section></div><section className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-900"><h2 className="text-xl font-bold">{t.products}</h2><div className="mt-4 divide-y dark:divide-gray-800">{products.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 py-3"><div><b>{item.name}</b><p className="text-sm text-gray-500">{item.category?.name || t.noCategory} · {item.price} {item.currency}</p></div><button type="button" onClick={() => void archiveProduct(item.id)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-red-200 px-3 text-sm font-semibold text-red-700"><Archive className="h-4 w-4" />{t.archive}</button></div>)}</div></section></div></main>;
}
