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
    <section id="menu" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-4">
            {t.menu.title}
          </h2>
          <p className="text-xl text-gray-600">
            {t.menu.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {dishes.map((dish, i) => (
            <div
              key={i}
              className="group bg-gradient-to-br from-white to-amber-50 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 transform border border-amber-100"
            >
              <div className="text-6xl mb-4 text-center group-hover:scale-110 transition-transform">{dish.image}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">{dish.name}</h3>
              <p className="text-sm text-gray-600 text-center mb-3">{dish.description}</p>
              <p className="text-2xl font-bold text-amber-600 text-center">{dish.price}</p>
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
