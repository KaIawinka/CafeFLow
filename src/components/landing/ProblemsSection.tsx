interface ProblemsSectionProps {
  t: any;
}

export function ProblemsSection({ t }: ProblemsSectionProps) {
  const problems = [
    {
      key: 'manual',
      icon: '📝',
      color: 'from-red-500 to-pink-500'
    },
    {
      key: 'channels',
      icon: '📱',
      color: 'from-orange-500 to-amber-500'
    },
    {
      key: 'analytics',
      icon: '📊',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      key: 'kitchen',
      icon: '👨‍🍳',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <section className="py-24 bg-zinc-50 dark:bg-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-white mb-4">
            {t.problems.title}
          </h2>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl mx-auto">
            {t.problems.subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem) => (
            <div
              key={problem.key}
              className="group relative bg-white dark:bg-zinc-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${problem.color} rounded-t-2xl`} />
              
              <div className="text-5xl mb-4">{problem.icon}</div>
              
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">
                {t.problems.list[problem.key].title}
              </h3>
              
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {t.problems.list[problem.key].description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold text-lg shadow-lg">
            <span>↓</span>
            <span>{t.solution.title}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
