'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgePercent, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/app/i18n/config';
import { getLocaleTranslations } from '@/app/i18n/catalog';
import { ThemeAwareBackground } from './ThemeAwareBackground';

const promoMeta = [
  {
    href: 'menu',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 600"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23f97316;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23ea580c;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1500" height="600" fill="url(%23g1)"/%3E%3C/svg%3E',
    lightImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 600"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23fed7aa;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23fdba74;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1500" height="600" fill="url(%23g1)"/%3E%3C/svg%3E',
  },
  {
    href: 'menu',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 600"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%236b4423;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23443018;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1500" height="600" fill="url(%23g1)"/%3E%3C/svg%3E',
    lightImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 600"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23d2a679;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23b88c5a;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1500" height="600" fill="url(%23g1)"/%3E%3C/svg%3E',
  },
  {
    href: 'booking',
    image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 600"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23dc2626;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%239f1239;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1500" height="600" fill="url(%23g1)"/%3E%3C/svg%3E',
    lightImage: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1500 600"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23fca5a5;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23fda4af;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="1500" height="600" fill="url(%23g1)"/%3E%3C/svg%3E',
  },
];

const icons = [BadgePercent, Sparkles, Star];
export function PromoCarousel({ locale }: { locale: Locale }) {
  const landing = getLocaleTranslations(locale).landing;
  const items = landing.promotions.items.map((item, index) => ({ ...item, ...promoMeta[index] }));
  const [active, setActive] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const item = items[active];
  const Icon = icons[active];

  const move = (direction: 1 | -1) => setActive((current) => (current + direction + items.length) % items.length);

  useEffect(() => {
    if (isPaused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % items.length), 6000);
    return () => window.clearInterval(timer);
  }, [isPaused, items.length]);

  return (
    <section id="promotions" className="relative z-10 mx-auto -mt-12 w-[calc(100%-2rem)] max-w-6xl scroll-mt-28 sm:-mt-20 sm:w-[calc(100%-3rem)]">
      <div className="relative min-h-[360px] overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#151a1e] text-white shadow-[0_24px_70px_rgba(21,26,30,0.32)] sm:min-h-[390px]" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <div key={active} className="absolute inset-0 z-0 h-full w-full carousel-slide">
          <ThemeAwareBackground darkSrc={item.image} lightSrc={item.lightImage} className="h-full w-full" />
        </div>
        <div className="pointer-events-none absolute inset-0 z-[1] carousel-film-sheen" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 z-[1] carousel-film-grain" aria-hidden="true" />
        <div className="pointer-events-none absolute right-[12%] top-[18%] z-[2] hidden h-16 w-28 -rotate-12 sm:block" aria-hidden="true">
          <span className="carousel-motion-line carousel-motion-line--one" />
          <span className="carousel-motion-line carousel-motion-line--two" />
          <span className="carousel-motion-line carousel-motion-line--three" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,13,15,0.94)_0%,rgba(10,13,15,0.68)_48%,rgba(10,13,15,0.18)_100%)]" />
        <div className="relative flex min-h-[360px] flex-col justify-between p-7 sm:min-h-[390px] sm:p-10 lg:p-14">
          <div className="flex items-start justify-between gap-5"><div className="flex items-center gap-3"><div className="carousel-icon flex h-12 w-12 items-center justify-center rounded-full bg-[#f97316] text-white shadow-lg"><Icon className="h-5 w-5" /></div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#fdba74]">{item.eyebrow}</p></div><span className="rounded-full border border-white/25 bg-black/20 px-3 py-1.5 text-[10px] font-black tracking-[0.18em] text-white/80 backdrop-blur-sm">{item.tag}</span></div>
          <div key={`copy-${active}`} className="max-w-2xl carousel-copy"><h2 className="max-w-xl text-3xl font-black leading-tight sm:text-5xl">{item.title}</h2><p className="mt-4 max-w-lg text-sm leading-6 text-white/70 sm:text-base">{item.detail}</p><Link href={`/${locale}/${item.href}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#f97316] px-5 text-sm font-bold text-white transition hover:bg-[#ea580c]">{item.action}<ArrowRight className="h-4 w-4" /></Link></div>
          <div className="flex items-end justify-end gap-2"><button type="button" onClick={() => move(-1)} aria-label={landing.promotions.previous} className="carousel-control flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/20 transition hover:border-[#f97316] hover:bg-[#f97316]"><ArrowLeft className="h-4 w-4" /></button><div className="flex items-center gap-1.5 px-2">{items.map((promo, index) => <button key={promo.title} type="button" onClick={() => setActive(index)} aria-label={`${landing.promotions.slide} ${index + 1}`} className={`h-1.5 rounded-full transition-all ${active === index ? 'w-10 bg-[#f97316]' : 'w-2 bg-white/35'}`} />)}</div><button type="button" onClick={() => move(1)} aria-label={landing.promotions.next} className="carousel-control flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/20 transition hover:border-[#f97316] hover:bg-[#f97316]"><ArrowRight className="h-4 w-4" /></button></div>
        </div>
      </div>
    </section>
  );
}
