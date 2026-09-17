import Link from 'next/link';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { Locale } from '@/app/i18n/config';
import type { LandingTranslations } from './types';

interface CTASectionProps {
  t: LandingTranslations;
  locale: Locale;
}

export function CTASection({ t, locale }: CTASectionProps) {
  return (
    <section id="reservation" className="bg-[#f7f5f0] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-12">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[1.5rem] bg-[#151a1e] text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519671282429-b44660ead0a7?auto=format&fit=crop&w=1800&q=85')] bg-cover bg-center opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#151a1e] via-[#151a1e]/80 to-transparent" />
        <div className="relative flex min-h-[300px] flex-col justify-center gap-8 px-7 py-12 sm:px-12 lg:flex-row lg:items-center lg:justify-between lg:px-16">
          <div className="max-w-xl"><div className="mb-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-orange-300"><CalendarDays className="h-4 w-4" /> Make it memorable</div><h2 className="text-4xl font-black leading-tight sm:text-5xl">{t.reservation.title}</h2><p className="mt-4 text-base leading-7 text-white/65 sm:text-lg">{t.reservation.subtitle}</p></div>
          <Link href={`/${locale}/booking`} className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-md bg-orange-500 px-6 py-4 text-sm font-bold text-white transition hover:-translate-y-1 hover:bg-orange-600 sm:px-8">{t.reservation.button}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
        </div>
      </div>
    </section>
  );
}
