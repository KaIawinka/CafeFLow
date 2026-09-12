"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, localeNames, type Locale } from "@/app/i18n/config";
import { setLocaleCookie } from "@/app/i18n/utils";

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  const switchLocale = (newLocale: Locale) => {
    const segments = pathname.split("/").filter(Boolean);
    
    // Убираем текущую локаль из пути
    if (locales.includes(segments[0] as Locale)) {
      segments.shift();
    }
    
    // Формируем новый путь с новой локалью
    // Сохраняем выбранную локаль в cookie
    setLocaleCookie(newLocale);

    if (!locales.includes(pathname.split('/')[1] as Locale)) {
      router.refresh();
      return;
    }

    const newPath = `/${newLocale}${segments.length ? "/" + segments.join("/") : ""}`;
    router.push(newPath);
  };

  return (
    <div className="flex gap-2">
      {locales.map((locale) => (
        <button
          key={locale}
          onClick={() => switchLocale(locale)}
          className={`px-3 py-1 rounded transition-colors ${
            currentLocale === locale
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          }`}
        >
          {localeNames[locale]}
        </button>
      ))}
    </div>
  );
}
