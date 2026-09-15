export type MenuCategory = 'Популярное' | 'Завтраки' | 'Основные блюда' | 'Напитки' | 'Десерты';

export interface MenuProduct {
  id: string;
  name: string;
  description: string;
  category: MenuCategory;
  price: number;
  weight: string;
  preparationMinutes: number;
  badge?: string;
  emoji: string;
}

export const menuProducts: MenuProduct[] = [
  { id: 'flat-white', name: 'Флэт уайт', description: 'Двойной эспрессо, шелковистое молоко и плотная пенка.', category: 'Популярное', price: 180, weight: '250 мл', preparationMinutes: 6, badge: 'Хит', emoji: '☕' },
  { id: 'avocado-toast', name: 'Тост с авокадо', description: 'Заквасочный хлеб, авокадо, яйцо пашот и хлопья чили.', category: 'Завтраки', price: 420, weight: '280 г', preparationMinutes: 12, emoji: '🥑' },
  { id: 'salmon-bowl', name: 'Боул с лососем', description: 'Рис, свежий лосось, эдамаме, огурец и кунжутный соус.', category: 'Основные блюда', price: 680, weight: '390 г', preparationMinutes: 18, badge: 'Новинка', emoji: '🍣' },
  { id: 'chicken-waffle', name: 'Вафля с курицей', description: 'Хрустящая вафля, курица, салат коул-слоу и медовый соус.', category: 'Основные блюда', price: 560, weight: '350 г', preparationMinutes: 16, emoji: '🧇' },
  { id: 'matcha-tonic', name: 'Матча-тоник', description: 'Церемониальная матча, тоник, лайм и лед.', category: 'Напитки', price: 260, weight: '400 мл', preparationMinutes: 5, emoji: '🍵' },
  { id: 'berry-cheesecake', name: 'Чизкейк с ягодами', description: 'Нежный сливочный чизкейк с соусом из сезонных ягод.', category: 'Десерты', price: 320, weight: '160 г', preparationMinutes: 4, emoji: '🍰' },
  { id: 'cappuccino', name: 'Капучино', description: 'Эспрессо, воздушное молоко и корица по желанию.', category: 'Напитки', price: 190, weight: '300 мл', preparationMinutes: 6, emoji: '🥛' },
  { id: 'granola', name: 'Гранола с йогуртом', description: 'Домашняя гранола, греческий йогурт, мед и фрукты.', category: 'Завтраки', price: 360, weight: '300 г', preparationMinutes: 8, emoji: '🍓' },
];

export const menuCategories: MenuCategory[] = ['Популярное', 'Завтраки', 'Основные блюда', 'Напитки', 'Десерты'];
