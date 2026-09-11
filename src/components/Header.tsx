import { type Locale } from "@/app/i18n/config";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header({ locale }: { locale: Locale }) {
  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-black dark:text-white">
              CafeFlow
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <LanguageSwitcher currentLocale={locale} />
          </div>
        </div>
      </div>
    </header>
  );
}
