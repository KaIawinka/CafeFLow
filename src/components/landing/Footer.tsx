import Link from "next/link";
import type { LandingTranslations } from './types';

interface FooterProps {
  t: LandingTranslations;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer id="contact" className="bg-slate-50 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid gap-8 sm:gap-12 md:grid-cols-3">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-amber-700">CaféFlow</h3>
            <p className="text-slate-600 dark:text-slate-400">{t.about.description}</p>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">{t.contact.title}</h4>
            <div className="space-y-2 text-slate-600 dark:text-slate-400">
              <p>{t.contact.address}: г. Бишкек, ул. Примерная 123</p>
              <p>{t.contact.phone}: +996 XXX XXX XXX</p>
              <p>{t.contact.hours}: 09:00 - 22:00</p>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Навигация</h4>
            <ul className="space-y-2">
              <li><Link href="#menu" className="text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300">{t.footer.menu}</Link></li>
              <li><Link href="#reservation" className="text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300">{t.footer.reservation}</Link></li>
              <li><Link href="#about" className="text-slate-600 hover:text-amber-700 dark:text-slate-400 dark:hover:text-amber-300">{t.footer.about}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-8 text-center text-slate-500 dark:border-slate-800 dark:text-slate-500">
          © {new Date().getFullYear()} CaféFlow. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
