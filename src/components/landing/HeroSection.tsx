import Image from "next/image";
import Link from "next/link";

interface HeroSectionProps {
  t: any;
}

export function HeroSection({ t }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:from-zinc-950 dark:via-black dark:to-zinc-900">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                {t.hero.badge}
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
                <span className="text-zinc-900 dark:text-white">
                  {t.hero.title}
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400">
                  {t.hero.subtitle}
                </span>
              </h1>
              
              <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
                {t.hero.description}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#demo"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-lg hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                {t.hero.cta.primary}
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white font-semibold text-lg border-2 border-zinc-200 dark:border-zinc-700 hover:border-amber-600 dark:hover:border-amber-500 transition-all"
              >
                {t.hero.cta.secondary}
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8">
              <div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">50+</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">{t.stats.clients}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">10K+</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">{t.stats.orders}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">60%</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">{t.stats.time}</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-zinc-900 dark:text-white">+35%</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">{t.stats.revenue}</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative lg:h-[600px]">
            <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 dark:from-amber-500/10 dark:to-orange-500/10 rounded-3xl blur-3xl" />
            <div className="relative h-full flex items-center justify-center">
              <div className="relative w-full max-w-md aspect-[9/16] bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 rounded-3xl shadow-2xl border-8 border-zinc-300 dark:border-zinc-700 overflow-hidden">
                {/* Mockup content */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-white dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between px-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-500" />
                    <div>
                      <div className="text-sm font-semibold text-zinc-900 dark:text-white">CaféFlow</div>
                      <div className="text-xs text-zinc-500">Demo Restaurant</div>
                    </div>
                  </div>
                </div>
                <div className="pt-24 pb-6 px-6 space-y-4">
                  <div className="h-32 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl" />
                  <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
                  <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
                  <div className="h-24 bg-zinc-100 dark:bg-zinc-800 rounded-2xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
