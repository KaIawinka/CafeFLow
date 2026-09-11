interface FeaturesSectionProps {
  t: any;
}

export function FeaturesSection({ t }: FeaturesSectionProps) {
  const features = [
    {
      key: 'menu',
      icon: '📱',
      gradient: 'from-amber-500 to-orange-500',
      bgGradient: 'from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20'
    },
    {
      key: 'reservations',
      icon: '🍽️',
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20'
    },
    {
      key: 'kitchen',
      icon: '👨‍🍳',
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20'
    },
    {
      key: 'loyalty',
      icon: '🎁',
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20'
    },
    {
      key: 'analytics',
      icon: '📊',
      gradient: 'from-indigo-500 to-purple-500',
      bgGradient: 'from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20'
    },
    {
      key: 'admin',
      icon: '⚙️',
      gradient: 'from-slate-500 to-zinc-500',
      bgGradient: 'from-slate-50 to-zinc-50 dark:from-slate-950/20 dark:to-zinc-950/20'
    }
  ];

  return (
    <section id="features" className="py-24 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            {t.features.title}
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            {t.features.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.key}
              className={`group relative bg-gradient-to-br ${feature.bgGradient} rounded-3xl p-8 border border-zinc-200 dark:border-zinc-800 hover:shadow-2xl transition-all duration-300 hover:scale-105`}
            >
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white text-3xl mb-6 shadow-lg`}>
                {feature.icon}
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-3">
                {t.features[feature.key].title}
              </h3>
              
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t.features[feature.key].description}
              </p>

              {/* Hover effect */}
              <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
