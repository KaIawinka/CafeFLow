import { ArrowUpRight, ChefHat, Leaf, Sparkles, Utensils } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/app/i18n/config';
import type { LandingTranslations } from './types';
import { ThemeAwareBackground } from './ThemeAwareBackground';

interface FeaturesSectionProps {
  t: LandingTranslations;
  locale: Locale;
}

const dishMeta = [
  {
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85',
    lightImage: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=900&q=85',
  },
  {
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=900&q=85',
    lightImage: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=900&q=85',
  },
  {
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85',
    lightImage: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=85',
  },
  {
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85',
    lightImage: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=900&q=85',
  },
];

export function FeaturesSection({ t, locale }: FeaturesSectionProps) {
  const copy = t.features.story;
  const localizedDishes = t.features.dishes.map((dish, index) => ({ ...dish, ...dishMeta[index] }));
  return (
    <>
      <section id="about" className="landing-section landing-section--warm relative overflow-hidden bg-[#f7f5f0] py-20 text-[#151a1e] sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12">
          <div className="landing-reveal">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">{copy.eyebrow}</p>
            <h2 className="max-w-lg text-4xl font-black leading-tight sm:text-6xl">{t.about.title}<br /><span className="font-serif font-normal italic text-orange-500">{t.about.description.split(' ')[0]}</span></h2>
            <p className="mt-7 max-w-md text-base leading-7 text-[#687078]">{copy.text}</p>
            <div className="mt-9 grid max-w-md grid-cols-2 gap-x-8 gap-y-6 border-t border-[#ddd8cd] pt-7 text-sm">
              <div className="flex gap-3"><Leaf className="h-5 w-5 shrink-0 text-orange-500" /><div><p className="font-bold">{copy.fresh}</p><p className="mt-1 text-[#687078]">{copy.daily}</p></div></div>
              <div className="flex gap-3"><ChefHat className="h-5 w-5 shrink-0 text-orange-500" /><div><p className="font-bold">{copy.chefs}</p><p className="mt-1 text-[#687078]">{copy.experience}</p></div></div>
              <div className="flex gap-3"><Sparkles className="h-5 w-5 shrink-0 text-orange-500" /><div><p className="font-bold">{copy.ambience}</p><p className="mt-1 text-[#687078]">{copy.meetings}</p></div></div>
              <div className="flex gap-3"><Utensils className="h-5 w-5 shrink-0 text-orange-500" /><div><p className="font-bold">{copy.service}</p><p className="mt-1 text-[#687078]">{copy.wait}</p></div></div>
            </div>
          </div>
          <div className="relative min-h-[420px]">
            <div className="absolute right-0 top-0 h-[360px] w-[88%] overflow-hidden rounded-[1.5rem] bg-[#20272c] shadow-2xl shadow-[#151a1e]/15 sm:h-[440px]">
              <ThemeAwareBackground
                darkSrc="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=90"
                lightSrc="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=90"
                className="will-change-transform hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#151a1e]/70 to-transparent" />
            </div>
            <div className="absolute bottom-0 left-0 flex items-center gap-4 rounded-lg bg-[#fffdf8] p-5 shadow-xl sm:p-6"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white"><ChefHat className="h-7 w-7" /></div><div><p className="text-3xl font-black text-orange-600">{copy.experienceValue}</p><p className="text-xs font-bold uppercase tracking-wider text-[#687078]">{copy.years}</p></div></div>
          </div>
        </div>
      </section>

      <section id="menu" className="landing-section landing-section--light bg-[#fffdf8] py-20 text-[#151a1e] sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-14 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">{t.features.menuEyebrow}</p><h2 className="text-4xl font-black sm:text-6xl">{t.menu.title}</h2><p className="mt-3 max-w-lg text-[#687078]">{t.menu.subtitle}</p></div><Link href={`/${locale}/menu`} className="group inline-flex min-h-10 items-center gap-2 text-sm font-bold text-orange-600">{t.menu.viewAll}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {localizedDishes.map((dish) => <article key={dish.name} className="group flex h-full flex-col overflow-hidden rounded-lg border border-[#ddd8cd] bg-[#f7f5f0] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform hover:-translate-y-1 hover:shadow-2xl"><div className="relative h-64 shrink-0 overflow-hidden"><ThemeAwareBackground darkSrc={dish.image} lightSrc={dish.lightImage} className="will-change-transform group-hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" /><span className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">{dish.label}</span></div><div className="flex flex-1 flex-col p-5"><div className="flex min-h-14 items-start justify-between gap-3"><h3 className="text-lg font-bold leading-6">{dish.name}</h3><span className="whitespace-nowrap text-sm font-black text-orange-600">{dish.price}</span></div><p className="mt-2 flex-1 text-sm leading-6 text-[#687078]">{dish.description}</p><Link href={`/${locale}/menu`} className="mt-5 flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#ddd8cd] text-sm font-bold text-[#151a1e] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-orange-500 hover:bg-orange-500/10 hover:text-orange-600">{t.menu.viewAll} <ArrowUpRight className="h-4 w-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1 group-hover:-translate-y-0.5" /></Link></div></article>)}
          </div>
        </div>
      </section>
    </>
  );
}
