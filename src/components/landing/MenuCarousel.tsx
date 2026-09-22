'use client';

import { useEffect, useRef } from 'react';
import { ArrowUpRight } from 'lucide-react';
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
  const trackRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef(0);
  const pausedRef = useRef(false);
  const frameRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const visibleDishes = dishes.slice(0, 3);
  const loopDishes = [...visibleDishes, ...visibleDishes];

  useEffect(() => {
    const animate = (timestamp: number) => {
      const elapsed = lastFrameRef.current === null ? 16 : timestamp - lastFrameRef.current;
      lastFrameRef.current = timestamp;
      const firstCard = trackRef.current?.firstElementChild as HTMLElement | null;
      const loopWidth = firstCard ? (firstCard.offsetWidth + 16) * visibleDishes.length : 0;
      if (!pausedRef.current && loopWidth > 0) {
        offsetRef.current = (offsetRef.current + elapsed * 0.035) % loopWidth;
      }
      if (trackRef.current) trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
      frameRef.current = window.requestAnimationFrame(animate);
    };
    frameRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      lastFrameRef.current = null;
    };
  }, [visibleDishes.length]);

  return (
    <div className="landing-menu-carousel" onMouseEnter={() => { pausedRef.current = true; }} onMouseLeave={() => { pausedRef.current = false; }}>
      <div className="landing-menu-carousel__viewport">
        <div ref={trackRef} className="landing-menu-carousel__track">
          {loopDishes.map((dish, index) => (
            <article key={`${dish.name}-${index}`} className="landing-menu-carousel__slide">
              <div className="landing-menu-card group/menu-card relative flex h-full flex-col overflow-hidden rounded-lg bg-[#f7f5f0] p-[2px]"><div className="landing-menu-card__glow" /><div className="relative z-[1] flex h-full flex-col overflow-hidden rounded-[calc(0.5rem-1px)] bg-[#f7f5f0]"><div className="relative h-64 shrink-0 overflow-hidden"><ThemeAwareBackground darkSrc={dish.image} lightSrc={dish.lightImage} /><div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" /><span className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">{dish.label}</span></div><div className="flex flex-1 flex-col p-5"><div className="flex min-h-14 items-start justify-between gap-3"><h3 className="text-lg font-bold leading-6">{dish.name}</h3><span className="whitespace-nowrap text-sm font-black text-orange-600">{dish.price}</span></div><p className="mt-2 flex-1 text-sm leading-6 text-[#687078]">{dish.description}</p><Link href={`/${locale}/menu`} className="landing-menu-card__action group/menu-action mt-5 flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-md border border-[#ddd8cd] text-sm font-bold text-[#151a1e]">{viewAll}<ArrowUpRight className="h-4 w-4 transition-transform duration-300 ease-out group-hover/menu-action:translate-x-1 group-hover/menu-action:-translate-y-0.5" /></Link></div></div></div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
