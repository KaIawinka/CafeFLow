import Link from "next/link";
import Image from 'next/image';
import type { Locale } from '@/app/i18n/config';
import type { LandingTranslations } from './types';

interface FooterProps {
  t: LandingTranslations;
  locale: Locale;
}

const footerCopy = {
  ru: { detail: 'Завтраки, ужины и встречи в уютном пространстве с вниманием к каждой детали.', navigation: 'Навигация', hours: 'Часы работы', contacts: 'Контакты', weekdays: 'Пн — Пт · 10:00–23:00', weekends: 'Сб — Вс · 09:00–23:00', open: 'Мы открыты каждый день' },
  en: { detail: 'Breakfasts, dinners, and good conversations in a warm space where every detail matters.', navigation: 'Navigation', hours: 'Opening hours', contacts: 'Contact us', weekdays: 'Mon — Fri · 10:00–23:00', weekends: 'Sat — Sun · 09:00–23:00', open: 'We are open every day' },
  kg: { detail: 'Жылуу мейкиндикте эртең мененки тамак, кечки тамак жана маанилүү жолугушуулар.', navigation: 'Навигация', hours: 'Иш убактысы', contacts: 'Байланыштар', weekdays: 'Дш — Жм · 10:00–23:00', weekends: 'Иш — Жек · 09:00–23:00', open: 'Биз күн сайын ачыкпыз' },
} as const;

function WhatsAppMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M12 2a9.9 9.9 0 0 0-8.56 14.87L2 22l5.3-1.39A9.9 9.9 0 1 0 12 2Zm0 18a8.1 8.1 0 0 1-4.13-1.13l-.3-.18-3.15.83.84-3.07-.2-.32A8.1 8.1 0 1 1 12 20Zm4.43-6.06c-.24-.12-1.43-.7-1.65-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.31-.74-1.79-.2-.47-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.69 2.58 4.09 3.62.57.25 1.01.4 1.36.51.57.18 1.09.15 1.5.09.46-.07 1.43-.58 1.63-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" /></svg>;
}

function InstagramMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2Zm0 1.8A3.7 3.7 0 0 0 3.8 7.5v9a3.7 3.7 0 0 0 3.7 3.7h9a3.7 3.7 0 0 0 3.7-3.7v-9a3.7 3.7 0 0 0-3.7-3.7h-9Zm9.25 1.35a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 6.8A5.2 5.2 0 1 1 6.8 12 5.2 5.2 0 0 1 12 6.8Zm0 1.8A3.4 3.4 0 1 0 15.4 12 3.4 3.4 0 0 0 12 8.6Z" /></svg>;
}

function TelegramMark() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current"><path d="M21.7 3.6 18.6 20c-.23 1.16-.84 1.45-1.7.9l-4.7-3.46-2.27 2.18c-.25.25-.46.46-.94.46l.34-4.8 8.74-7.9c.38-.34-.08-.53-.59-.19L6.67 13.97l-4.65-1.46c-1.01-.32-1.03-1.01.21-1.5L20.4 3.02c.84-.31 1.58.19 1.3.58Z" /></svg>;
}

export function Footer({ t, locale }: FooterProps) {
  const copy = footerCopy[locale];
  return (
    <footer id="contact" className="footer-surface relative bg-[#151a1e] py-10 text-white sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <Image src="/cafeflow-logo.svg" alt="CaféFlow" width={44} height={44} className="h-11 w-11 rounded-md" />
            <div><h3 className="text-xl font-bold text-orange-300">CaféFlow</h3><p className="mt-1 max-w-sm text-sm text-white/50">{copy.detail}</p></div>
          </div>
          <div className="text-left sm:text-right"><p className="font-serif text-lg italic text-orange-300">{copy.open}</p><p className="mt-1 text-sm text-white/55">{copy.weekdays} · {copy.weekends}</p></div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-4 py-7 text-sm font-medium text-white/60 sm:justify-between">
          <div className="footer-table flex min-w-0 flex-1 flex-wrap items-start justify-between gap-7">
            <div className="min-w-[9rem]"><h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">{t.contact.title}</h4><div className="space-y-1.5 text-white/55"><p>{t.contact.address}: Бишкек</p><p>{t.contact.phone}: +996 XXX XXX XXX</p></div></div>
            <div className="min-w-[8rem]"><h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">{copy.navigation}</h4><div className="flex flex-col gap-1.5"><Link href="#menu" className="transition hover:text-orange-300">{t.footer.menu}</Link><Link href="#reservation" className="transition hover:text-orange-300">{t.footer.reservation}</Link><Link href="#about" className="transition hover:text-orange-300">{t.footer.about}</Link></div></div>
            <div className="min-w-[11rem]"><h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">{copy.hours}</h4><div className="space-y-1.5 text-white/55"><p>{copy.weekdays}</p><p>{copy.weekends}</p></div></div>
            <div className="min-w-[11rem]"><h4 className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-orange-300">{copy.contacts}</h4><div className="space-y-1.5 text-white/55"><p>+996 555 000 000</p><p>hello@cafeflow.kg</p><p>Бишкек, ул. Примерная 123</p></div></div>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-white/10 pt-6 text-sm text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3"><span>© {new Date().getFullYear()} CaféFlow.</span><span>{t.footer.rights}</span></div>
          <div className="flex items-center gap-2"><a aria-label="WhatsApp" href="https://wa.me/996555000000" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#25d366]/40 text-[#25d366] transition hover:border-[#25d366] hover:bg-[#25d366] hover:text-white"><WhatsAppMark /></a><a aria-label="Instagram" href="https://instagram.com" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#e4405f]/40 text-[#e4405f] transition hover:border-[#e4405f] hover:bg-[#e4405f] hover:text-white"><InstagramMark /></a><a aria-label="Telegram" href="https://t.me" className="flex h-9 w-9 items-center justify-center rounded-md border border-[#229ed9]/40 text-[#229ed9] transition hover:border-[#229ed9] hover:bg-[#229ed9] hover:text-white"><TelegramMark /></a></div>
        </div>
      </div>
    </footer>
  );
}
