interface BenefitsSectionProps {
  t: any;
}

export function BenefitsSection({ t }: BenefitsSectionProps) {
  const benefits = [
    {
      key: 'fast',
      icon: '⚡',
      color: 'text-yellow-500'
    },
    {
      key: 'brand',
      icon: '🎨',
      color: 'text-purple-500'
    },
    {
      key: 'unified',
      icon: '🔗',
      color: 'text-blue-500'
    },
    {
      key: 'support',
      icon: '🛟',
      color: 'text-green-500'
    },
    {
      key: 'updates',
      icon: '🚀',
      color: 'text-orange-500'
    },
    {
      key: 'secure',
      icon: '🔒',
      color: 'text-red-500'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-zinc-50 to-amber-50 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            {t.benefits.title}
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            {t.benefits.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit) => (
            <div
              key={benefit.key}
              className="bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-zinc-200 dark:border-zinc-700"
            >
              <div className={`text-5xl mb-4 ${benefit.color}`}>
                {benefit.icon}
              </div>
              
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
                {t.benefits[benefit.key].title}
              </h3>
              
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t.benefits[benefit.key].description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
