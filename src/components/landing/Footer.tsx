import Link from "next/link";
import type { LandingTranslations } from './types';

interface FooterProps {
  t: LandingTranslations;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer id="contact" className="bg-white text-zinc-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-12 mb-12">
          <div>
            <h3 className="text-2xl font-bold mb-4 text-amber-700">CaféFlow</h3>
            <p className="text-zinc-600">{t.about.description}</p>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 text-zinc-900">{t.contact.title}</h4>
            <div className="space-y-2 text-zinc-600">
              <p>{t.contact.address}: г. Бишкек, ул. Примерная 123</p>
              <p>{t.contact.phone}: +996 XXX XXX XXX</p>
              <p>{t.contact.hours}: 09:00 - 22:00</p>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-lg mb-4 text-zinc-900">Навигация</h4>
            <ul className="space-y-2">
              <li><Link href="#menu" className="text-zinc-600 hover:text-amber-700">{t.footer.menu}</Link></li>
              <li><Link href="#reservation" className="text-zinc-600 hover:text-amber-700">{t.footer.reservation}</Link></li>
              <li><Link href="#about" className="text-zinc-600 hover:text-amber-700">{t.footer.about}</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-zinc-200 pt-8 text-center text-zinc-500">
          © {new Date().getFullYear()} CaféFlow. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}
