import { ArrowUpRight, ChefHat, Leaf, Sparkles, Utensils } from 'lucide-react';
import Link from 'next/link';
import type { Locale } from '@/app/i18n/config';
import type { LandingTranslations } from './types';

interface FeaturesSectionProps {
  t: LandingTranslations;
  locale: Locale;
}

const dishes = {
  ru: [{ name: 'Флэт уайт', description: 'Двойной эспрессо и шелковистое молоко', label: 'Утренний ритуал' }, { name: 'Тост с авокадо', description: 'Закваска, авокадо и яйцо пашот', label: 'Хит продаж' }, { name: 'Боул с лососем', description: 'Рис, эдамаме, лосось и кунжутный соус', label: 'Выбор шефа' }, { name: 'Чизкейк с ягодами', description: 'Нежный крем и соус из сезонных ягод', label: 'Сладкий финал' }],
  en: [{ name: 'Flat white', description: 'Double espresso and silky milk', label: 'Morning ritual' }, { name: 'Avocado toast', description: 'Sourdough, avocado, and poached egg', label: 'Best seller' }, { name: 'Salmon bowl', description: 'Rice, edamame, salmon, and sesame sauce', label: 'Chef pick' }, { name: 'Berry cheesecake', description: 'Creamy cheesecake with seasonal berries', label: 'Sweet finish' }],
  kg: [{ name: 'Флэт уайт', description: 'Кош эспрессо жана жумшак сүт', label: 'Эртең мененки даам' }, { name: 'Авокадо тосту', description: 'Кычкыл нан, авокадо жана пашот жумурткасы', label: 'Сатуу лидери' }, { name: 'Лосось боулу', description: 'Күрүч, эдамаме, лосось жана кунжут соусу', label: 'Ашпозчунун тандоосу' }, { name: 'Мөмөлүү чизкейк', description: 'Жумшак крем жана сезондук мөмө соусу', label: 'Таттуу финал' }],
} as const;

const dishMeta = [
  { price: '180 сом', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=85' },
  { price: '420 сом', image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?auto=format&fit=crop&w=900&q=85' },
  { price: '680 сом', image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=900&q=85' },
  { price: '320 сом', image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=900&q=85' },
];

const storyCopy = { ru: { eyebrow: 'Наша история', text: 'Мы собираем людей за одним столом и превращаем обычный день в маленькое событие. Локальные продукты, открытая кухня и команда, которая помнит ваши любимые блюда.', fresh: 'Свежие продукты', daily: 'Каждое утро', chefs: 'Сильная команда', experience: '10+ лет опыта', ambience: 'Тёплая атмосфера', meetings: 'Для важных встреч', service: 'Быстрый сервис', wait: 'Без ожидания', years: 'Лет опыта' }, en: { eyebrow: 'Our story', text: 'We bring people together around one table and turn an ordinary day into a small occasion. Local ingredients, an open kitchen, and a team that remembers your favorites.', fresh: 'Fresh ingredients', daily: 'Every morning', chefs: 'Skilled chefs', experience: '10+ years of craft', ambience: 'Warm ambience', meetings: 'For important moments', service: 'Fast service', wait: 'No long waits', years: 'Years of experience' }, kg: { eyebrow: 'Биздин тарых', text: 'Биз адамдарды бир дасторкондо чогултуп, кадимки күндү кичинекей майрамга айлантабыз. Жергиликтүү азыктар, ачык ашкана жана сүйүктүү тамактарыңызды эстеген команда.', fresh: 'Жаңы азыктар', daily: 'Ар бир эртең менен', chefs: 'Чебер ашпозчулар', experience: '10+ жылдык тажрыйба', ambience: 'Жылуу атмосфера', meetings: 'Маанилүү жолугушуулар үчүн', service: 'Тез тейлөө', wait: 'Күтүүсүз', years: 'Жылдык тажрыйба' } } as const;

export function FeaturesSection({ t, locale }: FeaturesSectionProps) {
  const copy = storyCopy[locale];
  const localizedDishes = dishes[locale].map((dish, index) => ({ ...dish, ...dishMeta[index] }));
  return (
    <>
      <section id="about" className="relative overflow-hidden bg-[#f7f5f0] py-20 text-[#151a1e] sm:py-28">
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
            <div className="absolute right-0 top-0 h-[360px] w-[88%] overflow-hidden rounded-[1.5rem] bg-[#20272c] shadow-2xl shadow-[#151a1e]/15 sm:h-[440px]"><div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=1200&q=90')] bg-cover bg-center transition-transform duration-700 hover:scale-105" /><div className="absolute inset-0 bg-gradient-to-t from-[#151a1e]/70 to-transparent" /></div>
            <div className="absolute bottom-0 left-0 flex items-center gap-4 rounded-lg bg-[#fffdf8] p-5 shadow-xl sm:p-6"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-white"><ChefHat className="h-7 w-7" /></div><div><p className="text-3xl font-black text-orange-600">10+</p><p className="text-xs font-bold uppercase tracking-wider text-[#687078]">{copy.years}</p></div></div>
          </div>
        </div>
      </section>

      <section id="menu" className="bg-[#fffdf8] py-20 text-[#151a1e] sm:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mb-10 flex flex-col justify-between gap-5 sm:mb-14 sm:flex-row sm:items-end"><div><p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-600">From our kitchen</p><h2 className="text-4xl font-black sm:text-6xl">{t.menu.title}</h2><p className="mt-3 max-w-lg text-[#687078]">{t.menu.subtitle}</p></div><Link href={`/${locale}/menu`} className="group inline-flex min-h-10 items-center gap-2 text-sm font-bold text-orange-600">{t.menu.viewAll}<ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" /></Link></div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {localizedDishes.map((dish) => <article key={dish.name} className="group overflow-hidden rounded-lg border border-[#ddd8cd] bg-[#f7f5f0] transition duration-300 hover:-translate-y-2 hover:shadow-2xl"><div className="relative h-64 overflow-hidden"><div className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110" style={{ backgroundImage: `url(${dish.image})` }} /><div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" /><span className="absolute left-4 top-4 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">{dish.label}</span></div><div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-bold">{dish.name}</h3><span className="whitespace-nowrap text-sm font-black text-orange-600">{dish.price}</span></div><p className="mt-2 text-sm leading-6 text-[#687078]">{dish.description}</p><Link href={`/${locale}/menu`} className="mt-5 flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#ddd8cd] text-sm font-bold text-[#151a1e] transition hover:border-orange-500 hover:text-orange-600">{t.menu.viewAll} <ArrowUpRight className="h-4 w-4" /></Link></div></article>)}
          </div>
        </div>
      </section>
    </>
  );
}
