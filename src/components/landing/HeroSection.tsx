import Link from "next/link";

interface HeroSectionProps {
  t: any;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background image placeholder */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-900/90 to-orange-900/90 dark:from-zinc-900/95 dark:to-black/95" />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-30" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6">
          {t.hero.title}
        </h1>
        <p className="text-xl sm:text-2xl text-white/90 mb-12 max-w-3xl mx-auto">
          {t.hero.subtitle}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="#menu"
            className="px-8 py-4 rounded-xl bg-white text-amber-900 font-semibold text-lg hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl"
          >
            {t.hero.cta.menu}
          </Link>
          <Link
            href="#reservation"
            className="px-8 py-4 rounded-xl bg-amber-600 text-white font-semibold text-lg hover:bg-amber-700 transition-all shadow-lg"
          >
            {t.hero.cta.reserve}
          </Link>
        </div>
      </div>
    </section>
  );
}
