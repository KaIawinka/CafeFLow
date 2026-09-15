import Link from "next/link";
import type { LandingTranslations } from './types';

interface HeroSectionProps {
  t: LandingTranslations;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-[min(760px,calc(100vh-4rem))] items-center justify-center overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 py-16 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/40 sm:py-24">
      {/* Decorative patterns */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent dark:from-slate-950/70" />

      <div className="relative mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
        <h1 className="mb-5 text-4xl font-bold leading-tight bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 bg-clip-text text-transparent animate-float dark:from-amber-300 dark:via-orange-300 dark:to-amber-400 sm:text-6xl lg:text-7xl">
          {t.hero.title}
        </h1>
        <p className="mx-auto mb-9 max-w-3xl text-base font-medium leading-7 text-slate-700 dark:text-slate-300 sm:mb-12 sm:text-2xl sm:leading-9">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="#menu"
            className="group inline-flex min-h-12 items-center justify-center rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:from-amber-700 hover:to-orange-700 hover:shadow-xl sm:px-8 sm:py-4 sm:text-lg"
          >
            <span className="flex items-center justify-center gap-2">
              {t.hero.cta.menu}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>
          <Link
            href="#reservation"
            className="group inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-amber-600 bg-white px-6 py-3 text-base font-semibold text-amber-600 shadow-lg transition-all hover:-translate-y-1 hover:bg-amber-50 hover:shadow-xl dark:border-amber-400 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-slate-800 sm:px-8 sm:py-4 sm:text-lg"
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
