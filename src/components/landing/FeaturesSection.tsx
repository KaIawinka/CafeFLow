import type { LandingTranslations } from './types';

interface FeaturesSectionProps {
  t: LandingTranslations;
}

export function FeaturesSection({ t }: FeaturesSectionProps) {
  // Заглушка для популярных блюд
  const dishes = [
    { name: "Капучино", price: "180₽", image: "☕", description: "Ароматный кофе" },
    { name: "Круассан", price: "120₽", image: "🥐", description: "Свежая выпечка" },
    { name: "Салат Цезарь", price: "350₽", image: "🥗", description: "Классический рецепт" },
    { name: "Паста Карбонара", price: "450₽", image: "🍝", description: "Итальянская паста" }
  ];

  return (
    <section id="menu" className="bg-background py-16 text-foreground dark:bg-slate-900 sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-16">
          <h2 className="mb-3 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-3xl font-bold text-transparent dark:from-amber-300 dark:to-orange-300 sm:text-5xl">
            {t.menu.title}
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300 sm:text-xl">
            {t.menu.subtitle}
          </p>
        </div>

        <div className="mb-10 grid gap-4 sm:mb-12 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {dishes.map((dish, i) => (
            <div
              key={i}
              className="group rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50 p-5 shadow-lg transition-all hover:-translate-y-2 hover:shadow-2xl dark:border-slate-700 dark:from-slate-800 dark:to-slate-800/80 sm:p-6"
            >
              <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform">{dish.image}</div>
              <h3 className="mb-2 text-center text-lg font-bold text-slate-900 dark:text-white sm:text-xl">{dish.name}</h3>
              <p className="mb-3 text-center text-sm text-slate-600 dark:text-slate-300">{dish.description}</p>
              <p className="text-center text-2xl font-bold text-amber-600 dark:text-amber-300">{dish.price}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="#" className="inline-flex px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform">
            {t.menu.viewAll}
          </a>
        </div>
      </div>
    </section>
  );
}
