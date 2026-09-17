import Link from "next/link";
import type { LandingTranslations } from './types';

interface HeroSectionProps {
  t: LandingTranslations;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative flex min-h-[min(760px,calc(100vh-4rem))] items-center justify-center overflow-hidden bg-[#151a1e] py-16 text-white sm:py-24">
      {/* Decorative patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_15%,rgba(231,111,81,0.22),transparent_40%),linear-gradient(180deg,transparent,rgba(21,26,30,0.92))]" />

      <div className="relative mx-auto max-w-7xl px-5 text-center sm:px-6 lg:px-8">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#f5c98a]">CaféFlow · Бишкек</p>
        <h1 className="mb-5 text-4xl font-bold leading-tight text-[#fff8ea] animate-float sm:text-6xl lg:text-7xl">
          {t.hero.title}
        </h1>
        <p className="mx-auto mb-9 max-w-3xl text-base font-medium leading-7 text-white/70 sm:mb-12 sm:text-2xl sm:leading-9">
          {t.hero.subtitle}
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="#menu"
            className="group inline-flex min-h-12 items-center justify-center rounded-md bg-[#e76f51] px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-[#c95743] hover:shadow-xl sm:px-8 sm:py-4 sm:text-lg"
          >
            <span className="flex items-center justify-center gap-2">
              {t.hero.cta.menu}
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </span>
          </Link>
          <Link
            href="#reservation"
            className="group inline-flex min-h-12 items-center justify-center rounded-md border border-white/30 bg-white/5 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl sm:px-8 sm:py-4 sm:text-lg"
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
