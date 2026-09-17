'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, BadgePercent, Clock3, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/app/i18n/config';

const promos: Record<Locale, Array<{ eyebrow: string; title: string; detail: string; action: string }>> = {
  ru: [
    { eyebrow: 'Хит недели', title: 'Завтрак для двоих со скидкой 20%', detail: 'Каждый день до 12:00. Свежая выпечка, кофе и спокойное утро.', action: 'Открыть меню' },
    { eyebrow: 'Новинка', title: 'Сезонное меню уже в CaféFlow', detail: 'Тёплые вкусы, локальные продукты и блюда от нашего шефа.', action: 'Попробовать' },
    { eyebrow: 'Для гостей', title: 'Бронируйте стол заранее', detail: 'Выберите удобное время и получите комплимент от заведения.', action: 'Забронировать' },
  ],
  en: [
    { eyebrow: 'Weekly favorite', title: 'Breakfast for two with 20% off', detail: 'Every day until noon. Fresh pastries, coffee, and an easy morning.', action: 'Open menu' },
    { eyebrow: 'New', title: 'The seasonal menu has arrived', detail: 'Warm flavors, local ingredients, and dishes from our chef.', action: 'Try it' },
    { eyebrow: 'For guests', title: 'Reserve your table ahead', detail: 'Choose a time and receive a small treat from the house.', action: 'Book a table' },
  ],
  kg: [
    { eyebrow: 'Аптанын сунушу', title: 'Эки кишилик эртең мененкиге 20% арзандатуу', detail: 'Күн сайын түшкө чейин. Жаңы нан, кофе жана жайлуу таң.', action: 'Менюну ачуу' },
    { eyebrow: 'Жаңы', title: 'Мезгилдик меню CaféFlowдо', detail: 'Жылуу даамдар, жергиликтүү азыктар жана ашпозчунун тамактары.', action: 'Даамын татуу' },
    { eyebrow: 'Коноктор үчүн', title: 'Столду алдын ала брондоңуз', detail: 'Ыңгайлуу убакытты тандап, үйдөн чакан белек алыңыз.', action: 'Брондоо' },
  ],
};

const icons = [BadgePercent, Sparkles, Star];
const statusLabels: Record<Locale, { paused: string; auto: string }> = {
  ru: { paused: 'Пауза', auto: 'Автообновление' },
  en: { paused: 'Paused', auto: 'Auto-rotating' },
  kg: { paused: 'Тыныгуу', auto: 'Автоматтык жаңыртуу' },
};

export function PromoCarousel({ locale }: { locale: Locale }) {
  const items = promos[locale];
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % items.length), 5000);
    return () => window.clearInterval(timer);
  }, [items.length, paused]);

  const Icon = icons[active];
  const item = items[active];

  return (
    <section className="relative z-10 mx-auto -mt-10 w-[calc(100%-2rem)] max-w-5xl sm:-mt-14 sm:w-[calc(100%-3rem)]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="overflow-hidden rounded-lg border border-white/15 bg-[#20272c] text-white shadow-[0_20px_50px_rgba(21,26,30,0.22)]">
        <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-[#e76f51] text-white"><Icon className="h-6 w-6" /></div>
          <div key={active} className="animate-in space-y-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#f5c98a]">{item.eyebrow}</p>
            <h2 className="text-xl font-bold sm:text-2xl">{item.title}</h2>
            <p className="text-sm text-white/65">{item.detail}</p>
          </div>
          <Link href="#menu" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[#f5c98a] px-4 text-sm font-bold text-[#63391f] transition hover:bg-white">
            {item.action}<ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-3 sm:px-8">
          <div className="flex items-center gap-2 text-xs text-white/50"><Clock3 className="h-3.5 w-3.5" />{paused ? statusLabels[locale].paused : statusLabels[locale].auto}</div>
          <div className="flex gap-1.5" aria-label="Promo slides">
            {items.map((promo, index) => <button key={promo.title} type="button" onClick={() => setActive(index)} aria-label={`Slide ${index + 1}`} className={`h-1.5 rounded-full transition-all ${index === active ? 'w-8 bg-[#e76f51]' : 'w-2 bg-white/30'}`} />)}
          </div>
        </div>
      </div>
    </section>
  );
}
