import Link from "next/link";
import Image from "next/image";
import { type Locale } from "@/app/i18n/config";
import { getTranslations } from "@/app/i18n/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations(locale, "common");
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-xl transition-shadow">
              C
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">
              CaféFlow
            </span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href="#features" 
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              {t.nav.features}
            </Link>
            <Link 
              href="#pricing" 
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              {t.nav.pricing}
            </Link>
            <Link 
              href="#demo" 
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              {t.nav.demo}
            </Link>
            <Link 
              href="#contact" 
              className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              {t.nav.contact}
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLocale={locale} />
            <Link
              href="#demo"
              className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold text-sm hover:from-amber-700 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
            >
              Запросить демо
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
