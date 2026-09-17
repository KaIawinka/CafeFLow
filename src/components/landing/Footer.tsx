import Link from "next/link";
import { Camera, MessageCircle, Send } from 'lucide-react';
import type { LandingTranslations } from './types';

interface FooterProps {
  t: LandingTranslations;
}

export function Footer({ t }: FooterProps) {
  return (
    <footer id="contact" className="bg-[#151a1e] py-12 text-white sm:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 grid gap-8 sm:gap-12 md:grid-cols-3">
          <div>
            <h3 className="mb-4 text-2xl font-bold text-[#f5c98a]">CaféFlow</h3>
            <p className="text-white/60">{t.about.description}</p>
            <p className="mt-5 max-w-xs text-sm leading-6 text-white/45">Завтраки, ужины и встречи в уютном пространстве с вниманием к каждой детали.</p>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">{t.contact.title}</h4>
            <div className="space-y-2 text-white/60">
              <p>{t.contact.address}: г. Бишкек, ул. Примерная 123</p>
              <p>{t.contact.phone}: +996 XXX XXX XXX</p>
              <p>{t.contact.hours}: 09:00 - 22:00</p>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Навигация</h4>
            <ul className="space-y-2">
              <li><Link href="#menu" className="text-white/60 hover:text-[#f5c98a]">{t.footer.menu}</Link></li>
              <li><Link href="#reservation" className="text-white/60 hover:text-[#f5c98a]">{t.footer.reservation}</Link></li>
              <li><Link href="#about" className="text-white/60 hover:text-[#f5c98a]">{t.footer.about}</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col gap-6 border-t border-white/10 pt-8 text-sm text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><span>© {new Date().getFullYear()} CaféFlow.</span><span>{t.footer.rights}</span></div>
          <div className="flex items-center gap-2"><a aria-label="WhatsApp" href="https://wa.me/996555000000" className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 hover:border-[#f5c98a] hover:text-[#f5c98a]"><MessageCircle className="h-4 w-4" /></a><a aria-label="Instagram" href="https://instagram.com" className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 hover:border-[#f5c98a] hover:text-[#f5c98a]"><Camera className="h-4 w-4" /></a><a aria-label="Telegram" href="https://t.me" className="flex h-10 w-10 items-center justify-center rounded-md border border-white/15 hover:border-[#f5c98a] hover:text-[#f5c98a]"><Send className="h-4 w-4" /></a></div>
        </div>
      </div>
    </footer>
  );
}
