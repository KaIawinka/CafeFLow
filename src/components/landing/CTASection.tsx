import Link from "next/link";
import { ContactForm } from "./ContactForm";

interface CTASectionProps {
  t: any;
}

export function CTASection({ t }: CTASectionProps) {
  return (
    <section className="py-24 bg-gradient-to-br from-zinc-50 to-amber-50 dark:from-zinc-950 dark:to-zinc-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top CTA Banner */}
        <div id="demo" className="mb-16 py-16 px-8 bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 rounded-3xl relative overflow-hidden shadow-2xl">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-grid-white/[0.1]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl" />

          <div className="relative text-center">
            <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
              {t.cta.title}
            </h2>
            
            <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
              {t.cta.subtitle}
            </p>

            <p className="text-white/80 text-sm">
              ✓ {t.cta.note}
            </p>

            {/* Decorative elements */}
            <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl animate-pulse" />
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" />
          </div>
        </div>

        {/* Contact Form */}
        <div className="max-w-3xl mx-auto">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
