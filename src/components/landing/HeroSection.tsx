import Link from 'next/link';
import { ArrowDown, ArrowRight, Clock3, MapPin, Star } from 'lucide-react';
import type { LandingTranslations } from './types';
import { ThemeAwareBackground } from './ThemeAwareBackground';

interface HeroSectionProps {
  t: LandingTranslations;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative isolate overflow-hidden bg-[#151a1e] text-white">
      <div className="absolute inset-0 -z-20 bg-gradient-to-br from-orange-900 via-orange-800 to-red-900 dark:from-orange-950 dark:via-red-950 dark:to-gray-900" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(10,13,15,0.96)_0%,rgba(10,13,15,0.8)_42%,rgba(10,13,15,0.32)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[#151a1e] to-transparent" />
      <div className="mx-auto grid min-h-[min(780px,calc(100vh-4rem))] max-w-7xl items-center gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-12 lg:py-24">
        <div className="landing-reveal max-w-2xl">
          <div className="mb-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-orange-300"><span className="h-px w-10 bg-orange-500" /> {t.hero.location}</div>
          <h1 className="max-w-xl text-5xl font-black leading-[0.98] tracking-tight text-[#fff8ea] sm:text-7xl lg:text-[6.5rem]">{t.hero.title}</h1>
          <p className="mt-7 max-w-xl text-base leading-7 text-white/72 sm:text-xl sm:leading-8">{t.hero.subtitle}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Link href="#menu" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-orange-500 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-orange-600 hover:shadow-xl sm:px-8 sm:py-4 sm:text-lg">{t.hero.cta.menu}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
            <Link href="#reservation" className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-md border border-white/30 bg-white/5 px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-white/10 hover:shadow-xl sm:px-8 sm:py-4 sm:text-lg">{t.hero.cta.reserve}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
          </div>
          <div className="mt-14 grid max-w-lg grid-cols-3 gap-5 border-t border-white/15 pt-5 text-sm">
            <div><p className="font-bold text-white">{t.hero.ratingValue}</p><p className="mt-1 text-white/50">{t.hero.ratingLabel}</p></div>
            <div><p className="font-bold text-white">{t.hero.hoursValue}</p><p className="mt-1 flex items-center gap-1 text-white/50"><Clock3 className="h-3 w-3" /> {t.contact.hours}</p></div>
            <div><p className="font-bold text-white">{t.hero.city}</p><p className="mt-1 flex items-center gap-1 text-white/50"><MapPin className="h-3 w-3" /> {t.contact.address}</p></div>
          </div>
        </div>
        <div className="relative hidden min-h-[510px] lg:block">
          <div className="absolute right-0 top-1/2 h-[510px] w-[min(100%,520px)] -translate-y-1/2 rotate-2 overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-orange-600 to-red-700 shadow-2xl shadow-black/40">
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
            <div className="absolute bottom-7 left-7 right-7 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">{t.hero.featuredDishLabel}</p><p className="mt-2 text-2xl font-bold">{t.hero.featuredDishName}</p></div><span className="rounded-full bg-orange-300 px-3 py-2 text-sm font-bold text-orange-950">{t.hero.featuredDishPrice}</span></div>
          </div>
          <div className="cafeflow-hero-card-wrap absolute right-0 top-0 z-10">
            <div className="cafeflow-hero-card">
              <div className="cafeflow-hero-card__shine" />
              <div className="cafeflow-hero-card__icon"><Star className="h-5 w-5 fill-current text-white" /></div>
              <div className="relative z-10"><p className="text-sm font-bold">{t.hero.localsBadge}</p><p className="text-xs text-white/60">{t.hero.freshBadge}</p></div>
              <span className="cafeflow-hero-card__spark cafeflow-hero-card__spark--one" />
              <span className="cafeflow-hero-card__spark cafeflow-hero-card__spark--two" />
            </div>
          </div>
        </div>
      </div>
      <a href="#about" aria-label={t.hero.scrollToStory} className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-xs uppercase tracking-[0.2em] text-white/50 transition hover:text-white sm:flex">{t.hero.discover} <ArrowDown className="h-4 w-4 animate-bounce" /></a>
    </section>
  );
}
