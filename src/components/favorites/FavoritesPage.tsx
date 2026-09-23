'use client';

import { useEffect, useState } from 'react';
import { Heart, Clock, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/app/i18n/config';

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  currency: string;
  weight: string | null;
  preparation_minutes: number | null;
  is_available: boolean;
  category: {
    id: string;
    name: string;
  } | null;
};

type Favorite = {
  id: string;
  product_id: string;
  created_at: string;
  product: Product;
};

function money(value: string | number, currency = 'KGS') {
  return `${Number(value).toLocaleString('ru-RU')} ${currency === 'KGS' ? 'сом' : currency}`;
}

function publicPath(path: string) {
  if (typeof window === 'undefined') return path;
  const branch = new URLSearchParams(window.location.search).get('branch');
  return branch ? `${path}${path.includes('?') ? '&' : '?'}branch=${encodeURIComponent(branch)}` : path;
}

export function FavoritesPage({ locale }: { locale: Locale }) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadFavorites = () => {
    fetch('/api/user/favorites')
      .then((res) => res.json())
      .then((data) => {
        setFavorites(data.favorites || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const removeFavorite = async (productId: string) => {
    const response = await fetch(`/api/user/favorites?productId=${productId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error || 'Ошибка при удалении');
      return;
    }

    setMessage('Удалено из избранного');
    loadFavorites();
  };

  const addToCart = async (productId: string) => {
    // Получаем текущую корзину
    const cartResponse = await fetch(publicPath('/api/public/cart'));
    const cartData = await cartResponse.json();
    const currentItems = cartData.cart?.items || [];
    
    // Находим товар в корзине
    const existingItem = currentItems.find((item: { productId: string }) => item.productId === productId);
    const quantity = existingItem ? existingItem.quantity + 1 : 1;
    
    // Обновляем корзину
    const items = [
      ...currentItems.filter((item: { productId: string }) => item.productId !== productId),
      { productId, quantity },
    ];

    const response = await fetch(publicPath('/api/public/cart'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      setMessage('Ошибка при добавлении в корзину');
      return;
    }

    setMessage('Добавлено в корзину');
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] px-4 py-8 text-[#151a1e] dark:bg-[#151a1e] dark:text-[#f6f2e9]">
        <div className="mx-auto max-w-6xl">
          <p className="text-center">Загрузка...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#f7f5f0] px-4 py-8 pb-28 text-[#151a1e] dark:bg-[#151a1e] dark:text-[#f6f2e9] sm:px-6 sm:py-12 sm:pb-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[.2em] text-orange-600 dark:text-orange-300">
            Избранное
          </p>
          <h1 className="text-3xl font-black sm:text-5xl">Ваши любимые блюда</h1>
          <p className="mt-3 text-sm text-[#687078] dark:text-[#a7b0b4]">
            {favorites.length} {favorites.length === 1 ? 'блюдо' : favorites.length < 5 ? 'блюда' : 'блюд'} в избранном
          </p>
        </header>

        {message && (
          <div className="mb-6 rounded-lg bg-orange-100 p-4 text-sm font-semibold text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
            {message}
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm dark:bg-gray-900">
            <Heart className="mx-auto mb-4 h-16 w-16 text-gray-400" />
            <h2 className="mb-2 text-xl font-bold">Избранное пусто</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Добавляйте понравившиеся блюда в избранное, чтобы быстро найти их позже
            </p>
            <Link
              href={publicPath(`/${locale}/menu`)}
              className="inline-flex min-h-11 items-center gap-2 rounded-md bg-orange-500 px-5 font-bold text-white transition hover:bg-orange-600"
            >
              Перейти в меню
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((favorite) => (
              <article
                key={favorite.id}
                className="rounded-2xl border border-[#dde4dc] bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h2 className="text-xl font-black">{favorite.product.name}</h2>
                    {favorite.product.category && (
                      <p className="mt-1 text-xs text-gray-500">
                        {favorite.product.category.name}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeFavorite(favorite.product_id)}
                    className="rounded-lg p-2 transition hover:bg-red-50 dark:hover:bg-red-900/20"
                    aria-label="Удалить из избранного"
                  >
                    <Trash2 className="h-5 w-5 text-red-500" />
                  </button>
                </div>

                <strong className="text-[#d06b3c]">
                  {money(favorite.product.price, favorite.product.currency)}
                </strong>

                {favorite.product.description && (
                  <p className="mt-3 min-h-12 text-sm text-[#60706b] dark:text-gray-400">
                    {favorite.product.description}
                  </p>
                )}

                <div className="mt-3 flex items-center gap-4 text-xs text-[#87938d]">
                  {favorite.product.preparation_minutes && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {favorite.product.preparation_minutes} мин
                    </div>
                  )}
                  {favorite.product.weight && (
                    <div>{favorite.product.weight} г</div>
                  )}
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => void addToCart(favorite.product_id)}
                    disabled={!favorite.product.is_available}
                    className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#17332f] font-bold text-white disabled:opacity-50 dark:bg-amber-500 dark:text-gray-950"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    В корзину
                  </button>
                  <Link
                    href={publicPath(`/${locale}/menu`)}
                    className="flex min-h-11 items-center justify-center rounded-xl border border-[#17332f] px-4 font-bold text-[#17332f] hover:bg-[#17332f] hover:text-white dark:border-amber-500 dark:text-amber-500 dark:hover:bg-amber-500 dark:hover:text-gray-950"
                  >
                    Меню
                  </Link>
                </div>

                {!favorite.product.is_available && (
                  <p className="mt-3 text-center text-xs font-semibold text-red-600">
                    Временно недоступно
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
