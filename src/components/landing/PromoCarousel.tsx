'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgePercent, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/app/i18n/config';

type Promo = { eyebrow: string; title: string; detail: string; action: string; href: string; image: string; tag: string };

const promos: Record<Locale, Promo[]> = {
  ru: [
    { eyebrow: 'Хит недели', title: 'Завтрак для двоих со скидкой 20%', detail: 'Свежая выпечка, кофе и спокойное утро каждый день до 12:00.', action: 'Открыть меню', href: 'menu', tag: '20% OFF', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1500&q=90' },
    { eyebrow: 'Новинка сезона', title: 'Вкус, который хочется запомнить', detail: 'Локальные продукты и новые блюда от нашей команды шефов.', action: 'Попробовать', href: 'menu', tag: 'NEW MENU', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1500&q=90' },
    { eyebrow: 'Для особых вечеров', title: 'Ваш стол уже ждёт', detail: 'Выберите удобное время и получите комплимент от заведения.', action: 'Забронировать', href: 'booking', tag: 'BOOK NOW', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1500&q=90' },
  ],
  en: [
    { eyebrow: 'Weekly favorite', title: 'Breakfast for two with 20% off', detail: 'Fresh pastries, coffee, and an easy morning every day until noon.', action: 'Open menu', href: 'menu', tag: '20% OFF', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1500&q=90' },
    { eyebrow: 'Seasonal new', title: 'A flavor worth remembering', detail: 'Local ingredients and new dishes from our chef team.', action: 'Try it', href: 'menu', tag: 'NEW MENU', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1500&q=90' },
    { eyebrow: 'Special evenings', title: 'Your table is waiting', detail: 'Pick a time and receive a small treat from the house.', action: 'Book a table', href: 'booking', tag: 'BOOK NOW', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1500&q=90' },
  ],
  kg: [
    { eyebrow: 'Аптанын сунушу', title: 'Эки кишилик эртең мененкиге 20% арзандатуу', detail: 'Күн сайын түшкө чейин жаңы нан, кофе жана жайлуу таң.', action: 'Менюну ачуу', href: 'menu', tag: '20% OFF', image: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?auto=format&fit=crop&w=1500&q=90' },
    { eyebrow: 'Мезгилдик жаңылык', title: 'Эсте кала турган даам', detail: 'Жергиликтүү азыктар жана ашпозчулар тобунун жаңы тамактары.', action: 'Даамын татуу', href: 'menu', tag: 'NEW MENU', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1500&q=90' },
    { eyebrow: 'Өзгөчө кечелер үчүн', title: 'Сиздин столуңуз даяр', detail: 'Ыңгайлуу убакытты тандап, үйдөн чакан белек алыңыз.', action: 'Брондоо', href: 'booking', tag: 'BOOK NOW', image: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1500&q=90' },
  ],
};

const icons = [BadgePercent, Sparkles, Star];
export function PromoCarousel({ locale }: { locale: Locale }) {
  const items = promos[locale];
  const [active, setActive] = useState(0);
  const item = items[active];
  const Icon = icons[active];

  const move = (direction: 1 | -1) => setActive((current) => (current + direction + items.length) % items.length);

  useEffect(() => {
    const timer = window.setInterval(() => setActive((current) => (current + 1) % items.length), 6000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  return (
    <section id="promotions" className="relative z-10 mx-auto -mt-12 w-[calc(100%-2rem)] max-w-6xl scroll-mt-28 sm:-mt-20 sm:w-[calc(100%-3rem)]">
      <div className="relative min-h-[360px] overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#151a1e] text-white shadow-[0_24px_70px_rgba(21,26,30,0.32)] sm:min-h-[390px]">
        <div key={active} className="absolute inset-0 carousel-slide" style={{ backgroundImage: `url(${item.image})` }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,13,15,0.94)_0%,rgba(10,13,15,0.68)_48%,rgba(10,13,15,0.18)_100%)]" />
        <div className="relative flex min-h-[360px] flex-col justify-between p-7 sm:min-h-[390px] sm:p-10 lg:p-14">
          <div className="flex items-start justify-between gap-5"><div className="flex items-center gap-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f97316] text-white shadow-lg"><Icon className="h-5 w-5" /></div><p className="text-xs font-bold uppercase tracking-[0.22em] text-[#fdba74]">{item.eyebrow}</p></div><span className="rounded-full border border-white/25 bg-black/20 px-3 py-1.5 text-[10px] font-black tracking-[0.18em] text-white/80 backdrop-blur-sm">{item.tag}</span></div>
          <div key={`copy-${active}`} className="max-w-2xl carousel-copy"><h2 className="max-w-xl text-3xl font-black leading-tight sm:text-5xl">{item.title}</h2><p className="mt-4 max-w-lg text-sm leading-6 text-white/70 sm:text-base">{item.detail}</p><Link href={`/${locale}/${item.href}`} className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-md bg-[#f97316] px-5 text-sm font-bold text-white transition hover:bg-[#ea580c]">{item.action}<ArrowRight className="h-4 w-4" /></Link></div>
          <div className="flex items-end justify-end gap-2"><button type="button" onClick={() => move(-1)} aria-label="Previous promotion" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/20 transition hover:border-[#f97316] hover:bg-[#f97316]"><ArrowLeft className="h-4 w-4" /></button><div className="flex items-center gap-1.5 px-2">{items.map((promo, index) => <button key={promo.title} type="button" onClick={() => setActive(index)} aria-label={`Slide ${index + 1}`} className={`h-1.5 rounded-full transition-all ${active === index ? 'w-10 bg-[#f97316]' : 'w-2 bg-white/35'}`} />)}</div><button type="button" onClick={() => move(1)} aria-label="Next promotion" className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/20 transition hover:border-[#f97316] hover:bg-[#f97316]"><ArrowRight className="h-4 w-4" /></button></div>
        </div>
      </div>
    </section>
  );
}
