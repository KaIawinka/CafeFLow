import type { LandingTranslations } from './types';

interface FeaturesSectionProps {
  t: LandingTranslations;
}

export function FeaturesSection({ t }: FeaturesSectionProps) {
  const dishes = [
    { name: "Капучино", price: "180 сом", tone: "from-[#e76f51] to-[#63391f]", description: "Ароматный кофе" },
    { name: "Круассан", price: "120 сом", tone: "from-[#f5c98a] to-[#b96b45]", description: "Свежая выпечка" },
    { name: "Салат Цезарь", price: "350 сом", tone: "from-[#b9d9c3] to-[#47715a]", description: "Классический рецепт" },
    { name: "Паста Карбонара", price: "450 сом", tone: "from-[#e4b36f] to-[#80603b]", description: "Итальянская паста" }
  ];

  return (
    <section id="menu" className="bg-background py-16 text-foreground sm:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center sm:mb-16">
          <h2 className="mb-3 text-3xl font-bold text-foreground sm:text-5xl">
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
              className="group overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-[0_10px_25px_rgba(21,26,30,0.06)] transition-all hover:-translate-y-1 hover:shadow-xl sm:p-6"
            >
              <div className={`mb-5 h-32 rounded-md bg-gradient-to-br ${dish.tone} p-5 transition-transform group-hover:scale-[1.02]`}><div className="h-full rounded border border-white/30 bg-black/10" /></div>
              <h3 className="mb-2 text-lg font-bold text-foreground sm:text-xl">{dish.name}</h3>
              <p className="mb-3 text-sm text-muted-foreground">{dish.description}</p>
              <p className="text-xl font-bold text-[var(--primary)]">{dish.price}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <a href="#" className="inline-flex rounded-md bg-[var(--primary)] px-8 py-4 font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#c95743] hover:shadow-xl">
            {t.menu.viewAll}
          </a>
        </div>
      </div>
    </section>
  );
}
