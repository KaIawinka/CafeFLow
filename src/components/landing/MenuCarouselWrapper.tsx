'use client';

import { useEffect, useState } from 'react';
import type { Locale } from '@/app/i18n/config';
import { MenuCarousel } from './MenuCarousel';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  category: { name: string } | null;
};

type Dish = {
  name: string;
  description: string;
  label: string;
  price: string;
  image: string;
  lightImage: string;
};

function money(value: string | number, currency = 'KGS') {
  return `${Number(value).toLocaleString('ru-RU')} ${currency === 'KGS' ? 'сом' : currency}`;
}

// Placeholder изображения для разных категорий (простые цветные градиенты вместо Unsplash)
const categoryImages: Record<string, { dark: string; light: string }> = {
  default: {
    dark: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23f97316;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23ea580c;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23g1)"/%3E%3C/svg%3E',
    light: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23fed7aa;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23fdba74;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23g1)"/%3E%3C/svg%3E',
  },
  coffee: {
    dark: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%236b4423;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23443018;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23g1)"/%3E%3C/svg%3E',
    light: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23d2a679;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23b88c5a;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23g1)"/%3E%3C/svg%3E',
  },
  food: {
    dark: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23dc2626;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%239f1239;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23g1)"/%3E%3C/svg%3E',
    light: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23fca5a5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23fda4af;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23g1)"/%3E%3C/svg%3E',
  },
  dessert: {
    dark: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23a855f7;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%237c3aed;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23g1)"/%3E%3C/svg%3E',
    light: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23e9d5ff;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23d8b4fe;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="400" height="300" fill="url(%23g1)"/%3E%3C/svg%3E',
  },
};

function getCategoryImage(categoryName: string | null): { dark: string; light: string } {
  if (!categoryName) return categoryImages.default;
  const lower = categoryName.toLowerCase();
  if (lower.includes('напит') || lower.includes('кофе') || lower.includes('чай')) return categoryImages.coffee;
  if (lower.includes('десерт')) return categoryImages.dessert;
  if (lower.includes('завтрак') || lower.includes('основн') || lower.includes('салат')) return categoryImages.food;
  return categoryImages.default;
}

export function MenuCarouselWrapper({ locale, viewAll }: { locale: Locale; viewAll: string }) {
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/public/menu')
      .then((res) => res.json())
      .then((data) => {
        const products = (data.products || []) as Product[];
        const featured = products
          .filter((p) => p.description)
          .slice(0, 6)
          .map((product) => {
            const imgs = getCategoryImage(product.category?.name || null);
            return {
              name: product.name,
              description: product.description || '',
              label: product.category?.name || 'Меню',
              price: money(product.price, product.currency),
              image: imgs.dark,
              lightImage: imgs.light,
            };
          });
        setDishes(featured);
        setLoading(false);
      })
      .catch(() => {
        // Fallback на дефолтные блюда если API не доступно
        setDishes([
          {
            name: 'Флэт уайт',
            description: 'Двойной эспрессо с бархатистой микропенкой',
            label: 'Горячие напитки',
            price: '190 сом',
            ...categoryImages.coffee,
          },
          {
            name: 'Авокадо тост',
            description: 'Цельнозерновой хлеб с гуакамоле и яйцом пашот',
            label: 'Завтраки',
            price: '420 сом',
            ...categoryImages.food,
          },
          {
            name: 'Чизкейк ягодный',
            description: 'Нью-йоркский чизкейк с соусом из свежих ягод',
            label: 'Десерты',
            price: '350 сом',
            ...categoryImages.dessert,
          },
        ]);
        setLoading(false);
      });
  }, []);

  if (loading || dishes.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-gray-600">Загрузка меню...</p>
      </div>
    );
  }

  return <MenuCarousel dishes={dishes} locale={locale} viewAll={viewAll} />;
}
