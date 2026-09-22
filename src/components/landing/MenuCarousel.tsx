'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/app/i18n/config';
import { ThemeAwareBackground } from './ThemeAwareBackground';

type Dish = {
  name: string;
  description: string;
  label: string;
  price: string;
  image: string;
  lightImage: string;
};

export function MenuCarousel({ dishes, locale, viewAll }: { dishes: Dish[]; locale: Locale; viewAll: string }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const move = (direction: 1 | -1) => setActive((current) => (current + direction + dishes.length) % dishes.length);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % dishes.length), 5000);
    return () => window.clearInterval(timer);
  }, [paused, dishes.length]);

  return (
    <div className="landing-menu-carousel" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="landing-menu-carousel__viewport">
        <div className="landing-menu-carousel__track" style={{ transform: `translateX(calc(${active} * (var(--menu-slide-width) + var(--menu-slide-gap)) * -1))` }}>
          {dishes.map((dish, index) => (
            <article key={dish.name} className={`landing-menu-carousel__slide ${index === active ? 'is-active' : ''}`}>
              <div className="landing-menu-card group/menu-card relative flex h-full flex-col overflow-hidden rounded-lg bg-[#f7f5f0] p-[2px]">
                <div className="landing-menu-card__glow" />
                <div className="relative z-[1] flex h-full flex-col overflow-hidden rounded-[calc(0.5rem-1px)] bg-[#f7f5f0]">
                  <div className="relative h-64 shrink-0 overflow-hidden"><ThemeAwareBackground darkSrc={dish.image} lightSrc={dish.lightImage} /><div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" /><span className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">{dish.label}</span></div>
                  <div className="flex flex-1 flex-col p-5"><div className="flex min-h-14 items-start justify-between gap-3"><h3 className="text-lg font-bold leading-6">{dish.name}</h3><span className="whitespace-nowrap text-sm font-black text-orange-600">{dish.price}</span></div><p className="mt-2 flex-1 text-sm leading-6 text-[#687078]">{dish.description}</p><Link href={`/${locale}/menu`} className="landing-menu-card__action group/menu-action mt-5 flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#ddd8cd] text-sm font-bold text-[#151a1e]">{viewAll}<ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover/menu-action:translate-x-1 group-hover/menu-action:-translate-y-0.5" /></Link></div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
      <div className="landing-menu-carousel__controls"><button type="button" onClick={() => move(-1)} aria-label="Previous dish"><ArrowLeft className="h-4 w-4" /></button><div className="landing-menu-carousel__dots">{dishes.map((dish, index) => <button type="button" key={dish.name} onClick={() => setActive(index)} aria-label={`${dish.name} ${index + 1}`} className={index === active ? 'is-active' : ''} />)}</div><button type="button" onClick={() => move(1)} aria-label="Next dish"><ArrowRight className="h-4 w-4" /></button></div>
    </div>
  );
}
