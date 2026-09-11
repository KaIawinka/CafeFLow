import Link from "next/link";
import { type Locale } from "@/app/i18n/config";
import { getTranslations } from "@/app/i18n/utils";
import { LanguageSwitcher } from "./LanguageSwitcher";

export async function Header({ locale }: { locale: Locale }) {
  const t = await getTranslations(locale, "common");
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href={`/${locale}`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-xl">
              C
            </div>
            <span className="text-xl font-bold text-zinc-900 dark:text-white">CaféFlow</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#menu" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-amber-600 transition-colors">
              {t.nav.features}
            </Link>
            <Link href="#reservation" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-amber-600 transition-colors">
              {t.nav.pricing}
            </Link>
            <Link href="#contact" className="text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-amber-600 transition-colors">
              {t.nav.contact}
            </Link>
          </nav>

          <LanguageSwitcher currentLocale={locale} />
        </div>
      </div>
    </header>
  );
}
