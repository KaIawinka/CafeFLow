import type { LandingTranslations } from './types';

interface CTASectionProps {
  t: LandingTranslations;
}

export function CTASection({ t }: CTASectionProps) {
  return (
    <section id="reservation" className="bg-background py-16 dark:bg-slate-900 sm:py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500 to-orange-600 p-7 text-center text-white shadow-2xl sm:p-12">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t.reservation.title}</h2>
          <p className="mb-8 text-base opacity-90 sm:text-xl">{t.reservation.subtitle}</p>
          <a href="#" className="inline-flex min-h-12 items-center rounded-xl bg-white px-7 py-3 text-base font-bold text-amber-900 shadow-lg transition-all hover:bg-amber-50 sm:px-10 sm:py-4 sm:text-lg">
            {t.reservation.button}
          </a>
        </div>
      </div>
    </section>
  );
}
