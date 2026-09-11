interface AudienceSectionProps {
  t: any;
}

export function AudienceSection({ t }: AudienceSectionProps) {
  const audiences = [
    {
      key: 'cafe',
      emoji: '☕',
      gradient: 'from-amber-500 to-orange-500',
      image: '🏪'
    },
    {
      key: 'restaurant',
      emoji: '🍽️',
      gradient: 'from-red-500 to-rose-500',
      image: '🍴'
    },
    {
      key: 'bakery',
      emoji: '🥐',
      gradient: 'from-yellow-500 to-amber-500',
      image: '🧁'
    },
    {
      key: 'delivery',
      emoji: '🚚',
      gradient: 'from-green-500 to-emerald-500',
      image: '📦'
    }
  ];

  return (
    <section className="py-24 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            {t.audience.title}
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            {t.audience.subtitle}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {audiences.map((audience) => (
            <div
              key={audience.key}
              className="group relative overflow-hidden bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-800 rounded-3xl p-8 border-2 border-zinc-200 dark:border-zinc-700 hover:border-transparent transition-all duration-300 hover:shadow-2xl hover:scale-105"
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${audience.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative">
                <div className="text-6xl mb-6 text-center transform group-hover:scale-110 transition-transform duration-300">
                  {audience.emoji}
                </div>
                
                <h3 className="text-xl font-bold text-center text-zinc-900 dark:text-white">
                  {t.audience[audience.key]}
                </h3>
              </div>

              {/* Decorative element */}
              <div className={`absolute -bottom-10 -right-10 text-8xl opacity-5 group-hover:opacity-10 transition-opacity`}>
                {audience.image}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
