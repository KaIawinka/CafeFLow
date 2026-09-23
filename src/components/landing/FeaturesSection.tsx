import { ArrowUpRight, ChefHat, Leaf, Sparkles, Utensils } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/app/i18n/config';
import type { LandingTranslations } from './types';
import { MenuCarouselWrapper } from './MenuCarouselWrapper';
import { ScrollReveal } from './ScrollReveal';

interface FeaturesSectionProps {
  t: LandingTranslations;
  locale: Locale;
}

export function FeaturesSection({ t, locale }: FeaturesSectionProps) {
  const copy = t.features.story;
  return (
    <>
      <section id="about" className="landing-section landing-section--warm relative overflow-hidden bg-[#f7f5f0] py-20 text-[#151a1e] sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12">
          <ScrollReveal className="landing-reveal--right">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">{copy.eyebrow}</p>
            <h2 className="max-w-lg text-4xl font-black leading-tight sm:text-6xl">{t.about.title}<br /><span className="font-serif font-normal italic text-orange-500">{t.about.description.split(' ')[0]}</span></h2>
            <p className="mt-7 max-w-md text-base leading-7 text-[#687078]">{copy.text}</p>
            <div className="mt-9 grid max-w-md grid-cols-2 gap-x-8 gap-y-6 border-t border-[#ddd8cd] pt-7 text-sm">
              <div className="flex gap-3"><Leaf className="h-5 w-5 shrink-0 text-orange-500" /><div><p className="font-bold">{copy.fresh}</p><p className="mt-1 text-[#687078]">{copy.daily}</p></div></div>
              <div className="flex gap-3"><ChefHat className="h-5 w-5 shrink-0 text-orange-500" /><div><p className="font-bold">{copy.chefs}</p><p className="mt-1 text-[#687078]">{copy.experience}</p></div></div>
              <div className="flex gap-3"><Sparkles className="h-5 w-5 shrink-0 text-orange-500" /><div><p className="font-bold">{copy.ambience}</p><p className="mt-1 text-[#687078]">{copy.meetings}</p></div></div>
              <div className="flex gap-3"><Utensils className="h-5 w-5 shrink-0 text-orange-500" /><div><p className="font-bold">{copy.service}</p><p className="mt-1 text-[#687078]">{copy.wait}</p></div></div>
            </div>
          </ScrollReveal>
          <ScrollReveal className="relative min-h-[420px] landing-reveal--scale" delay={140}>
            <div className="absolute right-0 top-0 h-[360px] w-[88%] overflow-hidden rounded-[1.5rem] shadow-2xl shadow-[#151a1e]/15 sm:h-[440px]">
              <div className="h-full w-full bg-gradient-to-br from-orange-600 to-orange-800 dark:from-orange-500 dark:to-orange-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#151a1e]/70 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 flex items-center gap-4 rounded-lg bg-[#fffdf8] p-5 shadow-xl sm:p-6"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white"><ChefHat className="h-7 w-7" /></div><div><p className="text-3xl font-black text-orange-600">{copy.experienceValue}</p><p className="text-xs font-bold uppercase tracking-wider text-[#687078]">{copy.years}</p></div></div>
          </ScrollReveal>
        </div>
      </section>

      <section id="menu" className="landing-section landing-section--light bg-[#fffdf8] py-20 text-[#151a1e] sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <ScrollReveal className="mb-10 flex flex-col justify-between gap-5 sm:mb-14 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">{t.features.menuEyebrow}</p><h2 className="text-4xl font-black sm:text-6xl">{t.menu.title}</h2><p className="mt-3 max-w-lg text-[#687078]">{t.menu.subtitle}</p></div><Link href={`/${locale}/menu`} className="group inline-flex min-h-10 items-center gap-2 text-sm font-bold text-orange-600">{t.menu.viewAll}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link></ScrollReveal>
          <MenuCarouselWrapper locale={locale} viewAll={t.menu.viewAll} />
        </div>
      </section>
    </>
  );
}
