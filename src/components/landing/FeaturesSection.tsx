import type { LandingTranslations } from './types';

interface FeaturesSectionProps {
  t: LandingTranslations;
}

export function FeaturesSection({ t }: FeaturesSectionProps) {
  // Заглушка для популярных блюд
  const dishes = [
    { name: "Капучино", price: "180₽", image: "☕" },
    { name: "Круассан", price: "120₽", image: "🥐" },
    { name: "Салат Цезарь", price: "350₽", image: "🥗" },
    { name: "Паста Карбонара", price: "450₽", image: "🍝" }
  ];

  return (
    <section id="menu" className="py-24 bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            {t.menu.title}
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            {t.menu.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {dishes.map((dish, i) => (
            <div key={i} className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
              <div className="text-6xl mb-4 text-center">{dish.image}</div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 text-center">{dish.name}</h3>
              <p className="text-2xl font-bold text-amber-600 text-center">{dish.price}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="#" className="inline-flex px-8 py-4 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 transition-all">
            {t.menu.viewAll}
          </a>
        </div>
      </div>
    </section>
  );
}
