import Link from "next/link";
import type { LandingTranslations } from './types';

interface HeroSectionProps {
  t: LandingTranslations;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Decorative patterns */}
      <div className="absolute inset-0 bg-grid-slate-100 opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/50 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center">
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent mb-6 animate-float">
          {t.hero.title}
        </h1>
        <p className="text-xl sm:text-2xl text-gray-700 mb-12 max-w-3xl mx-auto font-medium">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="#menu"
            className="group px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
          >
            <span className="flex items-center justify-center gap-2">
              {t.hero.cta.menu}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>
          <Link
            href="#reservation"
            className="group px-8 py-4 rounded-xl bg-white text-amber-600 border-2 border-amber-600 font-semibold text-lg hover:bg-amber-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 transform"
          >
            <span className="flex items-center justify-center gap-2">
              {t.hero.cta.reserve}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
