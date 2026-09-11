interface TechSectionProps {
  t: any;
}

export function TechSection({ t }: TechSectionProps) {
  const technologies = [
    {
      name: 'Next.js',
      icon: '▲',
      color: 'from-black to-zinc-800'
    },
    {
      name: 'PostgreSQL',
      icon: '🐘',
      color: 'from-blue-600 to-blue-800'
    },
    {
      name: 'TypeScript',
      icon: 'TS',
      color: 'from-blue-500 to-blue-700'
    },
    {
      name: 'Prisma',
      icon: '◭',
      color: 'from-indigo-600 to-purple-600'
    },
    {
      name: 'Tailwind CSS',
      icon: '🎨',
      color: 'from-cyan-500 to-blue-500'
    },
    {
      name: 'AI Integration',
      icon: '🤖',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-zinc-900 to-black text-white relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-white/[0.02]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            {t.tech.title}
          </h2>
          <p className="text-xl text-zinc-400 max-w-3xl mx-auto mb-4">
            {t.tech.subtitle}
          </p>
          <p className="text-zinc-500">
            {t.tech.description}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {technologies.map((tech) => (
            <div
              key={tech.name}
              className="group relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
              <div className="relative bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-2xl p-6 border border-zinc-800 hover:border-zinc-700 transition-all hover:scale-105">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tech.color} flex items-center justify-center text-white font-bold mb-4 shadow-lg`}>
                  {tech.icon}
                </div>
                <div className="text-sm font-semibold text-white">
                  {tech.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional tech info */}
        <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-amber-400 mb-2">99.9%</div>
            <div className="text-zinc-400">Uptime</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-green-400 mb-2">&lt;100ms</div>
            <div className="text-zinc-400">Response Time</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="text-4xl font-bold text-blue-400 mb-2">SSL/TLS</div>
            <div className="text-zinc-400">Secure Connection</div>
          </div>
        </div>
      </div>
    </section>
  );
}
