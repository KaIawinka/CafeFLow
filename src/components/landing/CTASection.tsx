import type { LandingTranslations } from './types';

interface CTASectionProps {
  t: LandingTranslations;
}

export function CTASection({ t }: CTASectionProps) {
  return (
    <section id="reservation" className="py-24 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h2 className="text-4xl font-bold mb-4">{t.reservation.title}</h2>
          <p className="text-xl mb-8 opacity-90">{t.reservation.subtitle}</p>
          <a href="#" className="inline-flex px-10 py-4 bg-white text-amber-900 rounded-xl font-bold text-lg hover:bg-amber-50 transition-all shadow-lg">
            {t.reservation.button}
          </a>
        </div>
      </div>
    </section>
  );
}
